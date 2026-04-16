import type { AICollectionPayload, AICollector } from "@/lib/ai/types";

export class AICollectorRegistry {
  private readonly collectors = new Map<string, AICollector>();

  register(collector: AICollector) {
    this.collectors.set(collector.provider, collector);
  }

  get(provider: string) {
    return this.collectors.get(provider) ?? null;
  }

  listProviders() {
    return Array.from(this.collectors.keys());
  }
}

export class UnsupportedAICollectorError extends Error {
  constructor(provider: string) {
    super(`Nenhum coletor de IA registrado para o provedor "${provider}".`);
    this.name = "UnsupportedAICollectorError";
  }
}

export async function collectFromRegisteredProvider(
  registry: AICollectorRegistry,
  provider: string,
  payload: Record<string, unknown>
): Promise<AICollectionPayload> {
  const collector = registry.get(provider);

  if (!collector) {
    throw new UnsupportedAICollectorError(provider);
  }

  return collector.collect(payload);
}
