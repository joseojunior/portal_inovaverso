import { AuditAction, AuditEntityType } from "@prisma/client";

import { extractArticleMediaCandidate } from "@/lib/ai/extract-article-media";
import { collectGoogleNewsRss } from "@/lib/ai/google-news-rss";
import { generateDraftWithOpenAI } from "@/lib/ai/openai-draft";
import { persistExternalCollection } from "@/lib/ai/persist";
import type { AIIngestionResult } from "@/lib/ai/types";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";

function normalizeCountryCode(code: string | null) {
  return code ? code.toUpperCase() : null;
}

export async function runAISearchConfigNow(input: {
  configId: string;
  requestedByAdminId: string;
}): Promise<AIIngestionResult> {
  const config = await db.aISearchConfig.findUnique({
    where: { id: input.configId },
    select: {
      id: true,
      name: true,
      query: true,
      keywords: true,
      excludedKeywords: true,
      sourceDomains: true,
      excludedDomains: true,
      languageCode: true,
      maxSourcesPerRun: true,
      category: { select: { slug: true } },
      country: { select: { isoCode2: true } },
      state: { select: { code: true } },
      city: { select: { slug: true } }
    }
  });

  if (!config) {
    throw new Error("Configuracao de IA nao encontrada.");
  }

  const maxItems = Math.max(3, Math.min(config.maxSourcesPerRun ?? 12, 20));

  const collected = await collectGoogleNewsRss({
    query: config.query,
    keywords: config.keywords,
    excludedKeywords: config.excludedKeywords,
    sourceDomains: config.sourceDomains,
    excludedDomains: config.excludedDomains,
    languageCode: config.languageCode,
    maxItems
  });

  if (collected.items.length === 0) {
    throw new Error("Nenhuma fonte encontrada para a configuracao.");
  }

  const extractedMedia = await Promise.all(
    collected.items.map(async (item, index) => {
      const candidate = await extractArticleMediaCandidate(item.url);

      if (!candidate?.imageUrl) {
        return null;
      }

      return {
        externalUrl: candidate.imageUrl,
        reason: `Imagem sugerida a partir da fonte ${index + 1}${item.sourceName ? ` (${item.sourceName})` : ""}.`,
        confidenceScore: 70,
        sortOrder: index
      };
    })
  );

  const uniqueMediaByUrl = new Map<string, { externalUrl: string; reason: string; confidenceScore: number; sortOrder: number }>();

  for (const media of extractedMedia) {
    if (!media) continue;
    if (!uniqueMediaByUrl.has(media.externalUrl)) {
      uniqueMediaByUrl.set(media.externalUrl, media);
    }
  }

  const mediaSuggestions = Array.from(uniqueMediaByUrl.values()).slice(0, 6);

  const { draft, model } = await generateDraftWithOpenAI({
    query: collected.query,
    languageCode: config.languageCode,
    categorySlug: config.category?.slug ?? null,
    countryCode: normalizeCountryCode(config.country?.isoCode2 ?? null),
    stateCode: config.state?.code ?? null,
    citySlug: config.city?.slug ?? null,
    sources: collected.items
  });

  const externalJobId = `cfg_${config.id}_${Date.now()}`;
  const result = await persistExternalCollection({
    provider: "openai-google-news",
    channel: "workflow",
    configId: config.id,
    jobType: "config_run",
    promptVersion: model,
    requestedByAdminId: input.requestedByAdminId,
    externalJobId,
    drafts: [
      {
        ...draft,
        mediaSuggestions
      }
    ],
    rawPayload: {
      configName: config.name,
      query: collected.query,
      rssUrl: collected.rssUrl,
      sourceCount: collected.items.length
    }
  });

  await db.auditLog.create({
    data: {
      adminUserId: input.requestedByAdminId,
      entityType: AuditEntityType.AI_SEARCH_CONFIG,
      entityId: config.id,
      action: AuditAction.RUN,
      description: "Execucao manual de configuracao de IA.",
      metadata: {
        provider: "openai-google-news",
        model,
        query: collected.query,
        sourceCount: collected.items.length,
        draftIds: result.draftIds
      }
    }
  });

  return result;
}

export function buildSuggestedNewsSlug(title: string) {
  return slugify(title);
}
