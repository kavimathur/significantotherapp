type JsonResponse = {
  title: string;
  image?: string;
  mapQuery: string;
};

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  quot: "\"",
  apos: "'",
  lt: "<",
  gt: ">",
};

function decodeHtml(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&([a-z]+);/gi, (_, entity) => ENTITY_MAP[entity.toLowerCase()] ?? entity);
}

function metaContent(html: string, property: string) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtml(match[1].trim());
    }
  }

  return "";
}

function fallbackFromUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const queryParam = url.searchParams.get("q") ?? url.searchParams.get("query");
    const placeMatch = url.pathname.match(/\/place\/([^/]+)/);
    const extracted = queryParam ?? placeMatch?.[1] ?? "";
    return decodeURIComponent(extracted.replace(/\+/g, " ")).replace(/@[-.\d,]+.*/, "").trim();
  } catch {
    return "";
  }
}

function isAllowedUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      (host.includes("google.") || host === "maps.app.goo.gl" || host === "goo.gl")
    );
  } catch {
    return false;
  }
}

export default async function handler(request: any, response: any) {
  const rawUrl = String(request.query?.url ?? "");

  if (!rawUrl || !isAllowedUrl(rawUrl)) {
    response.status(400).json({ error: "A Google Maps URL is required." });
    return;
  }

  const fallbackTitle = fallbackFromUrl(rawUrl) || "Saved map spot";

  try {
    const fetched = await fetch(rawUrl, {
      headers: {
        "user-agent": "Mozilla/5.0 KeeperPreview/1.0",
        accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    const html = await fetched.text();
    const ogTitle = metaContent(html, "og:title").replace(/ - Google Maps$/i, "");
    const image = metaContent(html, "og:image");
    const title = ogTitle || fallbackTitle;

    const payload: JsonResponse = {
      title,
      image: image || undefined,
      mapQuery: title || fallbackTitle || rawUrl,
    };

    response.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    response.status(200).json(payload);
  } catch {
    response.status(200).json({
      title: fallbackTitle,
      mapQuery: fallbackTitle || rawUrl,
    } satisfies JsonResponse);
  }
}
