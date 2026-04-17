import { MediaType, NewsStatus } from "@prisma/client";

import { db } from "@/lib/db";

export type PublicNewsItem = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  summary: string | null;
  content: string | null;
  publishedAt: string | null;
  updatedAt: string;
  category: string;
  categorySlug: string;
  author: string;
  authorSlug: string;
  imageUrl: string | null;
};

export type PublicNewsMediaItem = {
  id: string;
  type: MediaType;
  url: string;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  altText: string | null;
  caption: string | null;
  credit: string | null;
};

export type PublicNewsDetail = PublicNewsItem & {
  seoTitle: string | null;
  seoDescription: string | null;
  commentsEnabled: boolean;
  featuredMedia: PublicNewsMediaItem | null;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  gallery: PublicNewsMediaItem[];
};

function createExcerpt(summary: string | null, content: string | null) {
  const source = (summary ?? content ?? "").replace(/\s+/g, " ").trim();

  if (!source) {
    return "Cobertura editorial publicada e pronta para leitura no portal.";
  }

  return source.length > 180 ? `${source.slice(0, 177).trimEnd()}...` : source;
}

function mapFeaturedPreview(
  media: { type: MediaType; url: string; thumbnailUrl: string | null; status: string } | null
) {
  if (!media || media.status !== "APPROVED") {
    return null;
  }

  return media.type === MediaType.VIDEO ? media.thumbnailUrl ?? null : media.url;
}

export async function getPublicHomeNews(limit = 10): Promise<PublicNewsItem[]> {
  try {
    const news = await db.news.findMany({
      where: {
        status: NewsStatus.PUBLISHED
      },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take: limit,
      select: {
        id: true,
        title: true,
        subtitle: true,
        slug: true,
        summary: true,
        content: true,
        publishedAt: true,
        updatedAt: true,
        category: {
          select: {
            name: true,
            slug: true
          }
        },
        author: {
          select: {
            name: true,
            slug: true
          }
        },
        featuredMedia: {
          select: {
            type: true,
            url: true,
            thumbnailUrl: true,
            status: true
          }
        }
      }
    });

    return news.map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      slug: item.slug,
      summary: createExcerpt(item.summary, item.content),
      content: item.content,
      publishedAt: item.publishedAt?.toISOString() ?? null,
      updatedAt: item.updatedAt.toISOString(),
      category: item.category.name,
      categorySlug: item.category.slug,
      author: item.author.name,
      authorSlug: item.author.slug,
      imageUrl: mapFeaturedPreview(item.featuredMedia)
    }));
  } catch (error) {
    console.error("[public-home] failed to fetch home news", error);
    return [];
  }
}

export async function getPublicNewsBySlug(slug: string): Promise<PublicNewsDetail | null> {
  try {
    const item = await db.news.findFirst({
      where: {
        slug,
        status: NewsStatus.PUBLISHED
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        slug: true,
        summary: true,
        content: true,
        publishedAt: true,
        updatedAt: true,
        seoTitle: true,
        seoDescription: true,
        commentsEnabled: true,
        category: {
          select: {
            name: true,
            slug: true
          }
        },
        author: {
          select: {
            name: true,
            slug: true
          }
        },
        featuredMedia: {
          select: {
            id: true,
            type: true,
            url: true,
            embedUrl: true,
            thumbnailUrl: true,
            status: true,
            altText: true,
            caption: true,
            credit: true
          }
        },
        mediaRelations: {
          orderBy: {
            position: "asc"
          },
          select: {
            id: true,
            captionOverride: true,
            altTextOverride: true,
            creditOverride: true,
            mediaFile: {
              select: {
                id: true,
                type: true,
                url: true,
                embedUrl: true,
                thumbnailUrl: true,
                status: true,
                altText: true,
                caption: true,
                credit: true
              }
            }
          }
        },
        newsTags: {
          orderBy: {
            assignedAt: "asc"
          },
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });
    if (!item) {
      return null;
    }

    const featuredMedia =
      item.featuredMedia && item.featuredMedia.status === "APPROVED"
        ? {
            id: item.featuredMedia.id,
            type: item.featuredMedia.type,
            url: item.featuredMedia.url,
            embedUrl: item.featuredMedia.embedUrl,
            thumbnailUrl: item.featuredMedia.thumbnailUrl,
            altText: item.featuredMedia.altText,
            caption: item.featuredMedia.caption,
            credit: item.featuredMedia.credit
          }
        : null;

    return {
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      slug: item.slug,
      summary: createExcerpt(item.summary, item.content),
      content: item.content,
      publishedAt: item.publishedAt?.toISOString() ?? null,
      updatedAt: item.updatedAt.toISOString(),
      seoTitle: item.seoTitle,
      seoDescription: item.seoDescription,
      commentsEnabled: item.commentsEnabled,
      category: item.category.name,
      categorySlug: item.category.slug,
      author: item.author.name,
      authorSlug: item.author.slug,
      imageUrl: mapFeaturedPreview(item.featuredMedia),
      featuredMedia,
      tags: item.newsTags.map((newsTag) => newsTag.tag),
      gallery: item.mediaRelations
        .filter((relation) => relation.mediaFile.status === "APPROVED")
        .filter((relation) => relation.mediaFile.id !== item.featuredMedia?.id)
        .map((relation) => ({
          id: relation.mediaFile.id,
          type: relation.mediaFile.type,
          url: relation.mediaFile.url,
          embedUrl: relation.mediaFile.embedUrl,
          thumbnailUrl: relation.mediaFile.thumbnailUrl,
          altText: relation.altTextOverride ?? relation.mediaFile.altText,
          caption: relation.captionOverride ?? relation.mediaFile.caption,
          credit: relation.creditOverride ?? relation.mediaFile.credit
        }))
    };
  } catch (error) {
    console.error("[public-home] failed to fetch news by slug", error);
    return null;
  }
}

export type PublicCategoryPage = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  news: PublicNewsItem[];
};

export type PublicAuthorPage = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatarUrl: string | null;
  news: PublicNewsItem[];
};

