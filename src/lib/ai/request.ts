import type { AICollectionPayload } from "@/lib/ai/types";
import { aiCollectionPayloadSchema } from "@/lib/ai/validation";

type AIIngestionEnvelope = {
  payload?: unknown;
};

function isEnvelope(value: unknown): value is AIIngestionEnvelope {
  return typeof value === "object" && value !== null && "payload" in value;
}

export function parseAIIngestionRequestBody(body: unknown): AICollectionPayload {
  const payload = isEnvelope(body) ? body.payload : body;

  return aiCollectionPayloadSchema.parse(payload);
}
