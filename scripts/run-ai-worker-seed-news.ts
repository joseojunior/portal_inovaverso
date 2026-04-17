import "dotenv/config";

import { MediaStatus, MediaType, NewsStatus } from "@prisma/client";

import { collectGoogleNewsRss } from "@/lib/ai/google-news-rss";
import { runAISearchConfigNow } from "@/lib/ai/run-search-config";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";

function toNonEmpty(value: string | null | undefined, fallback: string) {
  const clean = value?.trim();
  return clean && clean.length > 0 ? clean : fallback;
}

async function ensureBaseConfig(adminUserId: string) {
  const fixedName = "Seed IA - 10 Noticias";

  const existing = await db.aISearchConfig.findFirst({
    where: { name: fixedName },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true }
  });

  const category = await db.category.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true }
  });

  const baseData = {
    updatedByAdminId: adminUserId,
    description: "Configuracao dedicada para validar worker de IA no ambiente local.",
    query: "tecnologia brasil",
    keywords: [],
    excludedKeywords: [],
    sourceDomains: [],
    excludedDomains: [],
    languageCode: "pt-BR",
    isActive: true,
    lookbackHours: 24,
    maxSourcesPerRun: 12,
    categoryId: category?.id ?? null
  };

  if (existing) {
    return db.aISearchConfig.update({
      where: { id: existing.id },
      data: baseData,
      select: { id: true, name: true }
    });
  }

  return db.aISearchConfig.create({
    data: {
      createdByAdminId: adminUserId,
      name: fixedName,
      ...baseData
    },
    select: { id: true, name: true }
  });
}

async function ensureRssHasItems() {
  const candidates = [
    "tecnologia brasil",
    "inteligencia artificial brasil",
    "inovacao startups brasil",
    "economia digital brasil"
  ];

  for (const query of candidates) {
    const collected = await collectGoogleNewsRss({
      query,
      keywords: [],
      excludedKeywords: [],
      sourceDomains: [],
      excludedDomains: [],
      languageCode: "pt-BR",
      maxItems: 5
    });

    if (collected.items.length > 0) {
      return query;
    }
  }

  throw new Error("Nao foi possivel encontrar uma consulta com retorno no RSS.");
}

async function createNewsFromDraft(input: {
  draft: {
    suggestedTitle: string;
    suggestedSubtitle: string | null;
    suggestedSummary: string | null;
    suggestedContent: string;
    suggestedSeoTitle: string | null;
    suggestedSeoDescription: string | null;
    sourceUrls: string[];
    suggestedTagNames: string[];
    mediaSuggestions: Array<{ mediaFileId: string | null; externalUrl: string | null; sortOrder: number }>;
  };
  adminUserId: string;
  categoryId: string;
  authorId: string;
  index: number;
}) {
  const baseTitle = toNonEmpty(input.draft.suggestedTitle, `Materia de teste ${input.index + 1}`);
  const title = `${baseTitle} [Teste ${input.index + 1}]`;
  const slug = `${slugify(title)}-${Date.now()}-${input.index + 1}`;

  return db.$transaction(async (tx) => {
    const normalizedTagNames = Array.from(
      new Set(
        input.draft.suggestedTagNames
          .map((name) => name.trim())
          .filter((name) => name.length >= 2)
          .slice(0, 6)
      )
    );

    const tagIds: string[] = [];
    for (const tagName of normalizedTagNames) {
      const tagSlug = slugify(tagName);
      if (!tagSlug) continue;

      const tag = await tx.tag.upsert({
        where: { slug: tagSlug },
        update: { isActive: true },
        create: {
          name: tagName,
          slug: tagSlug,
          isActive: true
        },
        select: { id: true }
      });

      tagIds.push(tag.id);
    }

    const mediaIds: string[] = [];
    const suggestions = [...input.draft.mediaSuggestions]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, 3);

    for (const suggestion of suggestions) {
      if (suggestion.mediaFileId) {
        mediaIds.push(suggestion.mediaFileId);
        continue;
      }

      if (!suggestion.externalUrl) {
        continue;
      }

      const media = await tx.mediaFile.create({
        data: {
          uploadedByAdminId: input.adminUserId,
          approvedByAdminId: input.adminUserId,
          type: MediaType.IMAGE,
          status: MediaStatus.APPROVED,
          storageProvider: "external",
          storageKey: `seed/ai/${crypto.randomUUID()}`,
          url: suggestion.externalUrl,
          sourceUrl: suggestion.externalUrl,
          sourceName: "Sugestao IA",
          approvedAt: new Date()
        },
        select: { id: true }
      });

      mediaIds.push(media.id);
    }

    if (mediaIds.length === 0) {
      const fallbackMedia = await tx.mediaFile.create({
        data: {
          uploadedByAdminId: input.adminUserId,
          approvedByAdminId: input.adminUserId,
          type: MediaType.IMAGE,
          status: MediaStatus.APPROVED,
          storageProvider: "external",
          storageKey: `seed/ai/fallback/${crypto.randomUUID()}`,
          url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80",
          sourceUrl: "https://unsplash.com/photos/9D_rUDe7xvA",
          sourceName: "Unsplash",
          approvedAt: new Date(),
          altText: "Ilustração de tecnologia para notícia de teste."
        },
        select: { id: true }
      });

      mediaIds.push(fallbackMedia.id);
    }

    const uniqueMediaIds = Array.from(new Set(mediaIds));
    const featuredMediaId = uniqueMediaIds[0] ?? null;

    const news = await tx.news.create({
      data: {
        title,
        subtitle: input.draft.suggestedSubtitle ?? null,
        slug,
        summary: toNonEmpty(input.draft.suggestedSummary, "Materia gerada para testes do fluxo de IA."),
        content: toNonEmpty(input.draft.suggestedContent, "Conteudo gerado para validacao de fluxo."),
        status: NewsStatus.PUBLISHED,
        categoryId: input.categoryId,
        authorId: input.authorId,
        featuredMediaId,
        createdByAdminId: input.adminUserId,
        updatedByAdminId: input.adminUserId,
        publishedByAdminId: input.adminUserId,
        publishedAt: new Date(),
        commentsEnabled: true,
        isAiAssisted: true,
        seoTitle: input.draft.suggestedSeoTitle ?? null,
        seoDescription: input.draft.suggestedSeoDescription ?? null
      },
      select: { id: true, slug: true, title: true }
    });

    if (tagIds.length > 0) {
      await tx.newsTag.createMany({
        data: Array.from(new Set(tagIds)).map((tagId) => ({ newsId: news.id, tagId }))
      });
    }

    if (input.draft.sourceUrls.length > 0) {
      await tx.newsSource.createMany({
        data: input.draft.sourceUrls.map((url, idx) => ({
          newsId: news.id,
          title: `Fonte ${idx + 1}`,
          url,
          publisherName: (() => {
            try {
              return new URL(url).hostname.replace(/^www\./, "");
            } catch {
              return "Fonte editorial";
            }
          })(),
          isPrimary: idx === 0,
          sortOrder: idx
        }))
      });
    }

    await tx.newsMedia.createMany({
      data: uniqueMediaIds.map((mediaFileId, idx) => ({
        newsId: news.id,
        mediaFileId,
        position: idx
      }))
    });

    return news;
  });
}

