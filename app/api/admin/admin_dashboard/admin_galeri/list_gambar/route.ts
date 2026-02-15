// app/api/admin/admin_dashboard/admin_galeri/list_gambar/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const APP_HOSTS = new Set([
  "apixinterior.co.id",
  "www.apixinterior.co.id",
  "localhost",
  "127.0.0.1",
]);

function normalizeImageUrl(raw: unknown): string {
  let url = String(raw ?? "").trim();
  if (!url) return "";

  // Normalisasi path ala Windows agar valid di URL web.
  url = url.replace(/\\/g, "/");
  url = url.replace(/&amp;/gi, "&");

  // Kadang data tersimpan sebagai "public/..." atau "/public/...".
  if (url.startsWith("public/")) url = `/${url.slice("public/".length)}`;
  if (url.startsWith("/public/")) url = url.slice("/public".length);

  // Kalau tanpa skema dan tanpa slash, anggap path relatif aplikasi.
  if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) {
    url = `/${url}`;
  }

  // Halaman admin pakai HTTPS, jadi URL HTTP eksternal sering diblokir browser (mixed content).
  if (/^http:\/\//i.test(url)) {
    url = `https://${url.slice("http://".length)}`;
  }

  // Tolak URL eksternal (anti-hotlink / link expire sering bikin tile abu-abu).
  if (/^https?:\/\//i.test(url)) {
    try {
      const u = new URL(url);
      if (!APP_HOSTS.has(u.hostname)) return "";
      url = `${u.pathname}${u.search}${u.hash}`;
    } catch {
      return "";
    }
  }

  return url;
}

function isLikelyImageUrl(url: string): boolean {
  if (!url) return false;

  // Jalur internal utama upload di project ini.
  if (/^\/api\/img\?f=/i.test(url)) return true;

  // File image langsung (lokal atau absolute URL)
  if (/\.(png|jpe?g|webp|gif|avif|svg)(\?|#|$)/i.test(url)) return true;

  return false;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const onlyPng = searchParams.get("png") === "1";

  const data = await prisma.gambarUpload.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: true, subcategory: true },
  });

  const normalized = data
    .map((it: any) => ({
      ...it,
      url: normalizeImageUrl(it?.url),
    }))
    .filter((it: any) => !!it.url && isLikelyImageUrl(String(it.url)));

  const filtered = onlyPng
    ? normalized.filter((it: any) => /\.png(\?|#|$)/i.test(String(it.url ?? "")))
    : normalized;

  return NextResponse.json({ data: filtered });
}
