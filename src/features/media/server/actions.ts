"use server";

import { AuditAction, AuditEntityType, MediaStatus, MediaType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth/admin-session";
import { db } from "@/lib/db";
import { normalizeVideoEmbedInput } from "@/lib/media/video-embed";
import { getMediaBucketName, getSupabaseAdminClient } from "@/lib/storage/supabase-admin";
import type { MediaActionState } from "@/features/media/server/action-state";

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || /^https?:\/\/.+/i.test(value), "Informe uma URL valida comecando com http:// ou https://.");

const sharedMetadataSchema = {
  altText: z.string().trim().max(180, "O alt text deve ter no maximo 180 caracteres.").optional().or(z.literal("")),
  caption: z.string().trim().max(280, "A legenda deve ter no maximo 280 caracteres.").optional().or(z.literal("")),
  credit: z.string().trim().max(120, "O credito deve ter no maximo 120 caracteres.").optional().or(z.literal("")),
  sourceUrl: optionalUrlSchema,
  sourceName: z.string().trim().max(120, "O nome da fonte deve ter no maximo 120 caracteres.").optional().or(z.literal(""))
};

const uploadMediaSchema = z.object(sharedMetadataSchema);

const createEmbedSchema = z.object({
  ...sharedMetadataSchema,
  embedInput: z.string().trim().min(1, "Informe a URL do video embedado.")
});

const updateMediaSchema = z.object({
  id: z.string().min(1),
  altText: z.string().trim().max(180, "O alt text deve ter no maximo 180 caracteres.").optional().or(z.literal("")),
  caption: z.string().trim().max(280, "A legenda deve ter no maximo 280 caracteres.").optional().or(z.literal("")),
  credit: z.string().trim().max(120, "O credito deve ter no maximo 120 caracteres.").optional().or(z.literal("")),
  sourceUrl: optionalUrlSchema,
  sourceName: z.string().trim().max(120, "O nome da fonte deve ter no maximo 120 caracteres.").optional().or(z.literal("")),
  embedInput: z.string().trim().optional().or(z.literal("")),
  status: z.nativeEnum(MediaStatus)
});

