"use server";

import { AuditAction, AuditEntityType, AIDraftStatus, NewsStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { AIDraftReviewActionState, AIConfigActionState } from "@/features/ai/server/action-state";
import { requireAdminUser } from "@/lib/auth/admin-session";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";

const aiManagerRoles = new Set(["SUPER_ADMIN", "ADMIN"]);

const aiSearchConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(3, "Informe um nome com pelo menos 3 caracteres."),
  description: z.string().trim().max(400, "A descricao deve ter no maximo 400 caracteres.").optional().or(z.literal("")),
  query: z.string().trim().min(3, "Informe uma consulta base para a configuracao."),
  categoryId: z.string().optional().or(z.literal("")),
  countryId: z.string().optional().or(z.literal("")),
  stateId: z.string().optional().or(z.literal("")),
  cityId: z.string().optional().or(z.literal("")),
  languageCode: z.string().trim().max(8, "Use ate 8 caracteres para o idioma.").optional().or(z.literal("")),
  lookbackHours: z.coerce.number().int().min(1, "Informe pelo menos 1 hora.").max(720, "Use no maximo 720 horas.").optional(),
  maxSourcesPerRun: z.coerce.number().int().min(1, "Use pelo menos 1 fonte.").max(100, "Use no maximo 100 fontes.").optional(),
  cronExpression: z.string().trim().max(120, "A expressao cron nao pode exceder 120 caracteres.").optional().or(z.literal("")),
  sourceDomains: z.string().optional().or(z.literal("")),
  excludedDomains: z.string().optional().or(z.literal("")),
  keywords: z.string().optional().or(z.literal("")),
  excludedKeywords: z.string().optional().or(z.literal("")),
  isActive: z.boolean()
});

const aiDraftReviewSchema = z.object({
  id: z.string().min(1),
  reviewNotes: z.string().trim().max(1200, "Use ate 1200 caracteres nas observacoes.").optional().or(z.literal("")),
  status: z.enum(["APPROVED", "REJECTED", "ARCHIVED"])
});

const convertAIDraftSchema = z.object({
  aiDraftId: z.string().min(1),
  title: z.string().trim().min(8, "Informe um titulo com pelo menos 8 caracteres."),
  subtitle: z.string().trim().max(180, "O subtitulo deve ter no maximo 180 caracteres.").optional().or(z.literal("")),
  slug: z.string().trim().optional().or(z.literal("")),
  summary: z.string().trim().max(320, "O resumo deve ter no maximo 320 caracteres.").optional().or(z.literal("")),
  content: z.string().trim().min(40, "O conteudo deve ter pelo menos 40 caracteres."),
  categoryId: z.string().min(1, "Selecione uma categoria."),
  authorId: z.string().min(1, "Selecione um autor."),
  stateId: z.string().optional().or(z.literal("")),
  cityId: z.string().optional().or(z.literal("")),
  seoTitle: z.string().trim().max(70, "O SEO title deve ter no maximo 70 caracteres.").optional().or(z.literal("")),
  seoDescription: z.string().trim().max(160, "A SEO description deve ter no maximo 160 caracteres.").optional().or(z.literal("")),
  reviewNotes: z.string().trim().max(1200, "Use ate 1200 caracteres nas observacoes.").optional().or(z.literal("")),
  commentsEnabled: z.boolean(),
  tagIds: z.array(z.string()).default([])
});

function ensureAIManager(role: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "MODERATOR") {
  return aiManagerRoles.has(role);
}

function normalizeOptional(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function splitList(value?: string) {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function buildDraftSlug(title: string, incomingSlug?: string) {
  return slugify(incomingSlug && incomingSlug.trim().length > 0 ? incomingSlug : title);
}

function mapDraftAuditAction(status: "APPROVED" | "REJECTED" | "ARCHIVED") {
  if (status === "APPROVED") return AuditAction.APPROVE;
  if (status === "REJECTED") return AuditAction.REJECT;
  return AuditAction.ARCHIVE;
}

function sourceLabelFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Fonte editorial";
  }
}

