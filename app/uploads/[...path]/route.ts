// app/uploads/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const BASE_DIR_APP = path.join(process.cwd(), "app", "uploads");
const BASE_DIR_PUBLIC = path.join(process.cwd(), "public", "uploads");
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
  ctx: { params: Promise<{ path: string[] }> }
) {
  const params = await ctx.params;
  const parts = Array.isArray(params?.path) ? params.path : [];
  const decoded = parts
    .map((p: string) => {
      try {
        return decodeURIComponent(p);
      } catch {
        return p;
      }
    })
    .filter(Boolean);

  const filePathPublic = safeJoin(BASE_DIR_PUBLIC, decoded);
  const filePathApp = safeJoin(BASE_DIR_APP, decoded);
  
  if (!filePathPublic && !filePathApp) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  let data: Buffer;
  let finalFilePath = filePathPublic || filePathApp || "";

  try {
    if (filePathPublic) {
      data = await fs.readFile(filePathPublic);
      finalFilePath = filePathPublic;
    } else {
      throw new Error("Skip");
    }
  } catch {
    try {
      if (filePathApp) {
        data = await fs.readFile(filePathApp);
        finalFilePath = filePathApp;
      } else {
        throw new Error("Not found");
      }
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const ext = path.extname(finalFilePath).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";

  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // cache agresif untuk assets, aman karena file name fixed
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
