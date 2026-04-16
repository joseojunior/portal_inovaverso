"use client";

import { CommentStatus } from "@prisma/client";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { moderateCommentAction } from "@/features/comments/server/actions";
import { formatShortDate } from "@/lib/format-date";

type ModerationComment = {
  id: string;
  newsId: string;
  newsSlug: string;
  newsTitle: string;
  userName: string;
  userEmail: string;
  content: string;
  status: CommentStatus;
  createdAt: string;
};

type CommentsModerationPanelProps = {
  comments: ModerationComment[];
};

const statusLabels: Record<CommentStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  HIDDEN: "Oculto",
  SPAM: "Spam",
  DELETED: "Removido"
};

function badgeVariant(status: CommentStatus) {
  if (status === "APPROVED") return "accent";
  if (status === "PENDING") return "outline";
  return "secondary";
}

export function CommentsModerationPanel({ comments }: CommentsModerationPanelProps) {
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function handleModeration(comment: ModerationComment, nextStatus: "APPROVED" | "HIDDEN" | "SPAM" | "DELETED") {
    startTransition(async () => {
      const result = await moderateCommentAction({
        id: comment.id,
        newsId: comment.newsId,
        newsSlug: comment.newsSlug,
        status: nextStatus
      });

      setFeedback((current) => ({
        ...current,
        [comment.id]: result.message
      }));
    });
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <Card key={comment.id} className="border-border/70 bg-card/90">
          <CardContent className="space-y-4 py-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={badgeVariant(comment.status)}>{statusLabels[comment.status]}</Badge>
              <Badge variant="outline">{comment.newsTitle}</Badge>
              <span className="text-xs text-muted-foreground">{formatShortDate(comment.createdAt)}</span>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Leitor: {comment.userName}</p>
              <p>Email: {comment.userEmail}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm leading-7 text-foreground">
              {comment.content}
            </div>
            {feedback[comment.id] ? <p className="text-sm text-muted-foreground">{feedback[comment.id]}</p> : null}
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" disabled={isPending} onClick={() => handleModeration(comment, "APPROVED")}>
                Aprovar
              </Button>
              <Button type="button" variant="outline" disabled={isPending} onClick={() => handleModeration(comment, "HIDDEN")}>
                Ocultar
              </Button>
              <Button type="button" variant="outline" disabled={isPending} onClick={() => handleModeration(comment, "SPAM")}>
                Spam
              </Button>
              <Button type="button" variant="ghost" disabled={isPending} onClick={() => handleModeration(comment, "DELETED")}>
                Remover
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
