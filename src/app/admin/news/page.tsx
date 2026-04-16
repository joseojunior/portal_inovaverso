import { SectionHeading } from "@/components/layout/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewsAdminPanel } from "@/features/news/components/news-admin-panel";
import { requireAdminUser } from "@/lib/auth/admin-session";
import { db } from "@/lib/db";

const pageSize = 10;

const statusOptions = [
  { value: "all", label: "Todos os status" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "PENDING_REVIEW", label: "Em revisão" },
  { value: "APPROVED", label: "Aprovada" },
  { value: "SCHEDULED", label: "Agendada" },
  { value: "PUBLISHED", label: "Publicada" },
  { value: "REJECTED", label: "Rejeitada" },
  { value: "ARCHIVED", label: "Arquivada" }
] as const;

type AdminNewsPageProps = {
  searchParams?: Promise<{
    status?: string;
    categoryId?: string;
    page?: string;
  }>;
};

function buildQueryString(params: { status?: string; categoryId?: string; page?: number }) {
  const searchParams = new URLSearchParams();

  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }

  if (params.categoryId && params.categoryId !== "all") {
    searchParams.set("categoryId", params.categoryId);
  }

  if (params.page && params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  const query = searchParams.toString();
  return query ? `/admin/news?${query}` : "/admin/news";
}

export default async function AdminNewsPage({ searchParams }: AdminNewsPageProps) {
  await requireAdminUser();

  const resolvedSearchParams = (await searchParams) ?? {};
  const statusFilter = resolvedSearchParams.status ?? "all";
  const categoryFilter = resolvedSearchParams.categoryId ?? "all";
  const currentPage = Math.max(Number(resolvedSearchParams.page ?? "1") || 1, 1);

  const where = {
    ...(statusFilter !== "all" ? { status: statusFilter as never } : {}),
    ...(categoryFilter !== "all" ? { categoryId: categoryFilter } : {})
  };

  const [newsItems, totalNews, categories, authors, states, cities, tags, mediaItems] = await Promise.all([
    db.news.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        subtitle: true,
        slug: true,
        summary: true,
        content: true,
        status: true,
        categoryId: true,
        authorId: true,
        stateId: true,
        cityId: true,
        seoTitle: true,
        seoDescription: true,
        commentsEnabled: true,
        featuredMediaId: true,
        createdAt: true,
        updatedAt: true,
        featuredMedia: {
          select: {
            url: true,
            type: true,
            thumbnailUrl: true
          }
        },
        category: {
          select: {
            name: true
          }
        },
        author: {
          select: {
            name: true
          }
        },
        state: {
          select: {
            name: true
          }
        },
        city: {
          select: {
            name: true
          }
        },
        newsTags: {
          select: {
            tagId: true,
            tag: {
              select: {
                name: true
              }
            }
          }
        },
        mediaRelations: {
          orderBy: {
            position: "asc"
          },
          select: {
            mediaFileId: true
          }
        }
      }
    }),
    db.news.count({ where }),
    db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        isActive: true
      }
    }),
    db.author.findMany({
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        isActive: true
      }
    }),
    db.state.findMany({
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        isActive: true
      }
    }),
    db.city.findMany({
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        stateId: true,
        isActive: true
      }
    }),
    db.tag.findMany({
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        isActive: true
      }
    }),
    db.mediaFile.findMany({
      where: {
        type: "IMAGE"
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        type: true,
        url: true,
        embedUrl: true,
        thumbnailUrl: true,
        status: true,
        altText: true,
        caption: true
      }
    })
  ]);

  const totalPages = Math.max(Math.ceil(totalNews / pageSize), 1);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Notícias"
        title="Gestão editorial"
        description="Criação, edição e acompanhamento do núcleo de notícias com taxonomia, SEO e status editoriais básicos."
      />
      <Card>
        <CardHeader>
          <CardTitle>Filtros da listagem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form method="get" className="grid gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,16rem)_auto]">
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium text-foreground">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={statusFilter}
                className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="categoryId" className="text-sm font-medium text-foreground">
                Categoria
              </label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={categoryFilter}
                className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="all">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
              >
                Filtrar
              </button>
              <a
                href="/admin/news"
                className="inline-flex h-9 items-center justify-center rounded-md border border-border/70 px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Limpar
              </a>
            </div>
          </form>
          <div className="flex flex-wrap gap-3">
            {statusOptions.slice(1).map((status) => (
              <Badge key={status.value} variant="secondary" className="rounded-full px-3 py-1">
                {status.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      <NewsAdminPanel
        newsItems={newsItems.map((news) => ({
          id: news.id,
          title: news.title,
          subtitle: news.subtitle,
          slug: news.slug,
          summary: news.summary,
          content: news.content,
          status: news.status,
          categoryId: news.categoryId,
          categoryName: news.category.name,
          authorId: news.authorId,
          authorName: news.author.name,
          stateId: news.stateId,
          stateName: news.state?.name ?? null,
          cityId: news.cityId,
          cityName: news.city?.name ?? null,
          seoTitle: news.seoTitle,
          seoDescription: news.seoDescription,
          commentsEnabled: news.commentsEnabled,
          featuredMediaId: news.featuredMediaId,
          featuredMediaUrl: news.featuredMedia?.type === "VIDEO" ? news.featuredMedia?.thumbnailUrl ?? null : news.featuredMedia?.url ?? null,
          createdAt: news.createdAt.toISOString(),
          updatedAt: news.updatedAt.toISOString(),
          tagIds: news.newsTags.map((newsTag) => newsTag.tagId),
          tagNames: news.newsTags.map((newsTag) => newsTag.tag.name),
          mediaIds: news.mediaRelations.map((relation) => relation.mediaFileId)
        }))}
        categories={categories}
        authors={authors}
        states={states}
        cities={cities}
        tags={tags}
        mediaItems={mediaItems}
      />
      <Card>
        <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}. Total de notícias nesta consulta: {totalNews}.
          </div>
          <div className="flex gap-3">
            <a
              href={buildQueryString({ status: statusFilter, categoryId: categoryFilter, page: currentPage - 1 })}
              aria-disabled={currentPage <= 1}
              className={`inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium ${
                currentPage <= 1
                  ? "pointer-events-none border-border/40 text-muted-foreground/60"
                  : "border-border/70 text-foreground hover:bg-accent"
              }`}
            >
              Anterior
            </a>
            <a
              href={buildQueryString({ status: statusFilter, categoryId: categoryFilter, page: currentPage + 1 })}
              aria-disabled={currentPage >= totalPages}
              className={`inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium ${
                currentPage >= totalPages
                  ? "pointer-events-none border-border/40 text-muted-foreground/60"
                  : "border-border/70 text-foreground hover:bg-accent"
              }`}
            >
              Próxima
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
