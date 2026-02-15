import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = String(searchParams.get("url") ?? "").trim();

  if (!/^https?:\/\//i.test(target)) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const upstream = await fetch(target, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        // Beberapa host menolak request tanpa user-agent.
        "user-agent":
          "Mozilla/5.0 (compatible; ApixInteriorImageProxy/1.0; +https://apixinterior.co.id)",
        accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });
    clearTimeout(timer);

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Upstream image unavailable" },
        { status: upstream.status || 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return NextResponse.json({ error: "Upstream is not an image" }, { status: 415 });
    }

    // Pakai buffer penuh agar tidak kena mismatch transfer/content-encoding upstream.
    const buf = Buffer.from(await upstream.arrayBuffer());
    if (!buf.length) {
      return NextResponse.json({ error: "Empty upstream image" }, { status: 502 });
    }

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "content-type": contentType,
        "content-length": String(buf.length),
        "cache-control": "public, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch upstream image" }, { status: 502 });
  }
}
