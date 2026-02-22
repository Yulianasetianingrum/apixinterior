// app/api/admin/admin_dashboard/admin_produk/tambah_produk/upload_gambar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

// sharp butuh Node.js runtime (bukan Edge)
export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
// Soft cap to avoid OOM on extreme uploads. Keep generous to not block users.
const MAX_FILE_BYTES = 80 * 1024 * 1024; // 80MB per file

async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

function safeBaseName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function saveOptimizedWebpToUploads(
  file: File,
  opts?: { maxWidth?: number; quality?: number; baseName?: string }
) {
  if (!file.type?.startsWith("image/")) {
    throw new Error("File yang diupload harus berupa gambar.");
  }
  // Do not hard-block large images; only guard against extreme sizes.
  if (typeof file.size === "number" && file.size > MAX_FILE_BYTES) {
    throw new Error(
      `Ukuran file terlalu besar (maks ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB).`
    );
  }

  await ensureUploadDir();

  const maxWidth = opts?.maxWidth ?? 1600;
  const qualityDefault = opts?.quality ?? 80;
  const base = safeBaseName(opts?.baseName || file.name || "image") || "image";
  const key = randomUUID();
  const filename = `${base}-${key}-${maxWidth}.webp`;
  const outAbs = path.join(UPLOAD_DIR, filename);

  const buf = Buffer.from(await file.arrayBuffer());

  const TARGET_KB = 450;
  const targetBytes = TARGET_KB * 1024;

  try {
    const baseProc = sharp(buf)
      .rotate()
      .resize({ width: maxWidth, withoutEnlargement: true });

    const qualitySteps = [82, 80, 78, 76, 74, 72, 70];
    let outBuf: Buffer | null = null;

    for (const q of qualitySteps) {
      const b = await baseProc
        .clone()
        .webp({ quality: q, effort: 6, smartSubsample: true })
        .toBuffer();
      outBuf = b;
      if (b.length <= targetBytes) break;
    }

    if (!outBuf) {
      outBuf = await baseProc
        .webp({ quality: qualityDefault, effort: 6, smartSubsample: true })
        .toBuffer();
    }

    await fs.writeFile(outAbs, outBuf);
  } catch (err) {
    console.error("[saveOptimizedWebp] sharp error:", err);
    throw new Error("Gagal memproses gambar.");
  }

  return `/api/img?f=${filename}`;
}

function pickFirstFile(formData: FormData): File | null {
  const keys = ["file", "image", "foto", "gambar", "upload"];
  for (const k of keys) {
    const v = formData.get(k);
    if (v instanceof File) return v;
  }
  for (const [, v] of formData.entries()) {
    if (v instanceof File) return v;
  }
  return null;
}

function parseNumber(v: unknown): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = pickFirstFile(formData);
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Wajib upload file gambar (multipart/form-data)." },
        { status: 400 }
      );
    }

    const titleRaw = String(formData.get("title") || "").trim();
    const tagsRaw = String(formData.get("tags") || "").trim();
    const categoryId = parseNumber(formData.get("categoryId"));
    const subcategoryId = parseNumber(formData.get("subcategoryId"));

    const url = await saveOptimizedWebpToUploads(file, {
      baseName: titleRaw || file.name,
      maxWidth: 1600,
      quality: 80,
    });

    const created = await prisma.gambarUpload.create({
      data: {
        url,
        title: titleRaw ? titleRaw : null,
        tags: tagsRaw ? tagsRaw : "",
        ...(categoryId ? { categoryId } : {}),
        ...(subcategoryId ? { subcategoryId } : {}),
      },
    });

    return NextResponse.json({ data: created });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message || "Gagal upload gambar." },
      { status: 500 }
    );
  }
}
