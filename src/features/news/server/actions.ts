"use server";

import { AuditAction, AuditEntityType, NewsStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth/admin-session";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import type { NewsActionState } from "@/features/news/server/action-state";

const editableRoles = new Set(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
const elevatedRoles = new Set(["SUPER_ADMIN", "ADMIN"]);
const editorAllowedStatuses = new Set<NewsStatus>([
  NewsStatus.DRAFT,
  NewsStatus.PENDING_REVIEW,
  NewsStatus.REJECTED,
  NewsStatus.ARCHIVED
]);

const newsSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(8, "Informe um titulo com pelo menos 8 caracteres."),
  subtitle: z.string().trim().max(180, "O subtitulo deve ter no maximo 180 caracteres.").optional().or(z.literal("")),
  slug: z.string().trim().optional(),
  summary: z.string().trim().max(320, "O resumo deve ter no maximo 320 caracteres.").optional().or(z.literal("")),
  content: z
    .string()
    .trim()
    .min(40, "O conteudo deve ter pelo menos 40 caracteres.")
    .max(40000, "O conteudo excede o limite suportado para esta etapa.")
    .optional()
    .or(z.literal("")),
  status: z.nativeEnum(NewsStatus),
  categoryId: z.string().min(1, "Selecione uma categoria."),
  authorId: z.string().min(1, "Selecione um autor."),
  stateId: z.string().optional().or(z.literal("")),
  cityId: z.string().optional().or(z.literal("")),
  seoTitle: z.string().trim().max(70, "O SEO title deve ter no maximo 70 caracteres.").optional().or(z.literal("")),
  seoDescription: z
    .string()
    .trim()
    .max(160, "A SEO description deve ter no maximo 160 caracteres.")
    .optional()
    .or(z.literal("")),
  featuredMediaId: z.string().optional().or(z.literal("")),
  commentsEnabled: z.boolean(),
  tagIds: z.array(z.string()).default([]),
  mediaIds: z.array(z.string()).default([])
});

