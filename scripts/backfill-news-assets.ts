import "dotenv/config";

import { MediaStatus, MediaType } from "@prisma/client";

import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";

const DEFAULT_TAGS = ["Tecnologia", "Inovação", "Inteligência Artificial"];
const FALLBACK_IMAGE_URL =
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80";

function sourceHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Fonte editorial";
  }
}

async function ensureTags(tagNames: string[]) {
  const ids: string[] = [];

  for (const name of tagNames) {
    const clean = name.trim();
    if (clean.length < 2) continue;
    const slug = slugify(clean);
    if (!slug) continue;

    const tag = await db.tag.upsert({
      where: { slug },
      update: { isActive: true },
      create: {
        name: clean,
        slug,
        isActive: true
      },
      select: { id: true }
    });

    ids.push(tag.id);
  }

  return Array.from(new Set(ids));
}

async function main() {
  const admin = await db.adminUser.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true }
  });

  if (!admin) {
    throw new Error("Nenhum admin ativo encontrado.");
  }

  const newsList = await db.news.findMany({
    where: {
      isAiAssisted: true
    },
    select: {
      id: true,
      title: true,
      slug: true,
      featuredMediaId: true,
      newsTags: { select: { tagId: true } },
      sources: { select: { id: true } },
      mediaRelations: { select: { id: true, mediaFileId: true, position: true }, orderBy: { position: "asc" } },
      aiDrafts: {
        select: {
          sourceUrls: true,
          suggestedTagNames: true,
          mediaSuggestions: {
            select: { mediaFileId: true, externalUrl: true, sortOrder: true },
            orderBy: { sortOrder: "asc" }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  let fixedTags = 0;
  let fixedSources = 0;
  let fixedMedia = 0;

  for (const news of newsList) {
    const latestDraft = news.aiDrafts[0];

    if (news.newsTags.length === 0) {
      const suggested = latestDraft?.suggestedTagNames?.length ? latestDraft.suggestedTagNames : DEFAULT_TAGS;
      const tagIds = await ensureTags(suggested.slice(0, 6));
      if (tagIds.length > 0) {
        await db.newsTag.createMany({
          data: tagIds.map((tagId) => ({ newsId: news.id, tagId })),
          skipDuplicates: true
        });
        fixedTags += 1;
      }
    }

    if (news.sources.length === 0) {
      const sourceUrls = latestDraft?.sourceUrls ?? [];
      if (sourceUrls.length > 0) {
        await db.newsSource.createMany({
          data: sourceUrls.slice(0, 5).map((url, idx) => ({
            newsId: news.id,
            title: `Fonte ${idx + 1}`,
            url,
            publisherName: sourceHost(url),
            isPrimary: idx === 0,
            sortOrder: idx
          }))
        });
        fixedSources += 1;
      }
    }

    if (news.mediaRelations.length === 0) {
      const mediaIds: string[] = [];
      const suggestions = latestDraft?.mediaSuggestions ?? [];

      for (const suggestion of suggestions.slice(0, 3)) {
        if (suggestion.mediaFileId) {
          mediaIds.push(suggestion.mediaFileId);
          continue;
        }

        if (!suggestion.externalUrl) continue;

        const media = await db.mediaFile.create({
          data: {
            uploadedByAdminId: admin.id,
            approvedByAdminId: admin.id,
            type: MediaType.IMAGE,
            status: MediaStatus.APPROVED,
            storageProvider: "external",
            storageKey: `backfill/ai/${crypto.randomUUID()}`,
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
        const fallback = await db.mediaFile.create({
          data: {
            uploadedByAdminId: admin.id,
            approvedByAdminId: admin.id,
            type: MediaType.IMAGE,
            status: MediaStatus.APPROVED,
            storageProvider: "external",
            storageKey: `backfill/ai/fallback/${crypto.randomUUID()}`,
            url: FALLBACK_IMAGE_URL,
            sourceUrl: "https://unsplash.com/photos/9D_rUDe7xvA",
            sourceName: "Unsplash",
            approvedAt: new Date(),
            altText: "Imagem de tecnologia para notícia."
          },
          select: { id: true }
        });
        mediaIds.push(fallback.id);
      }

      const uniqueMediaIds = Array.from(new Set(mediaIds));
      await db.newsMedia.createMany({
        data: uniqueMediaIds.map((mediaFileId, idx) => ({
          newsId: news.id,
          mediaFileId,
          position: idx
        })),
        skipDuplicates: true
      });

      if (!news.featuredMediaId && uniqueMediaIds[0]) {
        await db.news.update({
          where: { id: news.id },
          data: { featuredMediaId: uniqueMediaIds[0] }
        });
      }

      fixedMedia += 1;
    } else if (!news.featuredMediaId && news.mediaRelations[0]) {
      await db.news.update({
        where: { id: news.id },
        data: { featuredMediaId: news.mediaRelations[0].mediaFileId }
      });
      fixedMedia += 1;
    }
  }

  console.log("Backfill concluído:", {
    totalNewsChecked: newsList.length,
    fixedTags,
    fixedSources,
    fixedMedia
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
