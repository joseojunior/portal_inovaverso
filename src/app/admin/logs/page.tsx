import { AuditAction, AuditEntityType } from "@prisma/client";

import { SectionHeading } from "@/components/layout/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminUser } from "@/lib/auth/admin-session";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format-date";

const entityLabels: Record<AuditEntityType, string> = {
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
};

const actionLabels: Record<AuditAction, string> = {
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
};

function auditBadgeVariant(action: AuditAction) {
  if (action === "PUBLISH" || action === "APPROVE") return "accent";
  if (action === "REJECT" || action === "ARCHIVE" || action === "DELETE") return "secondary";
  return "outline";
}

export default async function AdminLogsPage() {
  const adminUser = await requireAdminUser();

  if (adminUser.role === "MODERATOR") {
    return (
      <div className="space-y-4">
        <SectionHeading
          eyebrow="Logs"
          title="Acesso indisponivel"
          description="Seu perfil nao possui permissao para visualizar registros de governanca."
        />
      </div>
    );
  }

  const [publicationHistory, auditLogs] = await Promise.all([
    db.publicationHistory.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 30,
      select: {
        id: true,
        previousStatus: true,
        nextStatus: true,
        titleSnapshot: true,
        slugSnapshot: true,
        note: true,
        effectiveAt: true,
        createdAt: true,
        adminUser: {
          select: {
            name: true
          }
        }
      }
    }),
    adminUser.role === "EDITOR"
      ? Promise.resolve([])
      : db.auditLog.findMany({
          orderBy: [{ createdAt: "desc" }],
          take: 40,
          select: {
            id: true,
            entityType: true,
            entityId: true,
            action: true,
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

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Governanca"
        title="Logs editoriais"
        description="Historico de publicacao e auditoria basica das acoes administrativas relevantes do portal."
      />

      <Card>
        <CardHeader>
          <CardTitle>PublicationHistory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {publicationHistory.length > 0 ? (
            publicationHistory.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{entry.previousStatus}</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="accent">{entry.nextStatus}</Badge>
                </div>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{entry.titleSnapshot}</p>
                  <p>Slug: {entry.slugSnapshot}</p>
                  <p>Responsavel: {entry.adminUser?.name ?? "Sistema"}</p>
                  <p>
                    Registrado em: {formatDateTime(entry.createdAt)}
                    {entry.effectiveAt ? ` | Efetivado em: ${formatDateTime(entry.effectiveAt)}` : ""}
                  </p>
                  {entry.note ? <p>Nota: {entry.note}</p> : null}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum historico de publicacao registrado ainda.</p>
          )}
        </CardContent>
      </Card>

      {adminUser.role !== "EDITOR" ? (
        <Card>
          <CardHeader>
            <CardTitle>AuditLog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={auditBadgeVariant(log.action)}>{actionLabels[log.action]}</Badge>
                    <Badge variant="outline">{entityLabels[log.entityType]}</Badge>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{log.description ?? "Acao administrativa registrada."}</p>
                    <p>Entidade: {log.entityId}</p>
                    <p>Responsavel: {log.adminUser?.name ?? "Sistema"}</p>
                    <p>Registrado em: {formatDateTime(log.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum log de auditoria registrado ainda.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Seu papel possui leitura parcial: esta visao mostra apenas o historico de publicacao das noticias.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
