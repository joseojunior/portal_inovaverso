type GoogleNewsItem = {
  title: string;
  url: string;
  publishedAt: string | null;
  sourceName: string | null;
};

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractTag(block: string, tag: string) {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = block.match(regex);
  return match ? decodeXmlEntities(match[1]).trim() : null;
}

function parseRssItems(xml: string): GoogleNewsItem[] {
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

  return itemMatches
    .map((itemBlock) => {
      const title = extractTag(itemBlock, "title");
      const link = extractTag(itemBlock, "link");
      const pubDate = extractTag(itemBlock, "pubDate");
      const sourceMatch = itemBlock.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
      const sourceName = sourceMatch ? decodeXmlEntities(stripHtml(sourceMatch[1])) : null;

      if (!title || !link) {
        return null;
      }

      return {
        title: stripHtml(title),
        url: link,
        publishedAt: pubDate,
        sourceName
      } satisfies GoogleNewsItem;
    })
    .filter((item): item is GoogleNewsItem => item !== null);
}

function buildQuery(config: {
  query: string;
  keywords: string[];
  excludedKeywords: string[];
  sourceDomains: string[];
  excludedDomains: string[];
}) {
  const terms: string[] = [config.query.trim()];

  if (config.keywords.length > 0) {
    terms.push(...config.keywords.map((item) => `"${item}"`));
  }

  if (config.sourceDomains.length > 0) {
    terms.push(...config.sourceDomains.map((domain) => `site:${domain}`));
  }

  if (config.excludedKeywords.length > 0) {
    terms.push(...config.excludedKeywords.map((item) => `-${item}`));
  }

  if (config.excludedDomains.length > 0) {
    terms.push(...config.excludedDomains.map((domain) => `-site:${domain}`));
  }

  return terms.join(" ").trim();
}

export async function collectGoogleNewsRss(input: {
  query: string;
  keywords: string[];
  excludedKeywords: string[];
  sourceDomains: string[];
  excludedDomains: string[];
  languageCode: string | null;
  maxItems: number;
}) {
  const finalQuery = buildQuery(input);
  const language = (input.languageCode ?? "pt-BR").trim();
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(finalQuery)}&hl=${encodeURIComponent(
    language
  )}&gl=BR&ceid=BR:pt-419`;

  const response = await fetch(rssUrl, {
    method: "GET",
    cache: "no-store",
    headers: { "user-agent": "portal-inovaverso/1.0" }
  });

  if (!response.ok) {
    throw new Error(`Falha ao coletar Google News RSS (${response.status}).`);
  }

  const xml = await response.text();
  const items = parseRssItems(xml).slice(0, input.maxItems);

  return {
    query: finalQuery,
    rssUrl,
    items
  };
}