async function main() {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim().length < 20) {
    throw new Error("OPENAI_API_KEY ausente para executar o teste do worker.");
  }

  const adminUser = await db.adminUser.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true }
  });

  if (!adminUser) {
    throw new Error("Nenhum admin ativo encontrado.");
  }

  const author = await db.author.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true }
  });

  if (!author) {
    throw new Error("Nenhum autor ativo encontrado.");
  }

  const category = await db.category.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true }
  });

  if (!category) {
    throw new Error("Nenhuma categoria ativa encontrada.");
  }

  const query = await ensureRssHasItems();
  const config = await ensureBaseConfig(adminUser.id);
  await db.aISearchConfig.update({
    where: { id: config.id },
    data: {
      query,
      updatedByAdminId: adminUser.id
    }
  });

  const createdNews: Array<{ id: string; slug: string; title: string }> = [];
  let attempts = 0;

  while (createdNews.length < 10 && attempts < 20) {
    attempts += 1;
    console.log(`[tentativa ${attempts}] iniciando (criadas: ${createdNews.length}/10)`);

    try {
      const result = await runAISearchConfigNow({
        configId: config.id,
        requestedByAdminId: adminUser.id
      });

      if (result.draftIds.length === 0) {
        continue;
      }

      const drafts = await db.aIDraft.findMany({
        where: { id: { in: result.draftIds } },
        orderBy: { generatedAt: "desc" }
        ,
        select: {
          id: true,
          suggestedTitle: true,
          suggestedSubtitle: true,
          suggestedSummary: true,
          suggestedContent: true,
          suggestedSeoTitle: true,
          suggestedSeoDescription: true,
          sourceUrls: true,
          suggestedTagNames: true,
          mediaSuggestions: {
            select: {
              mediaFileId: true,
              externalUrl: true,
              sortOrder: true
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
          }
        }
      });

      for (const draft of drafts) {
        if (createdNews.length >= 10) break;

        const created = await createNewsFromDraft({
          draft,
          adminUserId: adminUser.id,
          categoryId: category.id,
          authorId: author.id,
          index: createdNews.length
        });

        createdNews.push(created);
        console.log(`[tentativa ${attempts}] criada: ${created.slug} (${createdNews.length}/10)`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.warn(`[tentativa ${attempts}] falhou: ${message}`);
    }
  }

  if (createdNews.length < 10) {
    throw new Error(`Foram criadas ${createdNews.length} noticias. Nao foi possivel chegar em 10.`);
  }

  console.log("Worker de IA executado com sucesso.");
  console.log(`Configuracao usada: ${config.name} (${config.id})`);
  console.log("Noticias criadas:");
  createdNews.forEach((news, index) => {
    console.log(`${index + 1}. ${news.title} -> /${news.slug}`);
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
