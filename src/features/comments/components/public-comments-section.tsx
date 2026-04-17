import Link from "next/link";

import { CommentCreateForm } from "@/features/comments/components/comment-create-form";
import { OwnCommentCard } from "@/features/comments/components/own-comment-card";
import { getApprovedCommentsForNews, getOwnCommentsForNews } from "@/features/comments/server/queries";
import { formatShortDate } from "@/lib/format-date";
import { getCurrentPublicUser } from "@/lib/auth/user-session";

type PublicCommentsSectionProps = {
  newsId: string;
  newsSlug: string;
  commentsEnabled: boolean;
};

export async function PublicCommentsSection({ newsId, newsSlug, commentsEnabled }: PublicCommentsSectionProps) {
  const currentUser = await getCurrentPublicUser();
  const [approvedComments, ownComments] = await Promise.all([
    getApprovedCommentsForNews(newsId),
    currentUser ? getOwnCommentsForNews(newsId, currentUser.id) : Promise.resolve([])
  ]);

  return (
    <section className="space-y-6 rounded-[1.75rem] border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ff8c7a]">Comentarios</p>
        <p className="text-sm text-white/52">
          Somente comentarios revisados aparecem publicamente. Novas mensagens passam por moderacao.
        </p>
      </div>

      {!commentsEnabled ? (
        <div className="rounded-[1.2rem] border border-dashed border-white/12 px-5 py-4 text-sm text-white/52">
          Os comentarios estao desativados nesta materia.
        </div>
      ) : currentUser ? (
        <CommentCreateForm newsId={newsId} newsSlug={newsSlug} />
      ) : (
        <div className="rounded-[1.2rem] border border-dashed border-white/12 px-5 py-4 text-sm text-white/52">
          Para comentar, entre na sua conta em{" "}
          <Link href="/entrar" className="text-[#52d4ff] hover:text-white">
            /entrar
          </Link>
          .
        </div>
      )}

      {currentUser && ownComments.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm font-medium text-white/78">Seus comentarios nesta materia</p>
          <div className="space-y-4">
            {ownComments.map((comment) => (
              <OwnCommentCard
                key={comment.id}
                comment={{
                  ...comment,
                  createdAt: comment.createdAt.toISOString(),
                  updatedAt: comment.updatedAt.toISOString()
                }}
                newsId={newsId}
                newsSlug={newsSlug}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        <p className="text-sm font-medium text-white/78">
          {approvedComments.length > 0 ? `${approvedComments.length} comentarios publicados` : "Nenhum comentario publicado ainda"}
        </p>
        {approvedComments.length > 0 ? (
          <div className="space-y-4">
            {approvedComments.map((comment) => (
              <article key={comment.id} className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium text-white">{comment.user.name ?? "Leitor"}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/36">{formatShortDate(comment.createdAt)}</p>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/72">{comment.content}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/48">A discussao ainda nao recebeu comentarios aprovados.</p>
        )}
      </div>
    </section>
  );
}