export async function upsertAISearchConfigAction(
  _: AIConfigActionState,
  formData: FormData
): Promise<AIConfigActionState> {
  const adminUser = await requireAdminUser();

  if (!ensureAIManager(adminUser.role)) {
    return { status: "error", message: "Seu perfil nao pode gerenciar configuracoes de IA." };
  }

  const parsed = aiSearchConfigSchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    query: String(formData.get("query") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    countryId: String(formData.get("countryId") ?? ""),
    stateId: String(formData.get("stateId") ?? ""),
    cityId: String(formData.get("cityId") ?? ""),
    languageCode: String(formData.get("languageCode") ?? ""),
    lookbackHours: formData.get("lookbackHours") ? String(formData.get("lookbackHours")) : undefined,
    maxSourcesPerRun: formData.get("maxSourcesPerRun") ? String(formData.get("maxSourcesPerRun")) : undefined,
    cronExpression: String(formData.get("cronExpression") ?? ""),
    sourceDomains: String(formData.get("sourceDomains") ?? ""),
    excludedDomains: String(formData.get("excludedDomains") ?? ""),
    keywords: String(formData.get("keywords") ?? ""),
    excludedKeywords: String(formData.get("excludedKeywords") ?? ""),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos da configuracao de IA.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const data = parsed.data;

  const [category, country, state, city] = await Promise.all([
    data.categoryId ? db.category.findUnique({ where: { id: data.categoryId }, select: { id: true } }) : Promise.resolve(null),
    data.countryId ? db.country.findUnique({ where: { id: data.countryId }, select: { id: true } }) : Promise.resolve(null),
    data.stateId ? db.state.findUnique({ where: { id: data.stateId }, select: { id: true, countryId: true } }) : Promise.resolve(null),
    data.cityId ? db.city.findUnique({ where: { id: data.cityId }, select: { id: true, stateId: true, countryId: true } }) : Promise.resolve(null)
  ]);

  if (data.categoryId && !category) {
    return { status: "error", message: "A categoria selecionada nao existe mais.", fieldErrors: { categoryId: ["Selecione uma categoria valida."] } };
  }

  if (data.countryId && !country) {
    return { status: "error", message: "O pais selecionado nao existe mais.", fieldErrors: { countryId: ["Selecione um pais valido."] } };
  }

  if (data.stateId && !state) {
    return { status: "error", message: "O estado selecionado nao existe mais.", fieldErrors: { stateId: ["Selecione um estado valido."] } };
  }

  if (data.cityId && !city) {
    return { status: "error", message: "A cidade selecionada nao existe mais.", fieldErrors: { cityId: ["Selecione uma cidade valida."] } };
  }

  if (city && state && city.stateId !== state.id) {
    return { status: "error", message: "A cidade selecionada nao pertence ao estado informado.", fieldErrors: { cityId: ["Escolha uma cidade compativel com o estado."] } };
  }

  if (state && country && state.countryId !== country.id) {
    return { status: "error", message: "O estado selecionado nao pertence ao pais informado.", fieldErrors: { stateId: ["Escolha um estado compativel com o pais."] } };
  }

  const nextCountryId = city ? city.countryId : state?.countryId ?? country?.id ?? null;
  const payload = {
    name: data.name.trim(),
    description: normalizeOptional(data.description),
    query: data.query.trim(),
    categoryId: data.categoryId || null,
    countryId: nextCountryId,
    stateId: city ? city.stateId : data.stateId || null,
    cityId: data.cityId || null,
    sourceDomains: splitList(data.sourceDomains),
    excludedDomains: splitList(data.excludedDomains),
    keywords: splitList(data.keywords),
    excludedKeywords: splitList(data.excludedKeywords),
    languageCode: normalizeOptional(data.languageCode),
    lookbackHours: data.lookbackHours ?? null,
    maxSourcesPerRun: data.maxSourcesPerRun ?? null,
    cronExpression: normalizeOptional(data.cronExpression),
    isActive: data.isActive,
    updatedByAdminId: adminUser.id
  };

  const config = data.id
    ? await db.aISearchConfig.update({ where: { id: data.id }, data: payload })
    : await db.aISearchConfig.create({ data: { ...payload, createdByAdminId: adminUser.id } });

  await db.auditLog.create({
    data: {
      adminUserId: adminUser.id,
      entityType: AuditEntityType.AI_SEARCH_CONFIG,
      entityId: config.id,
      action: data.id ? AuditAction.UPDATE : AuditAction.CREATE,
      description: data.id ? "Configuracao de IA atualizada no admin." : "Configuracao de IA criada no admin.",
      metadata: {
        name: config.name,
        query: config.query,
        isActive: config.isActive,
        categoryId: config.categoryId,
        countryId: config.countryId,
        stateId: config.stateId,
        cityId: config.cityId
      }
    }
  });

  revalidatePath("/admin/ai-configs");

  return {
    status: "success",
    message: data.id ? "Configuracao de IA atualizada com sucesso." : "Configuracao de IA criada com sucesso."
  };
}

export async function toggleAISearchConfigStatusAction(configId: string, nextIsActive: boolean) {
  const adminUser = await requireAdminUser();

  if (!ensureAIManager(adminUser.role)) {
    return { status: "error" as const, message: "Seu perfil nao pode gerenciar configuracoes de IA." };
  }

  const config = await db.aISearchConfig.update({
    where: { id: configId },
    data: { isActive: nextIsActive, updatedByAdminId: adminUser.id }
  });

  await db.auditLog.create({
    data: {
      adminUserId: adminUser.id,
      entityType: AuditEntityType.AI_SEARCH_CONFIG,
      entityId: config.id,
      action: AuditAction.UPDATE,
      description: `Configuracao de IA ${nextIsActive ? "ativada" : "desativada"} no admin.`,
      metadata: { isActive: config.isActive }
    }
  });

  revalidatePath("/admin/ai-configs");

  return {
    status: "success" as const,
    message: nextIsActive ? "Configuracao ativada com sucesso." : "Configuracao desativada com sucesso."
  };
}

export async function updateAIDraftReviewAction(
  _: AIDraftReviewActionState,
  formData: FormData
): Promise<AIDraftReviewActionState> {
  const adminUser = await requireAdminUser();

  if (!ensureAIManager(adminUser.role)) {
    return { status: "error", message: "Seu perfil nao pode revisar drafts de IA." };
  }

  const parsed = aiDraftReviewSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    reviewNotes: String(formData.get("reviewNotes") ?? ""),
    status: String(formData.get("status") ?? "")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os dados da moderacao do draft.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const draft = await db.aIDraft.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, status: true, newsId: true, suggestedTitle: true }
  });

  if (!draft) {
    return { status: "error", message: "O draft de IA nao existe mais." };
  }

  const reviewedAt = new Date();
  const status = parsed.data.status as AIDraftStatus;

  await db.aIDraft.update({
    where: { id: draft.id },
    data: {
      status,
      reviewNotes: normalizeOptional(parsed.data.reviewNotes),
      reviewedAt,
      approvedByAdminId: status === AIDraftStatus.APPROVED ? adminUser.id : null,
      rejectedByAdminId: status === AIDraftStatus.REJECTED ? adminUser.id : null
    }
  });

  await db.auditLog.create({
    data: {
      adminUserId: adminUser.id,
      entityType: AuditEntityType.AI_DRAFT,
      entityId: draft.id,
      action: mapDraftAuditAction(parsed.data.status),
      description: `Draft de IA marcado como ${parsed.data.status.toLowerCase()}.`,
      metadata: {
        previousStatus: draft.status,
        nextStatus: status,
        newsId: draft.newsId,
        suggestedTitle: draft.suggestedTitle
      }
    }
  });

  revalidatePath("/admin/ai-drafts");
  revalidatePath(`/admin/ai-drafts/${draft.id}`);

  return {
    status: "success",
    message:
      status === AIDraftStatus.APPROVED
        ? "Draft aprovado para evolucao editorial."
        : status === AIDraftStatus.REJECTED
          ? "Draft reprovado com sucesso."
          : "Draft arquivado com sucesso."
  };
}

