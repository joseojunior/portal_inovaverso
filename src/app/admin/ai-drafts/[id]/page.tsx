import { notFound } from "next/navigation";

import { AIDraftReviewPanel } from "@/features/ai/components/ai-draft-review-panel";
import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminUser } from "@/lib/auth/admin-session";
import { db } from "@/lib/db";

type AdminAIDraftReviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminAIDraftReviewPage({ params }: AdminAIDraftReviewPageProps) {
  const adminUser = await requireAdminUser();

  if (!["SUPER_ADMIN", "ADMIN"].includes(adminUser.role)) {
    notFound();
  }

  const { id } = await params;

  const [draft, categories, authors, states, cities, tags] = await Promise.all([
    db.aIDraft.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        suggestedTitle: true,
        suggestedSubtitle: true,
        suggestedSlug: true,
        suggestedSummary: true,
        suggestedContent: true,
        suggestedSeoTitle: true,
        suggestedSeoDescription: true,
        suggestedTagNames: true,
        sourceUrls: true,
        confidenceScore: true,
        reviewNotes: true,
        generatedAt: true,
        reviewedAt: true,
        categoryId: true,
        authorId: true,
        stateId: true,
        cityId: true,
        newsId: true,
        category: { select: { name: true } },
        author: { select: { name: true } },
        state: { select: { name: true } },
        city: { select: { name: true } },
        news: { select: { title: true } },
        aiJob: { select: { id: true, status: true } },
        mediaSuggestions: {
          orderBy: [{ sortOrder: "asc" }],
          select: {
            id: true,
            externalUrl: true,
            reason: true,
            confidenceScore: true,
            sortOrder: true,
            isSelected: true,
            mediaFileId: true,
            mediaFile: {
              select: {
                caption: true,
                url: true
              }
            }
          }
        }
      }
    }),
    db.category.findMany({ where: { isActive: true }, orderBy: [{ name: "asc" }], select: { id: true, name: true, isActive: true } }),
    db.author.findMany({ where: { isActive: true }, orderBy: [{ name: "asc" }], select: { id: true, name: true, isActive: true } }),
    db.state.findMany({ where: { isActive: true }, orderBy: [{ name: "asc" }], select: { id: true, name: true, isActive: true } }),
    db.city.findMany({ where: { isActive: true }, orderBy: [{ name: "asc" }], select: { id: true, name: true, isActive: true, stateId: true } }),
    db.tag.findMany({ where: { isActive: true }, orderBy: [{ name: "asc" }], select: { id: true, name: true, isActive: true } })
  ]);

  if (!draft) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="IA Editorial"
        title="Revisao de draft"
        description="Curadoria humana do rascunho gerado por IA antes de qualquer integracao com o fluxo publico."
      />
      <Card>
        <CardHeader>
          <CardTitle>Regra editorial ativa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Draft de IA nunca publica automaticamente. A conversao apenas cria uma noticia em `DRAFT_AI`.</p>
          <p>Depois da conversao, o conteudo segue o fluxo editorial normal no modulo de noticias.</p>
        </CardContent>
      </Card>
      <AIDraftReviewPanel
        draft={{
          id: draft.id,
          status: draft.status,
          suggestedTitle: draft.suggestedTitle,
          suggestedSubtitle: draft.suggestedSubtitle,
          suggestedSlug: draft.suggestedSlug,
          suggestedSummary: draft.suggestedSummary,
          suggestedContent: draft.suggestedContent,
          suggestedSeoTitle: draft.suggestedSeoTitle,
          suggestedSeoDescription: draft.suggestedSeoDescription,
          suggestedTagNames: draft.suggestedTagNames,
          sourceUrls: draft.sourceUrls,
          confidenceScore: draft.confidenceScore?.toString() ?? null,
          reviewNotes: draft.reviewNotes,
          generatedAt: draft.generatedAt.toISOString(),
          reviewedAt: draft.reviewedAt?.toISOString() ?? null,
          categoryId: draft.categoryId,
          categoryName: draft.category?.name ?? null,
          authorId: draft.authorId,
          authorName: draft.author?.name ?? null,
          stateId: draft.stateId,
          stateName: draft.state?.name ?? null,
          cityId: draft.cityId,
          cityName: draft.city?.name ?? null,
          newsId: draft.newsId,
          linkedNewsTitle: draft.news?.title ?? null,
          aiJobId: draft.aiJob?.id ?? null,
          aiJobStatus: draft.aiJob?.status ?? null,
          mediaSuggestions: draft.mediaSuggestions.map((suggestion) => ({
            id: suggestion.id,
            externalUrl: suggestion.externalUrl,
            reason: suggestion.reason,
            confidenceScore: suggestion.confidenceScore?.toString() ?? null,
            sortOrder: suggestion.sortOrder,
            isSelected: suggestion.isSelected,
            mediaFileId: suggestion.mediaFileId,
            mediaCaption: suggestion.mediaFile?.caption ?? null,
            mediaUrl: suggestion.mediaFile?.url ?? null
          }))
        }}
        categories={categories}
        authors={authors}
        states={states}
        cities={cities}
        tags={tags}
      />
    </div>
  );
}
