export type AIIngestionChannel = "api" | "crawler" | "workflow" | "manual";

export type AIExternalMediaInput = {
  externalUrl?: string | null;
  mediaFileId?: string | null;
  reason?: string | null;
  confidenceScore?: number | null;
  sortOrder?: number | null;
};

export type AIExternalDraftInput = {
  externalId?: string | null;
  title: string;
  subtitle?: string | null;
  slug?: string | null;
  summary?: string | null;
  content: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  confidenceScore?: number | null;
  categorySlug?: string | null;
  authorSlug?: string | null;
  countryCode?: string | null;
  stateCode?: string | null;
  citySlug?: string | null;
  suggestedTagNames?: string[];
  sourceUrls?: string[];
  sourceSnapshot?: unknown;
  mediaSuggestions?: AIExternalMediaInput[];
};

export type AICollectionPayload = {
  provider: string;
  channel: AIIngestionChannel;
  configId?: string | null;
  jobType?: string | null;
  promptVersion?: string | null;
  requestedByAdminId?: string | null;
  linkedNewsId?: string | null;
  externalJobId?: string | null;
  drafts: AIExternalDraftInput[];
  rawPayload?: unknown;
};

export type AINormalizedMediaSuggestion = {
  externalUrl: string | null;
  mediaFileId: string | null;
  reason: string | null;
  confidenceScore: number | null;
  sortOrder: number;
};

export type AINormalizedDraft = {
  title: string;
  subtitle: string | null;
  slug: string | null;
  summary: string | null;
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  confidenceScore: number | null;
  categorySlug: string | null;
  authorSlug: string | null;
  countryCode: string | null;
  stateCode: string | null;
  citySlug: string | null;
  suggestedTagNames: string[];
  sourceUrls: string[];
  sourceSnapshot: unknown;
  mediaSuggestions: AINormalizedMediaSuggestion[];
  externalId: string | null;
};

export type AIIngestionResult = {
  jobId: string;
  draftIds: string[];
};

export type AICollector = {
  provider: string;
  collect(payload: Record<string, unknown>): Promise<AICollectionPayload>;
};
