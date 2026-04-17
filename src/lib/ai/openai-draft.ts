import { z } from "zod";

import { getOpenAIEnv } from "@/lib/env";
import type { AIExternalDraftInput } from "@/lib/ai/types";

const llmDraftSchema = z.object({
  title: z.string().min(8),
  subtitle: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  content: z.string().min(120),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  suggestedTagNames: z.array(z.string().min(1)).max(15).default([]),
  confidenceScore: z.number().min(0).max(100).nullable().optional()
});

function toNullable(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function clampText(value: string | null | undefined, max: number) {
  const normalized = toNullable(value);
  if (!normalized) return null;
  return normalized.length > max ? normalized.slice(0, max).trim() : normalized;
}

function extractFirstJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start < 0 || end <= start) {
    throw new Error("Resposta do LLM sem JSON valido.");
  }

  return text.slice(start, end + 1);
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const response = payload as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  const topLevel = response.output_text?.trim();
  if (topLevel) {
    return topLevel;
  }

  const contentText =
    response.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item?.type === "output_text" && typeof item.text === "string")
      .map((item) => item.text?.trim() ?? "")
      .filter((value) => value.length > 0)
      .join("\n")
      .trim() ?? "";

  return contentText;
}

export async function generateDraftWithOpenAI(input: {
  query: string;
  languageCode: string | null;
  categorySlug: string | null;
  countryCode: string | null;
  stateCode: string | null;
  citySlug: string | null;
  sources: Array<{
    title: string;
    url: string;
    publishedAt: string | null;
    sourceName: string | null;
  }>;
}) {
  const env = getOpenAIEnv();
  const model = env.OPENAI_MODEL;

  const systemPrompt =
    "Voce e um assistente editorial. Gere APENAS JSON valido sem markdown. Nao invente fatos. Baseie-se somente nas fontes fornecidas.";

  const userPrompt = [
    `Idioma: ${input.languageCode ?? "pt-BR"}`,
    `Contexto editorial (query): ${input.query}`,
    "Fontes (ordem de relevancia):",
    ...input.sources.map((source, index) =>
      `${index + 1}. titulo="${source.title}" url="${source.url}" origem="${source.sourceName ?? "desconhecida"}" data="${
        source.publishedAt ?? "desconhecida"
      }"`
    ),
    "Retorne JSON com campos: title, subtitle, summary, content, seoTitle, seoDescription, suggestedTagNames, confidenceScore.",
    "Resumo maximo 320 chars. SEO description maximo 160 chars. suggestedTagNames deve ser array de strings."
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
        { role: "user", content: [{ type: "input_text", text: userPrompt }] }
      ],
      max_output_tokens: 1400
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Falha OpenAI (${response.status}): ${errorBody.slice(0, 300)}`);
  }

  const json = (await response.json()) as unknown;
  const outputText = extractOutputText(json);

  if (!outputText) {
    throw new Error("OpenAI retornou resposta sem texto utilizavel.");
  }

  const parsed = llmDraftSchema.parse(JSON.parse(extractFirstJsonObject(outputText)));

  const draft: AIExternalDraftInput = {
    title: parsed.title.trim(),
    subtitle: clampText(parsed.subtitle, 180),
    summary: clampText(parsed.summary, 320),
    content: parsed.content.trim(),
    seoTitle: clampText(parsed.seoTitle, 70),
    seoDescription: clampText(parsed.seoDescription, 160),
    suggestedTagNames: parsed.suggestedTagNames,
    confidenceScore: parsed.confidenceScore ?? null,
    categorySlug: input.categorySlug,
    countryCode: input.countryCode,
    stateCode: input.stateCode,
    citySlug: input.citySlug,
    sourceUrls: input.sources.map((item) => item.url),
    sourceSnapshot: {
      provider: "openai",
      model,
      query: input.query,
      sourcesCount: input.sources.length
    }
  };

  return {
    draft,
    model
  };
}