function mapPublicNewsItems(
  items: Array<{
    id: string;
    title: string;
    subtitle: string | null;
    slug: string;
    summary: string | null;
    content: string | null;
    publishedAt: Date | null;
    updatedAt: Date;
    category: { name: string; slug: string };
    author: { name: string; slug: string };
    featuredMedia: { type: MediaType; url: string; thumbnailUrl: string | null; status: string } | null;
  }>
): PublicNewsItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    slug: item.slug,
    summary: createExcerpt(item.summary, item.content),
    content: item.content,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    updatedAt: item.updatedAt.toISOString(),
    category: item.category.name,
    categorySlug: item.category.slug,
    author: item.author.name,
    authorSlug: item.author.slug,
    imageUrl: mapFeaturedPreview(item.featuredMedia)
  }));
}

export async function getPublicCategoryBySlug(slug: string): Promise<PublicCategoryPage | null> {
  try {
    const category = await db.category.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        seoTitle: true,
        seoDescription: true,
        news: {
          where: {
            status: NewsStatus.PUBLISHED
          },
          orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
          select: {
            id: true,
            title: true,
            subtitle: true,
            slug: true,
            summary: true,
            content: true,
            publishedAt: true,
            updatedAt: true,
            category: {
              select: {
                name: true,
                slug: true
              }
            },
            author: {
              select: {
                name: true,
                slug: true
              }
            },
            featuredMedia: {
              select: {
                type: true,
                url: true,
                thumbnailUrl: true,
                status: true
              }
            }
          }
        }
      }
    });
    if (!category) {
      return null;
    }

    return {
      ...category,
      news: mapPublicNewsItems(category.news)
    };
  } catch (error) {
    console.error("[public-home] failed to fetch category", error);
    return null;
  }
}

export async function getPublicAuthorBySlug(slug: string): Promise<PublicAuthorPage | null> {
  try {
    const author = await db.author.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        avatarUrl: true,
        news: {
          where: {
            status: NewsStatus.PUBLISHED
          },
          orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
          select: {
            id: true,
            title: true,
            subtitle: true,
            slug: true,
            summary: true,
            content: true,
            publishedAt: true,
            updatedAt: true,
            category: {
              select: {
                name: true,
                slug: true
              }
            },
            author: {
              select: {
                name: true,
                slug: true
              }
            },
            featuredMedia: {
              select: {
                type: true,
                url: true,
                thumbnailUrl: true,
                status: true
              }
            }
          }
        }
      }
    });
    if (!author) {
      return null;
    }

    return {
      ...author,
      news: mapPublicNewsItems(author.news)
    };
  } catch (error) {
    console.error("[public-home] failed to fetch author", error);
    return null;
  }
}
