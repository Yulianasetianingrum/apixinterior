import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import crypto from "crypto";

export const runtime = "nodejs";

function safeString(v: unknown) {
  if (typeof v !== "string") return "";
  return v.trim();
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "File tidak ditemukan (field: file)." }, { status: 400 });
    }

    const title = safeString(form.get("title"));
    const tags = safeString(form.get("tags"));
    const categoryIdRaw = safeString(form.get("categoryId"));
    const subcategoryIdRaw = safeString(form.get("subcategoryId"));

    const categoryId = categoryIdRaw ? Number(categoryIdRaw) : null;
    const subcategoryId = subcategoryIdRaw ? Number(subcategoryIdRaw) : null;

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name || "").toLowerCase() || ".jpg";
    const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const abs = path.join(uploadDir, name);
    await writeFile(abs, bytes);

    const url = `/uploads/${name}`;

    const row = await prisma.gambarUpload.create({
      data: {
        url,
        title: title || file.name,
        tags: tags || null,
        categoryId,
        subcategoryId,
      },
      select: { id: true, url: true, title: true },
    });

    return NextResponse.json({ ok: true, image: row });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Upload gagal." }, { status: 500 });
  }
}
