import "dotenv/config";

import { generateDraftWithOpenAI } from "@/lib/ai/openai-draft";

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY ausente.");
  }

  const result = await generateDraftWithOpenAI({
    query: "tecnologia brasil",
    languageCode: "pt-BR",
    categorySlug: "tecnologia",
    countryCode: "BR",
    stateCode: null,
    citySlug: null,
    sources: [
      {
        title: "Brasil avança em inovação e tecnologia",
        url: "https://example.com/noticia-tecnologia",
        publishedAt: new Date().toISOString(),
        sourceName: "Fonte Teste"
      }
    ]
  });

  console.log("OK", {
    model: result.model,
    title: result.draft.title,
    contentLength: result.draft.content.length,
    tags: result.draft.suggestedTagNames?.length ?? 0
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
