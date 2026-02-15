import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

function extractFilename(raw: unknown): string {
  const url = String(raw ?? "").trim();
  if (!url) return "";

  // Format utama dari upload kolase: /api/img?f=<filename>
  if (/^\/api\/img\?/i.test(url)) {
    try {
      const q = url.split("?")[1] ?? "";
      const sp = new URLSearchParams(q);
      return String(sp.get("f") ?? "").trim();
    } catch {
      return "";
    }
  }

  // Fallback untuk data lama: ambil basename path/URL.
  const normalized = url.replace(/\\/g, "/").split("?")[0].split("#")[0];
  const parts = normalized.split("/").filter(Boolean);
  return (parts[parts.length - 1] || "").trim();
}

function resolveUploadFilePath(filename: string): string | null {
  if (!filename) return null;
  const safe = path.basename(filename);
  const root = path.join(process.cwd(), "public", "uploads");
  const candidates = [
    path.join(root, safe),
    path.join(root, "gambar_upload", safe),
    path.join(root, "banners", safe),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

function toCanonicalUrl(filename: string): string {
  return `/api/img?f=${encodeURIComponent(path.basename(filename))}`;
}

async function isRenderableImage(filePath: string): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sharp = require("sharp");
    // rotate() supaya EXIF orientation dihormati.
    const meta = await sharp(filePath).rotate().metadata();
    const w = Number(meta?.width || 0);
    const h = Number(meta?.height || 0);
    if (!w || !h) return false;

    // Buang file kecil banget / anomali strip.
    if (w < 120 || h < 120) return false;
    const ratio = w / h;
    if (ratio > 3.5 || ratio < 1 / 3.5) return false;
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const onlyPng = searchParams.get("png") === "1";

  const rows = await prisma.gambarUpload.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, subcategory: true },
  });

  const mapped = rows
    .map((row: any) => {
      const filename = extractFilename(row?.url);
      if (!filename) return null;
      const filePath = resolveUploadFilePath(filename);
      if (!filePath) return null;

      const canonicalUrl = toCanonicalUrl(filename);
      return {
        ...row,
        url: canonicalUrl,
        thumbUrl: `/api/admin/admin_dashboard/admin_galeri/thumb?id=${row.id}`,
        __filePath: filePath,
      };
    })
    .filter(Boolean) as any[];

  const validated = await Promise.all(
    mapped.map(async (it) => ((await isRenderableImage(String(it.__filePath || ""))) ? it : null))
  );

  const data = validated
    .filter(Boolean)
    .map((it: any) => {
      const { __filePath, ...rest } = it;
      return rest;
    });

  const filtered = onlyPng
    ? data.filter((it) => /\.png(\?|#|$)/i.test(String(it.url ?? "")))
    : data;

  return NextResponse.json({ data: filtered });
}
