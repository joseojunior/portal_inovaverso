import { CommentStatus } from "@prisma/client";

import { db } from "@/lib/db";

export async function getApprovedCommentsForNews(newsId: string) {
  return db.comment.findMany({
    where: {
      newsId,
      status: CommentStatus.APPROVED
    },
    orderBy: {
      createdAt: "asc"
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });
}

export async function getOwnCommentsForNews(newsId: string, userId: string) {
  return db.comment.findMany({
    where: {
      newsId,
      userId,
      status: {
        not: CommentStatus.DELETED
      }
    },
    orderBy: {
      updatedAt: "desc"
    },
    select: {
      id: true,
      content: true,
      status: true,
      createdAt: true,
      updatedAt: true
    }
  });
}
