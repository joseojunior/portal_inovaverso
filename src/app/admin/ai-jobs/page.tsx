import { notFound } from "next/navigation";
import { Bot, CheckCircle2, CircleDashed, CircleX, Link2 } from "lucide-react";

import { SectionHeading } from "@/components/layout/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdminUser } from "@/lib/auth/admin-session";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format-date";

function statusVariant(status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED") {
  if (status === "SUCCEEDED") return "accent";
  if (status === "FAILED" || status === "CANCELED") return "secondary";
  return "outline";
}

function statusIcon(status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED") {
  if (status === "SUCCEEDED") return <CheckCircle2 className="size-4" />;
  if (status === "FAILED" || status === "CANCELED") return <CircleX className="size-4" />;
  return <CircleDashed className="size-4" />;
}

export default async function AdminAIJobsPage() {
  const adminUser = await requireAdminUser();

  if (!["SUPER_ADMIN", "ADMIN"].includes(adminUser.role)) {
    notFound();
  }

  const jobs = await db.aIJob.findMany({
    orderBy: [{ queuedAt: "desc" }],
    take: 40,
    select: {
      id: true,
      jobType: true,
      status: true,
      promptVersion: true,
      errorMessage: true,
      queuedAt: true,
      startedAt: true,
      completedAt: true,
      externalJobId: true,
      aiSearchConfig: { select: { name: true } },
      news: { select: { title: true, slug: true } },
      _count: { select: { aiDrafts: true } }
    }
  });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="IA Editorial"
        title="Jobs de IA"
        description="Listagem administrativa dos jobs internos vinculados a configuracoes, drafts e noticias derivadas."
      />
      <div className="grid gap-4">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <Card key={job.id} className="border-border/70 bg-card/90">
              <CardContent className="flex flex-col gap-4 py-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant(job.status)} className="gap-1">
                      {statusIcon(job.status)}
                      {job.status}
                    </Badge>
                    <Badge variant="outline">{job.jobType}</Badge>
                    {job.aiSearchConfig?.name ? <Badge variant="outline">{job.aiSearchConfig.name}</Badge> : null}
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <div className="grid gap-1">
                      <p>Fila: {formatDateTime(job.queuedAt)}</p>
                      <p>Inicio: {job.startedAt ? formatDateTime(job.startedAt) : "Nao iniciado"}</p>
                      <p>Fim: {job.completedAt ? formatDateTime(job.completedAt) : "Em aberto"}</p>
                    </div>
                    <div className="grid gap-1">
                      <p>Drafts gerados: {job._count.aiDrafts}</p>
                      <p>Prompt version: {job.promptVersion ?? "Nao registrada"}</p>
                      <p>External job: {job.externalJobId ?? "Interno/local"}</p>
                    </div>
                  </div>
                  {job.news ? (
                    <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Noticia vinculada</p>
                      <p>{job.news.title}</p>
                      <p>/{job.news.slug}</p>
                    </div>
                  ) : null}
                  {job.errorMessage ? (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {job.errorMessage}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Bot className="size-4" />
                  <span>{job.id}</span>
                  {job.externalJobId ? <Link2 className="size-4" /> : null}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-dashed border-border/70 bg-card/70">
            <CardContent className="py-8 text-sm text-muted-foreground">
              Os jobs de IA aparecerao aqui quando o workflow interno passar a enfileirar execucoes.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