export async function convertAIDraftToNewsAction(
  _: AIDraftReviewActionState,
  formData: FormData
): Promise<AIDraftReviewActionState> {
  const adminUser = await requireAdminUser();

  if (!ensureAIManager(adminUser.role)) {
    return { status: "error", message: "Seu perfil nao pode converter drafts de IA em noticia." };
  }

  const parsed = convertAIDraftSchema.safeParse({
    aiDraftId: String(formData.get("aiDraftId") ?? ""),
    title: String(formData.get("title") ?? ""),
    subtitle: String(formData.get("subtitle") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    content: String(formData.get("content") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    authorId: String(formData.get("authorId") ?? ""),
    stateId: String(formData.get("stateId") ?? ""),
    cityId: String(formData.get("cityId") ?? ""),
    seoTitle: String(formData.get("seoTitle") ?? ""),
    seoDescription: String(formData.get("seoDescription") ?? ""),
    reviewNotes: String(formData.get("reviewNotes") ?? ""),
    commentsEnabled: formData.get("commentsEnabled") === "on",
    tagIds: formData.getAll("tagIds").map((value) => String(value))
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos da conversao editorial.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const data = parsed.data;
  const slug = buildDraftSlug(data.title, data.slug);

  if (!slug) {
    return { status: "error", message: "Nao foi possivel gerar um slug valido para a noticia derivada.", fieldErrors: { slug: ["Informe um titulo ou slug valido."] } };
  }

  const draft = await db.aIDraft.findUnique({
    where: { id: data.aiDraftId },
    select: {
      id: true,
      status: true,
      newsId: true,
      aiJobId: true,
      sourceUrls: true
    }
  });

  if (!draft) {
    return { status: "error", message: "O draft de IA nao existe mais." };
  }

  if (draft.newsId) {
    return { status: "error", message: "Este draft ja foi convertido em noticia." };
  }

  if (draft.status === AIDraftStatus.ARCHIVED) {
    return { status: "error", message: "Draft arquivado nao pode ser convertido diretamente." };
  }

  const uniqueTagIds = Array.from(new Set(data.tagIds));

  const [category, author, state, city, tags, slugOwner] = await Promise.all([
    db.category.findUnique({ where: { id: data.categoryId }, select: { id: true } }),
    db.author.findUnique({ where: { id: data.authorId }, select: { id: true } }),
    data.stateId ? db.state.findUnique({ where: { id: data.stateId }, select: { id: true, countryId: true } }) : Promise.resolve(null),
    data.cityId ? db.city.findUnique({ where: { id: data.cityId }, select: { id: true, stateId: true, countryId: true } }) : Promise.resolve(null),
    uniqueTagIds.length > 0 ? db.tag.findMany({ where: { id: { in: uniqueTagIds } }, select: { id: true } }) : Promise.resolve([]),
    db.news.findUnique({ where: { slug }, select: { id: true } })
  ]);

  if (!category) {
    return { status: "error", message: "A categoria selecionada nao existe mais.", fieldErrors: { categoryId: ["Selecione uma categoria valida."] } };
  }

  if (!author) {
    return { status: "error", message: "O autor selecionado nao existe mais.", fieldErrors: { authorId: ["Selecione um autor valido."] } };
  }

  if (slugOwner) {
    return { status: "error", message: "Ja existe uma noticia usando este slug.", fieldErrors: { slug: ["Use outro slug antes de converter."] } };
  }

  if (data.stateId && !state) {
    return { status: "error", message: "O estado selecionado nao existe mais.", fieldErrors: { stateId: ["Selecione um estado valido."] } };
  }

  if (data.cityId && !city) {
    return { status: "error", message: "A cidade selecionada nao existe mais.", fieldErrors: { cityId: ["Selecione uma cidade valida."] } };
  }

  if (city && state && city.stateId !== state.id) {
    return { status: "error", message: "A cidade selecionada nao pertence ao estado informado.", fieldErrors: { cityId: ["Escolha uma cidade compativel com o estado."] } };
  }

  if (tags.length !== uniqueTagIds.length) {
    return { status: "error", message: "Uma ou mais tags selecionadas nao existem mais.", fieldErrors: { tagIds: ["Revise a selecao de tags."] } };
  }

  const nextStateId = city ? city.stateId : state?.id ?? null;
  const nextCountryId = city ? city.countryId : state?.countryId ?? null;

  try {
    await db.$transaction(async (tx) => {
      const news = await tx.news.create({
        data: {
          title: data.title.trim(),
          subtitle: normalizeOptional(data.subtitle),
          slug,
          summary: normalizeOptional(data.summary),
          content: data.content.trim(),
          status: NewsStatus.DRAFT_AI,
          categoryId: category.id,
          authorId: author.id,
          countryId: nextCountryId,
          stateId: nextStateId,
          cityId: city?.id ?? null,
          seoTitle: normalizeOptional(data.seoTitle),
          seoDescription: normalizeOptional(data.seoDescription),
          commentsEnabled: data.commentsEnabled,
          isAiAssisted: true,
          createdByAdminId: adminUser.id,
          updatedByAdminId: adminUser.id
        }
      });

      if (uniqueTagIds.length > 0) {
        await tx.newsTag.createMany({
          data: uniqueTagIds.map((tagId) => ({ newsId: news.id, tagId }))
        });
      }

      if (draft.sourceUrls.length > 0) {
        await tx.newsSource.createMany({
          data: draft.sourceUrls.map((url, index) => ({
            newsId: news.id,
            title: `Fonte ${index + 1}`,
            url,
            publisherName: sourceLabelFromUrl(url),
            isPrimary: index === 0,
            sortOrder: index
          }))
        });
      }

      await tx.aIDraft.update({
        where: { id: draft.id },
        data: {
          newsId: news.id,
          status: AIDraftStatus.APPROVED,
          reviewNotes: normalizeOptional(data.reviewNotes),
          reviewedAt: new Date(),
          approvedByAdminId: adminUser.id,
          rejectedByAdminId: null
        }
      });

      await tx.auditLog.createMany({
        data: [
          {
            adminUserId: adminUser.id,
            entityType: AuditEntityType.AI_DRAFT,
            entityId: draft.id,
            action: AuditAction.APPROVE,
            description: "Draft de IA convertido em noticia e aprovado para curadoria humana.",
            metadata: { newsId: news.id, title: news.title, slug: news.slug }
          },
          {
            adminUserId: adminUser.id,
            entityType: AuditEntityType.NEWS,
            entityId: news.id,
            action: AuditAction.CREATE,
            description: "Noticia criada a partir de draft de IA.",
            metadata: { aiDraftId: draft.id, aiJobId: draft.aiJobId, status: news.status, isAiAssisted: true }
          }
        ]
      });

      await tx.publicationHistory.create({
        data: {
          newsId: news.id,
          adminUserId: adminUser.id,
          previousStatus: NewsStatus.DRAFT,
          nextStatus: NewsStatus.DRAFT_AI,
          titleSnapshot: news.title,
          slugSnapshot: news.slug,
          note: "Noticia criada a partir de draft de IA e encaminhada para curadoria humana."
        }
      });
    });
  } catch {
    return { status: "error", message: "Nao foi possivel converter o draft em noticia." };
  }

  revalidatePath("/admin/news");
  revalidatePath("/admin/ai-drafts");
  revalidatePath(`/admin/ai-drafts/${draft.id}`);

  return {
    status: "success",
    message: "Draft convertido em noticia com status draft_ai."
  };
}
