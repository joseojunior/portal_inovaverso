"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createCommentAction } from "@/features/comments/server/actions";
import { initialCommentActionState } from "@/features/comments/server/action-state";

type CommentCreateFormProps = {
  newsId: string;
  newsSlug: string;
};

export function CommentCreateForm({ newsId, newsSlug }: CommentCreateFormProps) {
  const [state, formAction] = useActionState(createCommentAction, initialCommentActionState);

  return (
    <form action={formAction} className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
      <input type="hidden" name="newsId" value={newsId} />
      <input type="hidden" name="newsSlug" value={newsSlug} />
      <Textarea
        name="content"
        placeholder="Escreva seu comentario..."
        className="min-h-28 border-white/12 bg-black/10 text-white placeholder:text-white/35"
      />
      {state.fieldErrors?.content ? <p className="text-sm text-[#ff8c7a]">{state.fieldErrors.content[0]}</p> : null}
      {state.message ? (
        <p className={state.status === "success" ? "text-sm text-[#52d4ff]" : "text-sm text-[#ff8c7a]"}>{state.message}</p>
      ) : null}
      <Button type="submit">Enviar para moderacao</Button>
    </form>
  );
}
