import { AIJobStatus, AIDraftStatus, AuditAction, AuditEntityType, Prisma } from "@prisma/client";

import { aiCollectionPayloadSchema } from "@/lib/ai/validation";
import { normalizeCollectionPayload } from "@/lib/ai/normalize";
import { resolveDraftReferences } from "@/lib/ai/resolve";
import type { AICollectionPayload, AIIngestionResult } from "@/lib/ai/types";
import { db } from "@/lib/db";

function toPrismaDecimal(value: number | null) {
  return value == null ? null : new Prisma.Decimal(value.toFixed(2));
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.slice(0, 1000);
  }

  return "Falha inesperada ao persistir ingestao externa.";
}

function buildSourceSnapshot(input: { sourceSnapshot: unknown; provider: string; channel: string; externalId: string | null }) {
  const fallback = {
    provider: input.provider,
    channel: input.channel,
    externalId: input.externalId
  };

  if (!input.sourceSnapshot || typeof input.sourceSnapshot !== "object" || Array.isArray(input.sourceSnapshot)) {
    return fallback;
  }

  return {
    ...input.sourceSnapshot,
    provider: input.provider,
    channel: input.channel,
    externalId: input.externalId
  };
}

export async function persistExternalCollection(payload: AICollectionPayload): Promise<AIIngestionResult> {
  const validated = aiCollectionPayloadSchema.parse(payload);
  const normalized = normalizeCollectionPayload(validated);

  if (normalized.externalJobId) {
    const existingJob = await db.aIJob.findUnique({
      where: { externalJobId: normalized.externalJobId },
      select: {
        id: true,
        aiDrafts: { select: { id: true }, orderBy: { createdAt: "asc" } }
      }
    });

    if (existingJob) {
      return {
        jobId: existingJob.id,
        draftIds: existingJob.aiDrafts.map((draft) => draft.id)
      };
    }
  }

  const now = new Date();

  let aiJob: { id: string };

  try {
    aiJob = await db.aIJob.create({
      data: {
        aiSearchConfigId: normalized.configId,
        newsId: normalized.linkedNewsId,
        createdByAdminId: normalized.requestedByAdminId,
        externalJobId: normalized.externalJobId,
        jobType: normalized.jobType,
        status: AIJobStatus.QUEUED,
        promptVersion: normalized.promptVersion,
        inputPayload: normalized.rawPayload ?? normalized,
        queuedAt: now
      },
      select: { id: true }
    });
  } catch (error) {
    const isExternalJobIdConflict =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      Array.isArray(error.meta?.target) &&
      error.meta.target.includes("externalJobId");

    if (isExternalJobIdConflict && normalized.externalJobId) {
      const existingJob = await db.aIJob.findUnique({
        where: { externalJobId: normalized.externalJobId },
        select: {
          id: true,
          aiDrafts: { select: { id: true }, orderBy: { createdAt: "asc" } }
        }
      });

      if (existingJob) {
        return {
          jobId: existingJob.id,
          draftIds: existingJob.aiDrafts.map((draft) => draft.id)
        };
      }
    }

    throw error;
  }

  await db.aIJob.update({
    where: { id: aiJob.id },
    data: {
      status: AIJobStatus.RUNNING,
      startedAt: new Date(),
      startedByAdminId: normalized.requestedByAdminId
    }
  });

  try {
    const result = await db.$transaction(async (tx) => {
      const draftIds: string[] = [];

      for (const draft of normalized.drafts) {
        const resolved = await resolveDraftReferences({
          categorySlug: draft.categorySlug,
          authorSlug: draft.authorSlug,
          countryCode: draft.countryCode,
          stateCode: draft.stateCode,
          citySlug: draft.citySlug,
          dbClient: tx
        });

        const createdDraft = await tx.aIDraft.create({
          data: {
            aiJobId: aiJob.id,
            newsId: normalized.linkedNewsId,
            categoryId: resolved.categoryId,
            authorId: resolved.authorId,
            countryId: resolved.countryId,
            stateId: resolved.stateId,
            cityId: resolved.cityId,
            suggestedTitle: draft.title,
            suggestedSubtitle: draft.subtitle,
            suggestedSlug: draft.slug,
            suggestedSummary: draft.summary,
            suggestedContent: draft.content,
            suggestedSeoTitle: draft.seoTitle,
            suggestedSeoDescription: draft.seoDescription,
            suggestedTagNames: draft.suggestedTagNames,
            sourceUrls: draft.sourceUrls,
            sourceSnapshot: buildSourceSnapshot({
              sourceSnapshot: draft.sourceSnapshot,
              provider: normalized.provider,
              channel: normalized.channel,
              externalId: draft.externalId
            }),
            confidenceScore: toPrismaDecimal(draft.confidenceScore),
            status: AIDraftStatus.PENDING_REVIEW
          }
        });

        draftIds.push(createdDraft.id);

        if (draft.mediaSuggestions.length > 0) {
          await tx.aIDraftMediaSuggestion.createMany({
            data: draft.mediaSuggestions.map((suggestion) => ({
              aiDraftId: createdDraft.id,
              mediaFileId: suggestion.mediaFileId,
              externalUrl: suggestion.externalUrl,
              reason: suggestion.reason,
              confidenceScore: toPrismaDecimal(suggestion.confidenceScore),
              sortOrder: suggestion.sortOrder
            }))
          });
        }
      }

      return {
        jobId: aiJob.id,
        draftIds
      };
    });

    await db.aIJob.update({
      where: { id: aiJob.id },
      data: {
        status: AIJobStatus.SUCCEEDED,
        completedByAdminId: normalized.requestedByAdminId,
        completedAt: new Date(),
        resultPayload: {
          provider: normalized.provider,
          channel: normalized.channel,
          draftsCount: result.draftIds.length
        },
        errorMessage: null
      }
    });

    await db.auditLog.create({
      data: {
        adminUserId: normalized.requestedByAdminId,
        entityType: AuditEntityType.AI_JOB,
        entityId: aiJob.id,
        action: AuditAction.RUN,
        description: "Ingestao externa de IA concluida com sucesso.",
        metadata: {
          status: AIJobStatus.SUCCEEDED,
          provider: normalized.provider,
          channel: normalized.channel,
          draftsCount: result.draftIds.length
        }
      }
    });

    return result;
  } catch (error) {
    await db.aIJob.update({
      where: { id: aiJob.id },
      data: {
        status: AIJobStatus.FAILED,
        completedByAdminId: normalized.requestedByAdminId,
        completedAt: new Date(),
        errorMessage: toErrorMessage(error)
      }
    });

    await db.auditLog.create({
      data: {
        adminUserId: normalized.requestedByAdminId,
        entityType: AuditEntityType.AI_JOB,
        entityId: aiJob.id,
        action: AuditAction.RUN,
        description: "Ingestao externa de IA falhou.",
        metadata: {
          status: AIJobStatus.FAILED,
          provider: normalized.provider,
          channel: normalized.channel,
          errorMessage: toErrorMessage(error)
        }
      }
    });

    throw error;
  }
}