function normalizeOptional(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function sanitizeFilename(filename: string) {
  return filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildStorageKey(filename: string) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const safeFilename = sanitizeFilename(filename || "imagem");

  return `images/${year}/${month}/${crypto.randomUUID()}-${safeFilename}`;
}

function buildEmbedStorageKey(provider: string, videoId: string) {
  return `embeds/${provider}/${videoId}-${crypto.randomUUID()}`;
}

export async function uploadImageAction(_: MediaActionState, formData: FormData): Promise<MediaActionState> {
  const adminUser = await requireAdminUser();

  const parsed = uploadMediaSchema.safeParse({
    altText: String(formData.get("altText") ?? ""),
    caption: String(formData.get("caption") ?? ""),
    credit: String(formData.get("credit") ?? ""),
    sourceUrl: String(formData.get("sourceUrl") ?? ""),
    sourceName: String(formData.get("sourceName") ?? "")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os metadados da imagem.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return {
      status: "error",
      message: "Selecione uma imagem para upload.",
      fieldErrors: {
        file: ["Escolha um arquivo de imagem valido."]
      }
    };
  }

  if (!file.type.startsWith("image/")) {
    return {
      status: "error",
      message: "O upload inicial suporta apenas imagens.",
      fieldErrors: {
        file: ["Envie um arquivo com MIME type de imagem."]
      }
    };
  }

  const storageKey = buildStorageKey(file.name);
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() ?? null : null;

  try {
    const supabase = getSupabaseAdminClient();
    const bucket = getMediaBucketName();
    const bytes = Buffer.from(await file.arrayBuffer());

    const uploadResult = await supabase.storage.from(bucket).upload(storageKey, bytes, {
      contentType: file.type,
      upsert: false
    });

    if (uploadResult.error) {
      return {
        status: "error",
        message: `Falha ao enviar a imagem para o storage: ${uploadResult.error.message}`
      };
    }

    const publicUrlResult = supabase.storage.from(bucket).getPublicUrl(storageKey);
    const publicUrl = publicUrlResult.data.publicUrl;

    const mediaFile = await db.mediaFile.create({
      data: {
        uploadedByAdminId: adminUser.id,
        type: MediaType.IMAGE,
        status: MediaStatus.PENDING_REVIEW,
        storageProvider: "supabase",
        storageKey,
        url: publicUrl,
        mimeType: file.type,
        originalFilename: file.name,
        extension,
        sizeBytes: BigInt(file.size),
        altText: normalizeOptional(parsed.data.altText),
        caption: normalizeOptional(parsed.data.caption),
        credit: normalizeOptional(parsed.data.credit),
        sourceUrl: normalizeOptional(parsed.data.sourceUrl),
        sourceName: normalizeOptional(parsed.data.sourceName)
      }
    });

    await db.auditLog.create({
      data: {
        adminUserId: adminUser.id,
        entityType: AuditEntityType.MEDIA_FILE,
        entityId: mediaFile.id,
        action: AuditAction.CREATE,
        description: "Imagem registrada na biblioteca de midia.",
        metadata: {
          type: mediaFile.type,
          status: mediaFile.status,
          url: mediaFile.url
        }
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha inesperada no upload.";

    return {
      status: "error",
      message
    };
  }

  revalidatePath("/admin/media");

  return {
    status: "success",
    message: "Imagem enviada e registrada com status pending_review."
  };
}

export async function createEmbeddedVideoAction(_: MediaActionState, formData: FormData): Promise<MediaActionState> {
  const adminUser = await requireAdminUser();

  const parsed = createEmbedSchema.safeParse({
    altText: String(formData.get("altText") ?? ""),
    caption: String(formData.get("caption") ?? ""),
    credit: String(formData.get("credit") ?? ""),
    sourceUrl: String(formData.get("sourceUrl") ?? ""),
    sourceName: String(formData.get("sourceName") ?? ""),
    embedInput: String(formData.get("embedInput") ?? "")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os dados do video embedado.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const embedData = normalizeVideoEmbedInput(parsed.data.embedInput);

  if (!embedData) {
    return {
      status: "error",
      message: "O video informado nao e suportado nesta etapa.",
      fieldErrors: {
        embedInput: ["Use uma URL valida de YouTube ou Vimeo."]
      }
    };
  }

  const mediaFile = await db.mediaFile.create({
    data: {
      uploadedByAdminId: adminUser.id,
      type: MediaType.VIDEO,
      status: MediaStatus.PENDING_REVIEW,
      storageProvider: "embed",
      storageKey: buildEmbedStorageKey(embedData.provider, embedData.videoId),
      url: embedData.canonicalUrl,
      embedUrl: embedData.embedUrl,
      thumbnailUrl: embedData.thumbnailUrl,
      mimeType: "text/html",
      originalFilename: `${embedData.provider}-${embedData.videoId}`,
      altText: normalizeOptional(parsed.data.altText),
      caption: normalizeOptional(parsed.data.caption),
      credit: normalizeOptional(parsed.data.credit),
      sourceUrl: normalizeOptional(parsed.data.sourceUrl) ?? embedData.canonicalUrl,
      sourceName: normalizeOptional(parsed.data.sourceName) ?? embedData.providerLabel
    }
  });

  await db.auditLog.create({
    data: {
      adminUserId: adminUser.id,
      entityType: AuditEntityType.MEDIA_FILE,
      entityId: mediaFile.id,
      action: AuditAction.CREATE,
      description: "Video embedado registrado na biblioteca de midia.",
      metadata: {
        type: mediaFile.type,
        status: mediaFile.status,
        url: mediaFile.url,
        embedUrl: mediaFile.embedUrl
      }
    }
  });

  revalidatePath("/admin/media");

  return {
    status: "success",
    message: "Video embedado registrado com status pending_review."
  };
}

export async function updateMediaMetadataAction(_: MediaActionState, formData: FormData): Promise<MediaActionState> {
  const adminUser = await requireAdminUser();

  const parsed = updateMediaSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    altText: String(formData.get("altText") ?? ""),
    caption: String(formData.get("caption") ?? ""),
    credit: String(formData.get("credit") ?? ""),
    sourceUrl: String(formData.get("sourceUrl") ?? ""),
    sourceName: String(formData.get("sourceName") ?? ""),
    embedInput: String(formData.get("embedInput") ?? ""),
    status: String(formData.get("status") ?? MediaStatus.PENDING_REVIEW)
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos da midia.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const currentMedia = await db.mediaFile.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      type: true,
      status: true
    }
  });

  if (!currentMedia) {
    return {
      status: "error",
      message: "A midia selecionada nao existe mais."
    };
  }

  let embedPatch: { url?: string; embedUrl?: string | null; thumbnailUrl?: string | null; sourceName?: string | null; sourceUrl?: string | null } = {};

  if (currentMedia.type === MediaType.VIDEO && parsed.data.embedInput) {
    const embedData = normalizeVideoEmbedInput(parsed.data.embedInput);

    if (!embedData) {
      return {
        status: "error",
        message: "O video informado nao e suportado.",
        fieldErrors: {
          embedInput: ["Use uma URL valida de YouTube ou Vimeo."]
        }
      };
    }

    embedPatch = {
      url: embedData.canonicalUrl,
      embedUrl: embedData.embedUrl,
      thumbnailUrl: embedData.thumbnailUrl,
      sourceUrl: normalizeOptional(parsed.data.sourceUrl) ?? embedData.canonicalUrl,
      sourceName: normalizeOptional(parsed.data.sourceName) ?? embedData.providerLabel
    };
  }

  const updatedMedia = await db.mediaFile.update({
    where: { id: parsed.data.id },
    data: {
      altText: normalizeOptional(parsed.data.altText),
      caption: normalizeOptional(parsed.data.caption),
      credit: normalizeOptional(parsed.data.credit),
      sourceUrl: embedPatch.sourceUrl ?? normalizeOptional(parsed.data.sourceUrl),
      sourceName: embedPatch.sourceName ?? normalizeOptional(parsed.data.sourceName),
      status: parsed.data.status,
      ...embedPatch
    }
  });

  const auditAction =
    currentMedia.status !== parsed.data.status
      ? parsed.data.status === MediaStatus.APPROVED
        ? AuditAction.APPROVE
        : parsed.data.status === MediaStatus.REJECTED
          ? AuditAction.REJECT
          : AuditAction.UPDATE
      : AuditAction.UPDATE;

  await db.auditLog.create({
    data: {
      adminUserId: adminUser.id,
      entityType: AuditEntityType.MEDIA_FILE,
      entityId: updatedMedia.id,
      action: auditAction,
      description:
        auditAction === AuditAction.APPROVE
          ? "Midia aprovada na biblioteca."
          : auditAction === AuditAction.REJECT
            ? "Midia rejeitada na biblioteca."
            : "Metadados da midia atualizados.",
      metadata: {
        type: updatedMedia.type,
        previousStatus: currentMedia.status,
        nextStatus: updatedMedia.status
      }
    }
  });

  revalidatePath("/admin/media");

  return {
    status: "success",
    message: "Metadados da midia atualizados com sucesso."
  };
}
