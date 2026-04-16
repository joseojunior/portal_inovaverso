"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth/admin-session";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import type { TagActionState } from "@/features/tags/server/action-state";

const tagSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres."),
  slug: z.string().trim().optional(),
  description: z
    .string()
    .trim()
    .max(280, "A descrição deve ter no máximo 280 caracteres.")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean()
});

function normalizeOptional(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function buildSlug(name: string, incomingSlug?: string) {
  return slugify(incomingSlug && incomingSlug.trim().length > 0 ? incomingSlug : name);
}

export async function upsertTagAction(_: TagActionState, formData: FormData): Promise<TagActionState> {
  await requireAdminUser();

  const parsed = tagSchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos da tag.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const data = parsed.data;
  const slug = buildSlug(data.name, data.slug);

  if (!slug) {
    return {
      status: "error",
      message: "Não foi possível gerar um slug válido para a tag.",
      fieldErrors: {
        slug: ["Informe um nome ou slug válido."]
      }
    };
  }

  const slugOwner = await db.tag.findUnique({
    where: { slug },
    select: { id: true }
  });

  if (slugOwner && slugOwner.id !== data.id) {
    return {
      status: "error",
      message: "Já existe uma tag usando este slug.",
      fieldErrors: {
        slug: ["Use outro slug ou ajuste o nome da tag."]
      }
    };
  }

  const payload = {
    name: data.name.trim(),
    slug,
    description: normalizeOptional(data.description),
    isActive: data.isActive
  };

  if (data.id) {
    await db.tag.update({
      where: { id: data.id },
      data: payload
    });
  } else {
    await db.tag.create({
      data: payload
    });
  }

  revalidatePath("/admin/tags");

  return {
    status: "success",
    message: data.id ? "Tag atualizada com sucesso." : "Tag criada com sucesso."
  };
}

export async function toggleTagStatusAction(tagId: string, nextIsActive: boolean) {
  await requireAdminUser();

  await db.tag.update({
    where: { id: tagId },
    data: { isActive: nextIsActive }
  });

  revalidatePath("/admin/tags");

  return {
    status: "success" as const,
    message: nextIsActive ? "Tag ativada com sucesso." : "Tag desativada com sucesso."
  };
}
