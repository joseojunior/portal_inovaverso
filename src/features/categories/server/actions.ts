"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth/admin-session";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import type { CategoryActionState } from "@/features/categories/server/action-state";

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres."),
  slug: z.string().trim().optional(),
  description: z
    .string()
    .trim()
    .max(280, "A descrição deve ter no máximo 280 caracteres.")
    .optional()
    .or(z.literal("")),
  seoTitle: z
    .string()
    .trim()
    .max(70, "O SEO title deve ter no máximo 70 caracteres.")
    .optional()
    .or(z.literal("")),
  seoDescription: z
    .string()
    .trim()
    .max(160, "A SEO description deve ter no máximo 160 caracteres.")
    .optional()
    .or(z.literal("")),
  parentId: z.string().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0, "A ordem não pode ser negativa."),
  isActive: z.boolean()
});

function normalizeOptional(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function buildSlug(name: string, incomingSlug?: string) {
  return slugify(incomingSlug && incomingSlug.trim().length > 0 ? incomingSlug : name);
}

export async function upsertCategoryAction(
  _: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  await requireAdminUser();

  const parsed = categorySchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    seoTitle: String(formData.get("seoTitle") ?? ""),
    seoDescription: String(formData.get("seoDescription") ?? ""),
    parentId: String(formData.get("parentId") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? "0"),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos do formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const data = parsed.data;
  const slug = buildSlug(data.name, data.slug);

  if (!slug) {
    return {
      status: "error",
      message: "Não foi possível gerar um slug válido para a categoria.",
      fieldErrors: {
        slug: ["Informe um nome ou slug válido."]
      }
    };
  }

  if (data.id && data.parentId && data.parentId === data.id) {
    return {
      status: "error",
      message: "Uma categoria não pode ser pai dela mesma.",
      fieldErrors: {
        parentId: ["Selecione outra categoria pai."]
      }
    };
  }

  const slugOwner = await db.category.findUnique({
    where: { slug },
    select: { id: true }
  });

  if (slugOwner && slugOwner.id !== data.id) {
    return {
      status: "error",
      message: "Já existe uma categoria usando este slug.",
      fieldErrors: {
        slug: ["Use outro slug ou ajuste o nome da categoria."]
      }
    };
  }

  if (data.parentId) {
    const parent = await db.category.findUnique({
      where: { id: data.parentId },
      select: { id: true }
    });

    if (!parent) {
      return {
        status: "error",
        message: "A categoria pai selecionada não existe mais.",
        fieldErrors: {
          parentId: ["Selecione uma categoria pai válida."]
        }
      };
    }
  }

  const payload = {
    name: data.name.trim(),
    slug,
    description: normalizeOptional(data.description),
    seoTitle: normalizeOptional(data.seoTitle),
    seoDescription: normalizeOptional(data.seoDescription),
    parentId: normalizeOptional(data.parentId),
    sortOrder: data.sortOrder,
    isActive: data.isActive
  };

  if (data.id) {
    await db.category.update({
      where: { id: data.id },
      data: payload
    });
  } else {
    await db.category.create({
      data: payload
    });
  }

  revalidatePath("/admin/categories");

  return {
    status: "success",
    message: data.id ? "Categoria atualizada com sucesso." : "Categoria criada com sucesso."
  };
}

export async function toggleCategoryStatusAction(categoryId: string, nextIsActive: boolean) {
  await requireAdminUser();

  await db.category.update({
    where: { id: categoryId },
    data: { isActive: nextIsActive }
  });

  revalidatePath("/admin/categories");

  return {
    status: "success" as const,
    message: nextIsActive ? "Categoria ativada com sucesso." : "Categoria desativada com sucesso."
  };
}
