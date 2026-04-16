import type { AINormalizedDraft, AINormalizedMediaSuggestion, AICollectionPayload, AIExternalDraftInput } from "@/lib/ai/types";
import { slugify } from "@/lib/slugify";

function normalizeOptional(value?: string | null) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function normalizePercent(value?: number | null) {
  if (value == null || Number.isNaN(value)) {
    return null;
  }

  return Math.min(100, Math.max(0, Number(value)));
}

function normalizeList(values?: string[]) {
  if (!values) {
    return [];
  }

  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizeMediaSuggestions(input?: AIExternalDraftInput["mediaSuggestions"]): AINormalizedMediaSuggestion[] {
  if (!input || input.length === 0) {
    return [];
  }

  return input.map((item, index) => ({
    externalUrl: normalizeOptional(item.externalUrl ?? null),
    mediaFileId: normalizeOptional(item.mediaFileId ?? null),
    reason: normalizeOptional(item.reason ?? null),
    confidenceScore: normalizePercent(item.confidenceScore ?? null),
    sortOrder: item.sortOrder ?? index
  }));
}

export function normalizeExternalDraft(input: AIExternalDraftInput): AINormalizedDraft {
  return {
    title: input.title.trim(),
    subtitle: normalizeOptional(input.subtitle),
    slug: normalizeOptional(input.slug) ? slugify(input.slug ?? "") : null,
    summary: normalizeOptional(input.summary),
    content: input.content.trim(),
    seoTitle: normalizeOptional(input.seoTitle),
    seoDescription: normalizeOptional(input.seoDescription),
    confidenceScore: normalizePercent(input.confidenceScore),
    categorySlug: normalizeOptional(input.categorySlug) ? slugify(input.categorySlug ?? "") : null,
    authorSlug: normalizeOptional(input.authorSlug) ? slugify(input.authorSlug ?? "") : null,
    countryCode: normalizeOptional(input.countryCode)?.toUpperCase() ?? null,
    stateCode: normalizeOptional(input.stateCode)?.toUpperCase() ?? null,
    citySlug: normalizeOptional(input.citySlug) ? slugify(input.citySlug ?? "") : null,
    suggestedTagNames: normalizeList(input.suggestedTagNames),
    sourceUrls: normalizeList(input.sourceUrls),
    sourceSnapshot: input.sourceSnapshot ?? null,
    mediaSuggestions: normalizeMediaSuggestions(input.mediaSuggestions),
    externalId: normalizeOptional(input.externalId)
  };
}

export function normalizeCollectionPayload(payload: AICollectionPayload) {
  return {
    ...payload,
    provider: payload.provider.trim(),
    jobType: normalizeOptional(payload.jobType) ?? "external_ingestion",
    promptVersion: normalizeOptional(payload.promptVersion),
    configId: normalizeOptional(payload.configId),
    requestedByAdminId: normalizeOptional(payload.requestedByAdminId),
    linkedNewsId: normalizeOptional(payload.linkedNewsId),
    externalJobId: normalizeOptional(payload.externalJobId),
    drafts: payload.drafts.map(normalizeExternalDraft)
  };
}
