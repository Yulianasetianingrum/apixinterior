// app/api/admin/admin_dashboard/admin_galeri/list_gambar/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeImageUrl(raw: unknown): string {
  let url = String(raw ?? "").trim();
  if (!url) return "";

  // Normalisasi path ala Windows agar valid di URL web.
  url = url.replace(/\\/g, "/");

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

  return url;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const onlyPng = searchParams.get("png") === "1";

  const data = await prisma.gambarUpload.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: true, subcategory: true },
  });

  const normalized = data.map((it: any) => ({
    ...it,
    url: normalizeImageUrl(it?.url),
  }));

  const filtered = onlyPng
    ? normalized.filter((it: any) => /\.png(\?|#|$)/i.test(String(it.url ?? "")))
    : normalized;

  return NextResponse.json({ data: filtered });
}
