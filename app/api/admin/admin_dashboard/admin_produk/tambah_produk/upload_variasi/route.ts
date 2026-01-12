// app/api/admin/admin_dashboard/admin_produk/tambah_produk/upload_variasi/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

// sharp butuh Node.js runtime (bukan Edge)
export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// batas aman (opsional)
const MAX_FILE_BYTES = 12 * 1024 * 1024; // 12MB

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

function parseNumber(v: unknown): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

async function saveOptimizedWebpToUploads(
  file: File,
  opts?: { maxWidth?: number; quality?: number; baseName?: string }
) {
  if (!file.type?.startsWith("image/")) {
    throw new Error("File yang diupload harus berupa gambar.");
  }
  if (typeof file.size === "number" && file.size > MAX_FILE_BYTES) {
    throw new Error(`Ukuran file terlalu besar (maks ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB).`);
  }

  await ensureUploadDir();

  const maxWidth = opts?.maxWidth ?? 1600;
  const quality = opts?.quality ?? 80;
  const base = safeBaseName(opts?.baseName || file.name || "image") || "image";
  const key = randomUUID();
  const filename = `${base}-${key}-${maxWidth}.webp`;
  const outAbs = path.join(UPLOAD_DIR, filename);

  const buf = Buffer.from(await file.arrayBuffer());

  await sharp(buf)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toFile(outAbs);

  return `/uploads/${filename}`;
}

function pickFirstFile(formData: FormData): File | null {
  // supaya fleksibel: frontend boleh kirim dengan key apa saja
  const keys = ["file", "image", "foto", "gambar", "upload"];
  for (const k of keys) {
    const v = formData.get(k);
    if (v instanceof File) return v;
  }

  // fallback: kalau frontend kirim hanya 1 file tanpa key yang kita tahu
  for (const [, v] of formData.entries()) {
    if (v instanceof File) return v;
  }
  return null;
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
    const varId = parseNumber(formData.get("varId"));

    // optional (sesuai schema gambar_upload.sql)
    const categoryId = parseNumber(formData.get("categoryId"));
    const subcategoryId = parseNumber(formData.get("subcategoryId"));

    const url = await saveOptimizedWebpToUploads(file, {
      baseName: titleRaw || file.name,
      maxWidth: 1600,
      quality: 80,
    });

    // Simpan ke tabel gambarUpload (kolase) => sumber tunggal untuk variasi
    const created = await prisma.gambarUpload.create({
      data: {
        url,
        title: titleRaw ? titleRaw : null,
        tags: tagsRaw ? tagsRaw : "variasi",
        ...(categoryId ? { categoryId } : {}),
        ...(subcategoryId ? { subcategoryId } : {}),
      },
    });

    let galeriEntry: { id: number; variasiProdukId: number } | null = null;
    if (varId && varId > 0) {
      galeriEntry = await prisma.variasiGaleri.create({
        data: {
          variasiProdukId: varId,
          gambarId: created.id,
          urutan: 0,
        },
        select: { id: true, variasiProdukId: true },
      });
    }

    // Response fleksibel: page.tsx kamu bisa baca (json.data ?? json.image ?? json)
    return NextResponse.json({ data: created, galeri: galeriEntry });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message || "Gagal upload gambar variasi." },
      { status: 500 }
    );
  }
}
