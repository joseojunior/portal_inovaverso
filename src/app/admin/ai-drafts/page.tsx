import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Bot, FileText } from "lucide-react";

import { SectionHeading } from "@/components/layout/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminUser } from "@/lib/auth/admin-session";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format-date";

function statusVariant(status: "GENERATED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ARCHIVED") {
  if (status === "APPROVED") return "accent";
  if (status === "REJECTED" || status === "ARCHIVED") return "secondary";
  return "outline";
}

export default async function AdminAIDraftsPage() {
  const adminUser = await requireAdminUser();

  if (!["SUPER_ADMIN", "ADMIN"].includes(adminUser.role)) {
    notFound();
  }

  const drafts = await db.aIDraft.findMany({
    orderBy: [{ generatedAt: "desc" }],
    take: 40,
    select: {
      id: true,
      status: true,
      suggestedTitle: true,
      suggestedSummary: true,
      confidenceScore: true,
      generatedAt: true,
      reviewedAt: true,
      sourceUrls: true,
      newsId: true,
      category: { select: { name: true } },
      author: { select: { name: true } },
      aiJob: { select: { status: true } },
      _count: { select: { mediaSuggestions: true } }
    }
  });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="IA Editorial"
        title="Sugestoes geradas"
        description="Fila de revisao humana para rascunhos assistidos, sempre sem publicacao automatica."
      />
      <div className="grid gap-4">
        {drafts.length > 0 ? (
          drafts.map((draft) => (
            <Card key={draft.id} className="border-border/70 bg-card/90">
              <CardContent className="flex flex-col gap-4 py-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant(draft.status)}>{draft.status}</Badge>
                    {draft.aiJob?.status ? <Badge variant="outline">Job {draft.aiJob.status}</Badge> : null}
                    {draft.confidenceScore ? <Badge variant="outline">Confianca {draft.confidenceScore.toString()}</Badge> : null}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">{draft.suggestedTitle}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {draft.suggestedSummary || "Sem resumo sugerido. Abra a revisao para inspecionar o conteudo completo."}
                    </p>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <div className="grid gap-1">
                      <p>Categoria: {draft.category?.name ?? "Nao definida"}</p>
                      <p>Autor: {draft.author?.name ?? "Nao definido"}</p>
                      <p>Fontes registradas: {draft.sourceUrls.length}</p>
                    </div>
                    <div className="grid gap-1">
                      <p>Gerado em: {formatDateTime(draft.generatedAt)}</p>
                      <p>Revisado em: {draft.reviewedAt ? formatDateTime(draft.reviewedAt) : "Ainda nao revisado"}</p>
                      <p>Sugestoes de midia: {draft._count.mediaSuggestions}</p>
                    </div>
                  </div>
                  {draft.newsId ? (
                    <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">
                      Draft ja convertido em noticia vinculada.
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Bot className="size-4" />
                    {draft.id}
                  </div>
                  <Button asChild variant="outline" className="gap-2">
                    <Link href={`/admin/ai-drafts/${draft.id}`}>
                      Revisar draft
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-dashed border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle>Nenhum draft de IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Quando a camada de IA interna gerar rascunhos, eles aparecerao aqui para revisao humana obrigatoria.</p>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs">
                <FileText className="size-3.5" />
                Sugestoes entram pendentes por padrao
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
