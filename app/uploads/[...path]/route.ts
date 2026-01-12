// app/uploads/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const BASE_DIR = path.join(process.cwd(), "app", "uploads");

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

function safeJoin(base: string, targetParts: string[]) {
  const targetPath = path.normalize(path.join(base, ...targetParts));
  if (!targetPath.startsWith(base + path.sep) && targetPath !== base) {
    return null;
  }
  return targetPath;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: { path: string[] } }
) {
  const parts = Array.isArray(ctx.params?.path) ? ctx.params.path : [];
  const decoded = parts
    .map((p) => {
      try {
        return decodeURIComponent(p);
      } catch {
        return p;
      }
    })
    .filter(Boolean);

  const filePath = safeJoin(BASE_DIR, decoded);
  if (!filePath) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  let data: Buffer;
  try {
    data = await fs.readFile(filePath);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";

  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // cache agresif untuk assets, aman karena file name fixed
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
