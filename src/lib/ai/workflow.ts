import type { AICollectionPayload, AIIngestionResult } from "@/lib/ai/types";
import { persistExternalCollection } from "@/lib/ai/persist";

export type AIIngestionPort = {
  ingest(payload: AICollectionPayload): Promise<AIIngestionResult>;
};

export class EditorialAIIngestionService implements AIIngestionPort {
  async ingest(payload: AICollectionPayload) {
    return persistExternalCollection(payload);
  }
}
