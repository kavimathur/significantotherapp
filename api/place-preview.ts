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

function decodeGoogleEscapes(value: string) {
  return decodeHtml(value)
    .replace(/\\u003d/g, "=")
    .replace(/\\u0026/g, "&")
    .replace(/\\u0027/g, "'")
    .replace(/\\u002F/g, "/")
    .replace(/\\\//g, "/");
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function cleanTitle(value: string) {
  const decoded = safeDecode(decodeGoogleEscapes(value).replace(/\+/g, " "));
  const cleaned = decoded
    .replace(/\s+-\s+Google Maps$/i, "")
    .replace(/^Google Maps$/i, "")
    .replace(/@[-.\d,za-z]+.*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned === "Google Maps" ? "" : cleaned;
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

function titleFromUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const queryParam = url.searchParams.get("q") ?? url.searchParams.get("query");
    const placeMatch = url.pathname.match(/\/(?:maps\/)?place\/([^/@]+)/);
    const directoryMatch = url.pathname.match(/\/maps\/dir\/(?:[^/]+\/)?([^/]+)/);
    const extracted = queryParam ?? placeMatch?.[1] ?? directoryMatch?.[1] ?? "";
    return cleanTitle(extracted);
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

function previewPlaceUrl(html: string) {
  const match = html.match(/<link[^>]+href=["']([^"']*\/maps\/preview\/place[^"']+)["']/i);
  if (!match?.[1]) {
    return "";
  }

  return new URL(decodeGoogleEscapes(match[1]), "https://www.google.com").toString();
}

function normalizeGooglePhoto(url: string) {
  return url.replace(/=w\d+-h\d+[^?&]*/i, "=w900-h675-k-no");
}

function listingPhotoFromText(text: string) {
  const decoded = decodeGoogleEscapes(text);
  const urls = decoded.match(/https?:\/\/[^\s"'\\\],]+/g) ?? [];

  const photo = urls.find((url) => {
    const lower = url.toLowerCase();
    return (
      (lower.includes("lh3.googleusercontent.com") || lower.includes("lh3.ggpht.com")) &&
      !lower.includes("streetview") &&
      !lower.includes("staticmap") &&
      !lower.includes("gstatic.com") &&
      !lower.includes("/maps/vt")
    );
  });

  return photo ? normalizeGooglePhoto(photo) : "";
}

async function fetchPlacePayload(html: string) {
  const previewUrl = previewPlaceUrl(html);
  if (!previewUrl) {
    return null;
  }

  try {
    const fetched = await fetch(previewUrl, {
      headers: {
        "user-agent": "Mozilla/5.0 KeeperPreview/1.0",
        accept: "application/json,text/plain,*/*",
      },
      redirect: "follow",
    });

    if (!fetched.ok) {
      return null;
    }

    const text = await fetched.text();

    return {
      title: titleFromUrl(previewUrl),
      image: listingPhotoFromText(text),
    };
  } catch {
    return null;
  }
}

export default async function handler(request: any, response: any) {
  const rawUrl = String(request.query?.url ?? "");

  if (!rawUrl || !isAllowedUrl(rawUrl)) {
    response.status(400).json({ error: "A Google Maps URL is required." });
    return;
  }

  const fallbackTitle = titleFromUrl(rawUrl) || "Saved map spot";

  try {
    const fetched = await fetch(rawUrl, {
      headers: {
        "user-agent": "Mozilla/5.0 KeeperPreview/1.0",
        accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    const html = await fetched.text();
    const placePayload = await fetchPlacePayload(html);
    const resolvedTitle = titleFromUrl(fetched.url);
    const ogTitle = cleanTitle(metaContent(html, "og:title"));
    const htmlImage = listingPhotoFromText(html);
    const title = placePayload?.title || resolvedTitle || ogTitle || fallbackTitle;
    const image = placePayload?.image || htmlImage;

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
