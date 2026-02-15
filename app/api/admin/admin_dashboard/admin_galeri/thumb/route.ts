import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

function resolveFilePathFromUrl(raw: string): string | null {
  const url = String(raw || "").trim();
  if (!url) return null;

  let filename = "";
  if (/^\/api\/img\?/i.test(url)) {
    const q = url.split("?")[1] ?? "";
    const sp = new URLSearchParams(q);
    filename = String(sp.get("f") ?? "").trim();
  } else {
    const normalized = url.replace(/\\/g, "/").split("?")[0].split("#")[0];
    const parts = normalized.split("/").filter(Boolean);
    filename = parts[parts.length - 1] || "";
  }

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id") || 0);
  if (!id) return new NextResponse("Bad Request", { status: 400 });

  const row = await prisma.gambarUpload.findUnique({
    where: { id },
    select: { url: true },
  });
  if (!row?.url) return new NextResponse("Not Found", { status: 404 });

  const filePath = resolveFilePathFromUrl(row.url);
  if (!filePath) return new NextResponse("Not Found", { status: 404 });

  try {
    const sharp = require("sharp");
    const buf = await sharp(filePath)
      .rotate()
      .resize({ width: 320, height: 320, fit: "contain", background: "#f8fafc" })
      .webp({ quality: 82 })
      .toBuffer();

    return new NextResponse(buf, {
      headers: {
        "content-type": "image/webp",
        "content-length": String(buf.length),
        "cache-control": "no-store, max-age=0",
      },
    });
  } catch {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
