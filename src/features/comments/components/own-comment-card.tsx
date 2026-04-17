"use client";

import { CommentStatus } from "@prisma/client";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteOwnCommentAction,
  updateOwnCommentAction
} from "@/features/comments/server/actions";
import { initialCommentActionState } from "@/features/comments/server/action-state";
import { formatShortDate } from "@/lib/format-date";

type OwnCommentCardProps = {
  comment: {
    id: string;
    content: string;
    status: CommentStatus;
    createdAt: string;
    updatedAt: string;
  };
  newsId: string;
  newsSlug: string;
};

const statusLabels: Record<CommentStatus, string> = {
  PENDING: "Em moderacao",
  APPROVED: "Aprovado",
  HIDDEN: "Oculto",
  SPAM: "Marcado como spam",
  DELETED: "Removido"
};

export function OwnCommentCard({ comment, newsId, newsSlug }: OwnCommentCardProps) {
  const [content, setContent] = useState(comment.content);
  const [updateState, updateAction] = useActionState(updateOwnCommentAction, initialCommentActionState);
  const [deleteState, deleteAction] = useActionState(deleteOwnCommentAction, initialCommentActionState);

  return (
    <div className="space-y-4 rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-white/72">{statusLabels[comment.status]}</span>
        <span className="text-white/42">Atualizado em {formatShortDate(comment.updatedAt)}</span>
      </div>

      <form action={updateAction} className="space-y-3">
        <input type="hidden" name="id" value={comment.id} />
        <input type="hidden" name="newsId" value={newsId} />
        <input type="hidden" name="newsSlug" value={newsSlug} />
        <Textarea
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="min-h-24 border-white/12 bg-black/10 text-white"
        />
        {updateState.fieldErrors?.content ? <p className="text-sm text-[#ff8c7a]">{updateState.fieldErrors.content[0]}</p> : null}
        {updateState.message ? (
          <p className={updateState.status === "success" ? "text-sm text-[#52d4ff]" : "text-sm text-[#ff8c7a]"}>{updateState.message}</p>
        ) : null}
        <div className="flex gap-3">
          <Button type="submit" variant="outline">
            Salvar alteracao
          </Button>
        </div>
      </form>

      <form action={deleteAction} className="space-y-2">
        <input type="hidden" name="id" value={comment.id} />
        <input type="hidden" name="newsId" value={newsId} />
        <input type="hidden" name="newsSlug" value={newsSlug} />
        {deleteState.message ? (
          <p className={deleteState.status === "success" ? "text-sm text-[#52d4ff]" : "text-sm text-[#ff8c7a]"}>{deleteState.message}</p>
        ) : null}
        <Button type="submit" variant="ghost" className="px-0 text-[#ff8c7a] hover:text-[#ff8c7a]">
          Excluir comentario
        </Button>
      </form>
    </div>
  );
}
