import { z } from "zod";

const urlSchema = z.string().trim().url("Informe uma URL valida.");

export const aiExternalMediaInputSchema = z.object({
  externalUrl: urlSchema.optional().nullable(),
  mediaFileId: z.string().trim().optional().nullable(),
  reason: z.string().trim().max(400, "A justificativa da midia deve ter no maximo 400 caracteres.").optional().nullable(),
  confidenceScore: z.number().min(0).max(100).optional().nullable(),
  sortOrder: z.number().int().min(0).optional().nullable()
});

export const aiExternalDraftInputSchema = z.object({
  externalId: z.string().trim().optional().nullable(),
  title: z.string().trim().min(8, "O titulo externo deve ter pelo menos 8 caracteres."),
  subtitle: z.string().trim().max(180, "O subtitulo externo deve ter no maximo 180 caracteres.").optional().nullable(),
  slug: z.string().trim().optional().nullable(),
  summary: z.string().trim().max(320, "O resumo externo deve ter no maximo 320 caracteres.").optional().nullable(),
  content: z.string().trim().min(40, "O conteudo externo deve ter pelo menos 40 caracteres."),
  seoTitle: z.string().trim().max(70, "O SEO title deve ter no maximo 70 caracteres.").optional().nullable(),
  seoDescription: z.string().trim().max(160, "A SEO description deve ter no maximo 160 caracteres.").optional().nullable(),
  confidenceScore: z.number().min(0).max(100).optional().nullable(),
  categorySlug: z.string().trim().optional().nullable(),
  authorSlug: z.string().trim().optional().nullable(),
  countryCode: z.string().trim().max(3).optional().nullable(),
  stateCode: z.string().trim().max(12).optional().nullable(),
  citySlug: z.string().trim().optional().nullable(),
  suggestedTagNames: z.array(z.string().trim().min(1)).max(20).optional(),
  sourceUrls: z.array(urlSchema).max(20).optional(),
  sourceSnapshot: z.unknown().optional(),
  mediaSuggestions: z.array(aiExternalMediaInputSchema).max(12).optional()
});

export const aiCollectionPayloadSchema = z.object({
  provider: z.string().trim().min(2, "Informe o nome do provedor."),
  channel: z.enum(["api", "crawler", "workflow", "manual"]),
  configId: z.string().trim().optional().nullable(),
  jobType: z.string().trim().optional().nullable(),
  promptVersion: z.string().trim().optional().nullable(),
  requestedByAdminId: z.string().trim().optional().nullable(),
  linkedNewsId: z.string().trim().optional().nullable(),
  externalJobId: z.string().trim().optional().nullable(),
  drafts: z.array(aiExternalDraftInputSchema).min(1, "Envie pelo menos um draft externo."),
  rawPayload: z.unknown().optional()
});

export type AICollectionPayloadInput = z.input<typeof aiCollectionPayloadSchema>;
