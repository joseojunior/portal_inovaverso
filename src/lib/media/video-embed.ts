type SupportedVideoProvider = "youtube" | "vimeo";

export type VideoEmbedData = {
  provider: SupportedVideoProvider;
  providerLabel: string;
  videoId: string;
  canonicalUrl: string;
  embedUrl: string;
  thumbnailUrl: string | null;
};

function normalizeYouTubeId(input: string) {
  const trimmed = input.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v") ?? "";
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }

      const parts = url.pathname.split("/").filter(Boolean);
      const embeddedId = parts[1] ?? "";

      if ((parts[0] === "embed" || parts[0] === "shorts") && /^[a-zA-Z0-9_-]{11}$/.test(embeddedId)) {
        return embeddedId;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeVimeoId(input: string) {
  const trimmed = input.trim();

  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      const id = parts[parts.length - 1] ?? "";
      return /^\d+$/.test(id) ? id : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function normalizeVideoEmbedInput(input: string): VideoEmbedData | null {
  const youtubeId = normalizeYouTubeId(input);

  if (youtubeId) {
    return {
      provider: "youtube",
      providerLabel: "YouTube",
      videoId: youtubeId,
      canonicalUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    };
  }

  const vimeoId = normalizeVimeoId(input);

  if (vimeoId) {
    return {
      provider: "vimeo",
      providerLabel: "Vimeo",
      videoId: vimeoId,
      canonicalUrl: `https://vimeo.com/${vimeoId}`,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      thumbnailUrl: null
    };
  }

  return null;
}
