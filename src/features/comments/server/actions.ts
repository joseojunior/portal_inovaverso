"use server";

import { AuditAction, AuditEntityType, CommentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth/admin-session";
import { getCurrentPublicUser } from "@/lib/auth/user-session";
import { db } from "@/lib/db";
import type { CommentActionState } from "@/features/comments/server/action-state";

const commentSchema = z.object({
  newsId: z.string().min(1),
  newsSlug: z.string().min(1),
  content: z.string().trim().min(3, "Escreva pelo menos 3 caracteres.").max(1200, "O comentario excede o limite de 1200 caracteres.")
});

const ownCommentSchema = z.object({
  id: z.string().min(1),
  newsId: z.string().min(1),
  newsSlug: z.string().min(1),
  content: z.string().trim().min(3, "Escreva pelo menos 3 caracteres.").max(1200, "O comentario excede o limite de 1200 caracteres.")
});

const deleteCommentSchema = z.object({
  id: z.string().min(1),
  newsId: z.string().min(1),
  newsSlug: z.string().min(1)
});

const moderateCommentSchema = z.object({
  id: z.string().min(1),
  newsId: z.string().min(1),
  newsSlug: z.string().min(1),
  status: z.enum(["APPROVED", "HIDDEN", "SPAM", "DELETED"])
});

async function ensureCommentableNews(newsId: string) {
  return db.news.findFirst({
    where: {
      id: newsId,
      status: "PUBLISHED"
    },
    select: {
      id: true,
      slug: true,
      commentsEnabled: true
    }
  });
}

function revalidateCommentPaths(slug: string) {
  revalidatePath(`/${slug}`);
  revalidatePath("/admin/comments");
}

export async function createCommentAction(_: CommentActionState, formData: FormData): Promise<CommentActionState> {
  const user = await getCurrentPublicUser();

  if (!user?.isActive) {
    return {
      status: "error",
      message: "Faça login para comentar."
    };
  }

  const parsed = commentSchema.safeParse({
    newsId: String(formData.get("newsId") ?? ""),
    newsSlug: String(formData.get("newsSlug") ?? ""),
    content: String(formData.get("content") ?? "")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise o comentario antes de enviar.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const news = await ensureCommentableNews(parsed.data.newsId);

  if (!news || news.slug !== parsed.data.newsSlug) {
    return {
      status: "error",
      message: "A noticia nao esta disponivel para comentarios."
    };
  }

  if (!news.commentsEnabled) {
    return {
      status: "error",
      message: "Os comentarios estao desativados nesta noticia."
    };
  }

  await db.comment.create({
    data: {
      newsId: news.id,
      userId: user.id,
      content: parsed.data.content.trim(),
      status: CommentStatus.PENDING
    }
  });

  revalidateCommentPaths(news.slug);

  return {
    status: "success",
    message: "Comentario enviado para moderacao."
  };
}

export async function updateOwnCommentAction(_: CommentActionState, formData: FormData): Promise<CommentActionState> {
  const user = await getCurrentPublicUser();

  if (!user?.isActive) {
    return {
      status: "error",
      message: "Faça login para editar seu comentario."
    };
  }

  const parsed = ownCommentSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    newsId: String(formData.get("newsId") ?? ""),
    newsSlug: String(formData.get("newsSlug") ?? ""),
    content: String(formData.get("content") ?? "")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise o comentario antes de salvar.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const comment = await db.comment.findFirst({
    where: {
      id: parsed.data.id,
      userId: user.id,
      newsId: parsed.data.newsId,
      status: {
        not: CommentStatus.DELETED
      }
    },
    select: {
      id: true,
      news: {
        select: {
          slug: true,
          commentsEnabled: true,
          status: true
        }
      }
    }
  });

  if (!comment || comment.news.slug !== parsed.data.newsSlug || comment.news.status !== "PUBLISHED") {
    return {
      status: "error",
      message: "O comentario nao pode mais ser editado."
    };
  }

  if (!comment.news.commentsEnabled) {
    return {
      status: "error",
      message: "Os comentarios estao desativados nesta noticia."
    };
  }

  await db.comment.update({
    where: { id: comment.id },
    data: {
      content: parsed.data.content.trim(),
      status: CommentStatus.PENDING,
      approvedAt: null,
      approvedByAdminId: null,
      rejectedAt: null,
      rejectedByAdminId: null,
      moderationNote: "Comentario editado pelo proprio autor e reenviado para moderacao."
    }
  });

  revalidateCommentPaths(comment.news.slug);

  return {
    status: "success",
    message: "Comentario atualizado e reenviado para moderacao."
  };
}

export async function deleteOwnCommentAction(_: CommentActionState, formData: FormData): Promise<CommentActionState> {
  const user = await getCurrentPublicUser();

  if (!user?.isActive) {
    return {
      status: "error",
      message: "Faça login para excluir seu comentario."
    };
  }

  const parsed = deleteCommentSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    newsId: String(formData.get("newsId") ?? ""),
    newsSlug: String(formData.get("newsSlug") ?? "")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Nao foi possivel identificar o comentario."
    };
  }

  const comment = await db.comment.findFirst({
    where: {
      id: parsed.data.id,
      userId: user.id,
      newsId: parsed.data.newsId,
      status: {
        not: CommentStatus.DELETED
      }
    },
    select: {
      id: true,
      news: {
        select: {
          slug: true
        }
      }
    }
  });

  if (!comment || comment.news.slug !== parsed.data.newsSlug) {
    return {
      status: "error",
      message: "O comentario nao pode mais ser excluido."
    };
  }

  await db.comment.update({
    where: { id: comment.id },
    data: {
      status: CommentStatus.DELETED,
      moderationNote: "Comentario removido pelo proprio autor."
    }
  });

  revalidateCommentPaths(comment.news.slug);

  return {
    status: "success",
    message: "Comentario removido."
  };
}

export async function moderateCommentAction(input: {
  id: string;
  newsId: string;
  newsSlug: string;
  status: "APPROVED" | "HIDDEN" | "SPAM" | "DELETED";
}) {
  const adminUser = await requireAdminUser();

  if (!["SUPER_ADMIN", "ADMIN", "MODERATOR"].includes(adminUser.role)) {
    return {
      status: "error" as const,
      message: "Seu perfil nao pode moderar comentarios."
    };
  }

  const parsed = moderateCommentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error" as const,
      message: "Dados de moderacao invalidos."
    };
  }

  const comment = await db.comment.findFirst({
    where: {
      id: parsed.data.id,
      newsId: parsed.data.newsId
    },
    select: {
      id: true,
      news: {
        select: {
          slug: true
        }
      }
    }
  });

  if (!comment || comment.news.slug !== parsed.data.newsSlug) {
    return {
      status: "error" as const,
      message: "Comentario nao encontrado."
    };
  }

  await db.comment.update({
    where: { id: comment.id },
    data: {
      status: parsed.data.status,
      approvedAt: parsed.data.status === "APPROVED" ? new Date() : null,
      approvedByAdminId: parsed.data.status === "APPROVED" ? adminUser.id : null,
      rejectedAt: parsed.data.status === "SPAM" || parsed.data.status === "DELETED" ? new Date() : null,
      rejectedByAdminId: parsed.data.status === "SPAM" || parsed.data.status === "DELETED" ? adminUser.id : null,
      moderationNote: `Status alterado para ${parsed.data.status.toLowerCase()} no painel de moderacao.`
    }
  });

  await db.auditLog.create({
    data: {
      adminUserId: adminUser.id,
      entityType: AuditEntityType.COMMENT,
      entityId: comment.id,
      action: parsed.data.status === "APPROVED" ? AuditAction.APPROVE : AuditAction.UPDATE,
      description: `Comentario moderado para ${parsed.data.status.toLowerCase()}.`,
      metadata: {
        newsId: parsed.data.newsId,
        nextStatus: parsed.data.status
      }
    }
  });

  revalidateCommentPaths(comment.news.slug);

  return {
    status: "success" as const,
    message: "Comentario moderado com sucesso."
  };
}
