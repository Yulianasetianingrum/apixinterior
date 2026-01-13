import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

function contentTypeByExt(ext: string) {
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await ctx.params;

    if (
      !filename ||
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "app", "uploads", filename);
    const data = await fs.readFile(filePath);

    const ext = path.extname(filename).toLowerCase();
    const ct = contentTypeByExt(ext);

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
