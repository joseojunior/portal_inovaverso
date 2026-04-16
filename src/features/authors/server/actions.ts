"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth/admin-session";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import type { AuthorActionState } from "@/features/authors/server/action-state";

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || /^https?:\/\/.+/i.test(value), "Informe uma URL válida começando com http:// ou https://.");

const authorSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres."),
  slug: z.string().trim().optional(),
  avatarUrl: optionalUrlSchema,
  bio: z
    .string()
    .trim()
    .max(600, "A biografia deve ter no máximo 600 caracteres.")
    .optional()
    .or(z.literal("")),
  websiteUrl: optionalUrlSchema,
  instagramUrl: optionalUrlSchema,
  linkedinUrl: optionalUrlSchema,
  xUrl: optionalUrlSchema,
  isActive: z.boolean()
});

type SocialLinksRecord = Record<string, string>;

function normalizeOptional(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function buildSlug(name: string, incomingSlug?: string) {
  return slugify(incomingSlug && incomingSlug.trim().length > 0 ? incomingSlug : name);
}

function buildSocialLinks(data: {
  websiteUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  xUrl?: string;
}) {
  const links: SocialLinksRecord = {};

  if (data.websiteUrl) links.website = data.websiteUrl.trim();
  if (data.instagramUrl) links.instagram = data.instagramUrl.trim();
  if (data.linkedinUrl) links.linkedin = data.linkedinUrl.trim();
  if (data.xUrl) links.x = data.xUrl.trim();

  return Object.keys(links).length > 0 ? links : null;
}

export async function upsertAuthorAction(
  _: AuthorActionState,
  formData: FormData
): Promise<AuthorActionState> {
  await requireAdminUser();

  const parsed = authorSchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    avatarUrl: String(formData.get("avatarUrl") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    websiteUrl: String(formData.get("websiteUrl") ?? ""),
    instagramUrl: String(formData.get("instagramUrl") ?? ""),
    linkedinUrl: String(formData.get("linkedinUrl") ?? ""),
    xUrl: String(formData.get("xUrl") ?? ""),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos do autor.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const data = parsed.data;
  const slug = buildSlug(data.name, data.slug);

  if (!slug) {
    return {
      status: "error",
      message: "Não foi possível gerar um slug válido para o autor.",
      fieldErrors: {
        slug: ["Informe um nome ou slug válido."]
      }
    };
  }

  const slugOwner = await db.author.findUnique({
    where: { slug },
    select: { id: true }
  });

  if (slugOwner && slugOwner.id !== data.id) {
    return {
      status: "error",
      message: "Já existe um autor com esse slug.",
      fieldErrors: {
        slug: ["Use outro slug para este autor."]
      }
    };
  }

  const payload = {
    name: data.name.trim(),
    slug,
    avatarUrl: normalizeOptional(data.avatarUrl),
    bio: normalizeOptional(data.bio),
    socialLinks: buildSocialLinks(data) ?? Prisma.JsonNull,
    isActive: data.isActive
  };

  if (data.id) {
    await db.author.update({
      where: { id: data.id },
      data: payload
    });
  } else {
    await db.author.create({
      data: payload
    });
  }

  revalidatePath("/admin/authors");

  return {
    status: "success",
    message: data.id ? "Autor atualizado com sucesso." : "Autor criado com sucesso."
  };
}

export async function toggleAuthorStatusAction(authorId: string, nextIsActive: boolean) {
  await requireAdminUser();

  await db.author.update({
    where: { id: authorId },
    data: { isActive: nextIsActive }
  });

  revalidatePath("/admin/authors");

  return {
    status: "success" as const,
    message: nextIsActive ? "Autor ativado com sucesso." : "Autor desativado com sucesso."
  };
}