function normalizeOptional(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function buildSlug(title: string, incomingSlug?: string) {
  return slugify(incomingSlug && incomingSlug.trim().length > 0 ? incomingSlug : title);
}

function canAssignStatus(role: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "MODERATOR", status: NewsStatus) {
  if (!editableRoles.has(role) || status === NewsStatus.DRAFT_AI) {
    return false;
  }

  if (elevatedRoles.has(role)) {
    return true;
  }

  return editorAllowedStatuses.has(status);
}

function inferAuditAction(status: NewsStatus) {
  switch (status) {
    case NewsStatus.APPROVED:
      return AuditAction.APPROVE;
    case NewsStatus.REJECTED:
      return AuditAction.REJECT;
    case NewsStatus.PUBLISHED:
      return AuditAction.PUBLISH;
    case NewsStatus.ARCHIVED:
      return AuditAction.ARCHIVE;
    default:
      return AuditAction.UPDATE;
  }
}

export async function upsertNewsAction(_: NewsActionState, formData: FormData): Promise<NewsActionState> {
  const adminUser = await requireAdminUser();

  if (!editableRoles.has(adminUser.role)) {
    return {
      status: "error",
      message: "Seu perfil administrativo nao pode editar noticias."
    };
  }

  const parsed = newsSchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    title: String(formData.get("title") ?? ""),
    subtitle: String(formData.get("subtitle") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    content: String(formData.get("content") ?? ""),
    status: String(formData.get("status") ?? NewsStatus.DRAFT),
    categoryId: String(formData.get("categoryId") ?? ""),
    authorId: String(formData.get("authorId") ?? ""),
    stateId: String(formData.get("stateId") ?? ""),
    cityId: String(formData.get("cityId") ?? ""),
    seoTitle: String(formData.get("seoTitle") ?? ""),
    seoDescription: String(formData.get("seoDescription") ?? ""),
    featuredMediaId: String(formData.get("featuredMediaId") ?? ""),
    commentsEnabled: formData.get("commentsEnabled") === "on",
    tagIds: formData.getAll("tagIds").map((value) => String(value)),
    mediaIds: formData.getAll("mediaIds").map((value) => String(value))
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos da noticia.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const data = parsed.data;
  const slug = buildSlug(data.title, data.slug);

  if (!slug) {
    return {
      status: "error",
      message: "Nao foi possivel gerar um slug valido para a noticia.",
      fieldErrors: {
        slug: ["Informe um titulo ou slug valido."]
      }
    };
  }

  if (!canAssignStatus(adminUser.role, data.status)) {
    return {
      status: "error",
      message: "Seu perfil nao pode salvar noticias com esse status.",
      fieldErrors: {
        status: ["Escolha um status compativel com o seu papel administrativo."]
      }
    };
  }

  const currentNews = data.id
    ? await db.news.findUnique({
        where: { id: data.id },
        select: {
          id: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
          scheduledAt: true,
          publishedAt: true,
          archivedAt: true
        }
      })
    : null;

  if (data.id && !currentNews) {
    return {
      status: "error",
      message: "A noticia selecionada nao existe mais."
    };
  }

  const slugOwner = await db.news.findUnique({
    where: { slug },
    select: { id: true }
  });

  if (slugOwner && slugOwner.id !== data.id) {
    return {
      status: "error",
      message: "Ja existe uma noticia usando este slug.",
      fieldErrors: {
        slug: ["Use outro slug ou ajuste o titulo."]
      }
    };
  }

  const uniqueTagIds = Array.from(new Set(data.tagIds));
  const uniqueMediaIds = Array.from(new Set(data.mediaIds));

  const [category, author, state, city, tags, mediaFiles] = await Promise.all([
    db.category.findUnique({
      where: { id: data.categoryId },
      select: { id: true }
    }),
    db.author.findUnique({
      where: { id: data.authorId },
      select: { id: true }
    }),
    data.stateId
      ? db.state.findUnique({
          where: { id: data.stateId },
          select: { id: true, countryId: true }
        })
      : Promise.resolve(null),
    data.cityId
      ? db.city.findUnique({
          where: { id: data.cityId },
          select: { id: true, stateId: true, countryId: true }
        })
      : Promise.resolve(null),
    uniqueTagIds.length > 0
      ? db.tag.findMany({
          where: { id: { in: uniqueTagIds } },
          select: { id: true }
        })
      : Promise.resolve([]),
    uniqueMediaIds.length > 0 || data.featuredMediaId
      ? db.mediaFile.findMany({
          where: {
            id: {
              in: Array.from(new Set([...(data.featuredMediaId ? [data.featuredMediaId] : []), ...uniqueMediaIds]))
            }
          },
          select: {
            id: true,
            type: true,
            status: true
          }
        })
      : Promise.resolve([])
  ]);

  if (!category) {
    return {
      status: "error",
      message: "A categoria selecionada nao existe mais.",
      fieldErrors: {
        categoryId: ["Selecione uma categoria valida."]
      }
    };
  }

  if (!author) {
    return {
      status: "error",
      message: "O autor selecionado nao existe mais.",
      fieldErrors: {
        authorId: ["Selecione um autor valido."]
      }
    };
  }

  if (data.stateId && !state) {
    return {
      status: "error",
      message: "O estado selecionado nao existe mais.",
      fieldErrors: {
        stateId: ["Selecione um estado valido."]
      }
    };
  }

  if (data.cityId && !city) {
    return {
      status: "error",
      message: "A cidade selecionada nao existe mais.",
      fieldErrors: {
        cityId: ["Selecione uma cidade valida."]
      }
    };
  }

  if (city && state && city.stateId !== state.id) {
    return {
      status: "error",
      message: "A cidade selecionada nao pertence ao estado informado.",
      fieldErrors: {
        cityId: ["Escolha uma cidade compativel com o estado selecionado."]
      }
    };
  }

  if (tags.length !== uniqueTagIds.length) {
    return {
      status: "error",
      message: "Uma ou mais tags selecionadas nao existem mais.",
      fieldErrors: {
        tagIds: ["Revise a selecao de tags."]
      }
    };
  }

  const mediaById = new Map(mediaFiles.map((media) => [media.id, media]));
  const featuredMedia = data.featuredMediaId ? mediaById.get(data.featuredMediaId) : null;

  if (data.featuredMediaId && !featuredMedia) {
    return {
      status: "error",
      message: "A midia principal selecionada nao existe mais.",
      fieldErrors: {
        featuredMediaId: ["Selecione uma midia valida para destaque."]
      }
    };
  }

  if (data.status === NewsStatus.PUBLISHED) {
    const invalidMedia = mediaFiles.find((media) => media.status !== "APPROVED");

    if (invalidMedia) {
      return {
        status: "error",
        message: "Nao e possivel publicar noticia com midia ainda nao aprovada.",
        fieldErrors: {
          mediaIds: ["Aprove a midia selecionada antes de publicar."]
        }
      };
    }
  }

  const relatedMediaIds = Array.from(new Set([...(data.featuredMediaId ? [data.featuredMediaId] : []), ...uniqueMediaIds]));
  const nextStateId = city ? city.stateId : state?.id ?? null;
  const nextCountryId = city ? city.countryId : state?.countryId ?? null;
  const now = new Date();
  const previousStatus = currentNews?.status ?? null;
  const statusChanged = previousStatus !== data.status;

  try {
    await db.$transaction(async (tx) => {
      const news = data.id
        ? await tx.news.update({
            where: { id: data.id },
            data: {
              title: data.title.trim(),
              subtitle: normalizeOptional(data.subtitle),
              slug,
              summary: normalizeOptional(data.summary),
              content: normalizeOptional(data.content),
              status: data.status,
              categoryId: category.id,
              authorId: author.id,
              featuredMediaId: data.featuredMediaId || null,
              countryId: nextCountryId,
              stateId: nextStateId,
              cityId: city?.id ?? null,
              seoTitle: normalizeOptional(data.seoTitle),
              seoDescription: normalizeOptional(data.seoDescription),
              commentsEnabled: data.commentsEnabled,
              isAiAssisted: false,
              updatedByAdminId: adminUser.id,
              submittedAt: data.status === NewsStatus.PENDING_REVIEW ? currentNews?.submittedAt ?? now : currentNews?.submittedAt ?? null,
              reviewedAt:
                data.status === NewsStatus.APPROVED ||
                data.status === NewsStatus.REJECTED ||
                data.status === NewsStatus.SCHEDULED ||
                data.status === NewsStatus.PUBLISHED
                  ? currentNews?.reviewedAt ?? now
                  : null,
              reviewedByAdminId:
                data.status === NewsStatus.APPROVED ||
                data.status === NewsStatus.REJECTED ||
                data.status === NewsStatus.SCHEDULED ||
                data.status === NewsStatus.PUBLISHED
                  ? elevatedRoles.has(adminUser.role)
                    ? adminUser.id
                    : null
                  : null,
              scheduledAt: data.status === NewsStatus.SCHEDULED ? currentNews?.scheduledAt ?? now : null,
              publishedAt: data.status === NewsStatus.PUBLISHED ? currentNews?.publishedAt ?? now : null,
              publishedByAdminId: data.status === NewsStatus.PUBLISHED && elevatedRoles.has(adminUser.role) ? adminUser.id : null,
              archivedAt: data.status === NewsStatus.ARCHIVED ? currentNews?.archivedAt ?? now : null
            }
          })
        : await tx.news.create({
            data: {
              title: data.title.trim(),
              subtitle: normalizeOptional(data.subtitle),
              slug,
              summary: normalizeOptional(data.summary),
              content: normalizeOptional(data.content),
              status: data.status,
              categoryId: category.id,
              authorId: author.id,
              featuredMediaId: data.featuredMediaId || null,
              countryId: nextCountryId,
              stateId: nextStateId,
              cityId: city?.id ?? null,
              seoTitle: normalizeOptional(data.seoTitle),
              seoDescription: normalizeOptional(data.seoDescription),
              commentsEnabled: data.commentsEnabled,
              isAiAssisted: false,
              createdByAdminId: adminUser.id,
              submittedAt: data.status === NewsStatus.PENDING_REVIEW ? now : null,
              reviewedAt:
                data.status === NewsStatus.APPROVED ||
                data.status === NewsStatus.REJECTED ||
                data.status === NewsStatus.SCHEDULED ||
                data.status === NewsStatus.PUBLISHED
                  ? now
                  : null,
              reviewedByAdminId:
                data.status === NewsStatus.APPROVED ||
                data.status === NewsStatus.REJECTED ||
                data.status === NewsStatus.SCHEDULED ||
                data.status === NewsStatus.PUBLISHED
                  ? elevatedRoles.has(adminUser.role)
                    ? adminUser.id
                    : null
                  : null,
              scheduledAt: data.status === NewsStatus.SCHEDULED ? now : null,
              publishedAt: data.status === NewsStatus.PUBLISHED ? now : null,
              publishedByAdminId: data.status === NewsStatus.PUBLISHED && elevatedRoles.has(adminUser.role) ? adminUser.id : null,
              archivedAt: data.status === NewsStatus.ARCHIVED ? now : null
            }
          });

      await tx.newsTag.deleteMany({
        where: { newsId: news.id }
      });

      if (uniqueTagIds.length > 0) {
        await tx.newsTag.createMany({
          data: uniqueTagIds.map((tagId) => ({
            newsId: news.id,
            tagId
          }))
        });
      }

      await tx.newsMedia.deleteMany({
        where: { newsId: news.id }
      });

      if (relatedMediaIds.length > 0) {
        await tx.newsMedia.createMany({
          data: relatedMediaIds.map((mediaId, index) => ({
            newsId: news.id,
            mediaFileId: mediaId,
            position: mediaId === data.featuredMediaId ? 0 : index + (data.featuredMediaId ? 1 : 0)
          }))
        });
      }

      await tx.auditLog.create({
        data: {
          adminUserId: adminUser.id,
          entityType: AuditEntityType.NEWS,
          entityId: news.id,
          action: data.id ? (statusChanged ? inferAuditAction(data.status) : AuditAction.UPDATE) : AuditAction.CREATE,
          description: data.id
            ? `Noticia ${statusChanged ? "atualizada com mudanca de status" : "atualizada"} no admin.`
            : "Noticia criada no admin.",
          metadata: {
            title: news.title,
            slug: news.slug,
            status: news.status,
            categoryId: news.categoryId,
            authorId: news.authorId,
            tagIds: uniqueTagIds,
            featuredMediaId: data.featuredMediaId || null,
            mediaIds: relatedMediaIds
          }
        }
      });

      if (!data.id || statusChanged) {
        await tx.publicationHistory.create({
          data: {
            newsId: news.id,
            adminUserId: adminUser.id,
            previousStatus: previousStatus ?? NewsStatus.DRAFT,
            nextStatus: news.status,
            titleSnapshot: news.title,
            slugSnapshot: news.slug,
            effectiveAt:
              news.status === NewsStatus.PUBLISHED
                ? news.publishedAt
                : news.status === NewsStatus.SCHEDULED
                  ? news.scheduledAt
                  : news.status === NewsStatus.ARCHIVED
                    ? news.archivedAt
                    : null,
            note: data.id ? "Atualizacao editorial via admin." : "Criacao inicial via admin."
          }
        });
      }
    });
  } catch {
    return {
      status: "error",
      message: "Nao foi possivel salvar a noticia. Tente novamente."
    };
  }

  revalidatePath("/admin/news");

  return {
    status: "success",
    message: data.id ? "Noticia atualizada com sucesso." : "Noticia criada com sucesso."
  };
}
