type ArticleMediaCandidate = {
  imageUrl: string | null;
  siteName: string | null;
  title: string | null;
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function findMetaContent(html: string, attr: "property" | "name", key: string) {
  const regex = new RegExp(
    `<meta[^>]*${attr}=["']${key}["'][^>]*content=["']([^"']+)["'][^>]*>|<meta[^>]*content=["']([^"']+)["'][^>]*${attr}=["']${key}["'][^>]*>`,
    "i"
  );
  const match = html.match(regex);
  const raw = match?.[1] ?? match?.[2] ?? null;
  return raw ? decodeHtml(raw.trim()) : null;
}

function toAbsoluteUrl(candidate: string | null, baseUrl: string) {
  if (!candidate) return null;

  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return null;
  }
}

export async function extractArticleMediaCandidate(articleUrl: string): Promise<ArticleMediaCandidate | null> {
  try {
    const response = await fetch(articleUrl, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
      headers: {
        "user-agent": "portal-inovaverso/1.0"
      }
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const ogImage = findMetaContent(html, "property", "og:image");
    const twitterImage = findMetaContent(html, "name", "twitter:image");
    const ogSiteName = findMetaContent(html, "property", "og:site_name");
    const ogTitle = findMetaContent(html, "property", "og:title");

    const imageUrl = toAbsoluteUrl(ogImage ?? twitterImage, articleUrl);

    if (!imageUrl) {
      return null;
    }

    return {
      imageUrl,
      siteName: ogSiteName,
      title: ogTitle
    };
  } catch {
    return null;
  }
}

