import { NextResponse } from "next/server";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = String(searchParams.get("url") ?? "").trim();

  if (!/^https?:\/\//i.test(target)) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  try {
    const upstream = await fetch(target, {
      cache: "no-store",
      headers: {
        // Beberapa host menolak request tanpa user-agent.
        "user-agent":
          "Mozilla/5.0 (compatible; ApixInteriorImageProxy/1.0; +https://apixinterior.co.id)",
        accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: "Upstream image unavailable" },
        { status: upstream.status || 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return NextResponse.json({ error: "Upstream is not an image" }, { status: 415 });
    }

    const headers = new Headers();
    headers.set("content-type", contentType);
    headers.set("cache-control", "public, max-age=300");

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("content-length", contentLength);

    for (const [k, v] of upstream.headers.entries()) {
      const key = k.toLowerCase();
      if (HOP_BY_HOP_HEADERS.has(key)) continue;
      if (key === "content-type" || key === "content-length" || key === "cache-control") continue;
      if (key.startsWith("access-control-")) continue;
      headers.set(k, v);
    }

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch {
    return NextResponse.json({ error: "Failed to fetch upstream image" }, { status: 502 });
  }
}

