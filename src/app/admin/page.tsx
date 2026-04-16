import { CommentStatus, NewsStatus } from "@prisma/client";
import { FolderKanban, MessageSquareMore, Newspaper, RadioTower, Send, ShieldCheck } from "lucide-react";

import { SectionHeading } from "@/components/layout/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/features/admin/components/metric-card";
import { requireAdminUser } from "@/lib/auth/admin-session";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format-date";

const activityLabels = {
  CREATE: "Criacao",
  UPDATE: "Atualizacao",
  DELETE: "Exclusao",
  APPROVE: "Aprovacao",
  REJECT: "Rejeicao",
  PUBLISH: "Publicacao",
  UNPUBLISH: "Despublicacao",
  ARCHIVE: "Arquivamento",
  LOGIN: "Login",
  LOGOUT: "Logout",
  RUN: "Execucao"
} as const;

const entityLabels = {
  USER: "Usuario",
  ADMIN_USER: "Admin",
  AUTHOR: "Autor",
  CATEGORY: "Categoria",
  TAG: "Tag",
  COUNTRY: "Pais",
  STATE: "Estado",
  CITY: "Cidade",
  NEWS: "Noticia",
  MEDIA_FILE: "Midia",
  COMMENT: "Comentario",
  AI_SEARCH_CONFIG: "Config IA",
  AI_JOB: "Job IA",
  AI_DRAFT: "Draft IA",
  PUBLICATION_HISTORY: "Publicacao"
} as const;

function statusBadgeVariant(status: NewsStatus) {
  if (status === "PUBLISHED") return "accent";
  if (status === "APPROVED" || status === "SCHEDULED") return "default";
  if (status === "REJECTED" || status === "ARCHIVED") return "secondary";
  return "outline";
}

export default async function AdminDashboardPage() {
  await requireAdminUser();

  const [totalNews, publishedNews, draftNews, totalCategories, pendingComments, recentNews, recentActivity] =
    await Promise.all([
      db.news.count(),
      db.news.count({
        where: {
          status: NewsStatus.PUBLISHED
        }
      }),
      db.news.count({
        where: {
          status: {
            in: [NewsStatus.DRAFT, NewsStatus.DRAFT_AI]
          }
        }
      }),
      db.category.count(),
      db.comment.count({
        where: {
          status: CommentStatus.PENDING
        }
      }),
      db.news.findMany({
        orderBy: [{ updatedAt: "desc" }],
        take: 6,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          updatedAt: true,
          category: {
            select: {
              name: true
            }
          }
        }
      }),
      db.auditLog.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 8,
        select: {
          id: true,
          action: true,
          entityType: true,
          description: true,
          createdAt: true,
          adminUser: {
            select: {
              name: true
            }
          }
        }
      })
    ]);

  const metrics = [
    {
      label: "Total de noticias",
      value: String(totalNews),
      helper: "Volume total atualmente registrado no nucleo editorial.",
      icon: <Newspaper className="size-5" />
    },
    {
      label: "Publicadas",
      value: String(publishedNews),
      helper: "Noticias ja disponiveis no portal publico.",
      icon: <RadioTower className="size-5" />
    },
    {
      label: "Rascunhos",
      value: String(draftNews),
      helper: "Materias ainda em rascunho manual ou derivadas de fluxo assistido.",
      icon: <Send className="size-5" />
    },
    {
      label: "Categorias",
      value: String(totalCategories),
      helper: "Taxonomias editoriais cadastradas para organizar cobertura.",
      icon: <FolderKanban className="size-5" />
    },
    {
      label: "Comentarios pendentes",
      value: String(pendingComments),
      helper: "Fila atual aguardando moderacao antes de aparecer publicamente.",
      icon: <MessageSquareMore className="size-5" />
    }
  ];

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Dashboard"
        title="Visao operacional do portal"
        description="Leitura rapida do estado editorial, da fila de moderacao e da atividade administrativa recente."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card className="border-border/70 bg-card">
          <CardHeader>
            <CardTitle>Noticias recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentNews.length > 0 ? (
              recentNews.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusBadgeVariant(item.status)}>{item.status}</Badge>
                    <Badge variant="outline">{item.category.name}</Badge>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">/{item.slug}</p>
                    <p className="text-xs text-muted-foreground">
                      Atualizada em {formatDateTime(item.updatedAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma noticia cadastrada ainda.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Atividade recente</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Acoes administrativas relevantes ja registradas em auditoria.
              </p>
            </div>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <ShieldCheck className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{activityLabels[item.action]}</Badge>
                    <Badge variant="secondary">{entityLabels[item.entityType]}</Badge>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{item.description ?? "Acao administrativa registrada."}</p>
                    <p>Responsavel: {item.adminUser?.name ?? "Sistema"}</p>
                    <p>{formatDateTime(item.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma atividade auditavel registrada ainda.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
