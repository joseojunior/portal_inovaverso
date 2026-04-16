import { SectionHeading } from "@/components/layout/section-heading";
import { CommentsModerationPanel } from "@/features/comments/components/comments-moderation-panel";
import { requireAdminUser } from "@/lib/auth/admin-session";
import { db } from "@/lib/db";

export default async function AdminCommentsPage() {
  const adminUser = await requireAdminUser();

  if (!["SUPER_ADMIN", "ADMIN", "MODERATOR"].includes(adminUser.role)) {
    return (
      <div className="space-y-4">
        <SectionHeading
          eyebrow="Comentarios"
          title="Moderacao indisponivel"
          description="Seu perfil atual nao possui permissao para moderar comentarios."
        />
      </div>
    );
  }

  const comments = await db.comment.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      newsId: true,
      content: true,
      status: true,
      createdAt: true,
      news: {
        select: {
          slug: true,
          title: true
        }
      },
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Comentarios"
        title="Fila de moderacao"
        description="Aprovacao, ocultacao e tratamento de comentarios enviados por usuarios autenticados."
      />
      <CommentsModerationPanel
        comments={comments.map((comment) => ({
          id: comment.id,
          newsId: comment.newsId,
          newsSlug: comment.news.slug,
          newsTitle: comment.news.title,
          userName: comment.user.name ?? "Leitor",
          userEmail: comment.user.email,
          content: comment.content,
          status: comment.status,
          createdAt: comment.createdAt.toISOString()
        }))}
      />
    </div>
  );
}
