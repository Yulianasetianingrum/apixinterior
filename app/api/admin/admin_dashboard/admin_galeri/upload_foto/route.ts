// app/api/admin/admin_galeri/upload_foto/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // Bisa terima "foto" (versi lama) atau "file" (versi baru)
    const file =
      (formData.get('foto') as File | null) ||
      (formData.get('file') as File | null);

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File foto tidak ditemukan' },
        { status: 400 },
      );
    }

    // Field tambahan (optional)
    const titleFromForm = formData.get('title') as string | null;
    const tagsRaw = formData.get('tags') as string | null;

    // Bisa pakai ID langsung
    const categoryIdRaw = formData.get('categoryId') as string | null;
    const subcategoryIdRaw = formData.get('subcategoryId') as string | null;

    // Atau pakai nama (kalau mau auto-bikin kategori/subkategori)
    const categoryName = formData.get('category') as string | null;
    const subcategoryName = formData.get('subcategory') as string | null;

    // ========= OPTIMASI GAMBAR (SHARP) & SAVE =========
    const originalBuffer = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    let finalBuffer = originalBuffer;
    let finalFileName = "";

    // Attempt Sharp
    const originalName = file.name || 'upload';
    let safeName = originalName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-]/g, '');

    try {
      const sharp = require('sharp');
      const processing = sharp(originalBuffer)
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 65, effort: 4 });

      finalBuffer = await processing.toBuffer();

      // Use webp extension
      const baseName = safeName.substring(0, safeName.lastIndexOf('.')) || safeName;
      finalFileName = `${Date.now()}-${baseName}.webp`;

      console.log("Upload: Image optimized with Sharp.");
    } catch (sharpError) {
      console.error("Upload Warning: Sharp failed, saving original.", sharpError);

      // Fallback to original
      finalBuffer = originalBuffer;
      finalFileName = `${Date.now()}-${safeName}`;
    }

    // Write file
    const filePath = path.join(uploadsDir, finalFileName);
    await fs.writeFile(filePath, finalBuffer);

    // URL yang bisa diakses visitor (Lewat API Dynamic biar langsung muncul tanpa restart)
    const url = `/api/img?f=${finalFileName}`;

    // ========= TITLE & TAGS =========
    const autoTitle =
      titleFromForm && titleFromForm.trim() !== ''
        ? titleFromForm.trim()
        : originalName;

    const tagList = tagsRaw
      ? tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      : [];

    // ========= CATEGORY / SUBCATEGORY HANDLING =========
    let categoryId: number | null = null;
    let subcategoryId: number | null = null;

    // 1. Kalau ada categoryId & subcategoryId numeric → pakai itu dulu
    if (categoryIdRaw && !Number.isNaN(Number(categoryIdRaw))) {
      categoryId = Number(categoryIdRaw);
    }
    if (subcategoryIdRaw && !Number.isNaN(Number(subcategoryIdRaw))) {
      subcategoryId = Number(subcategoryIdRaw);
    }

    // 2. Kalau belum ada categoryId, tapi ada nama kategori → findOrCreate
    if (!categoryId && categoryName && categoryName.trim() !== '') {
      const name = categoryName.trim();

      let category = await prisma.category.findUnique({
        where: { name },
      });

      if (!category) {
        category = await prisma.category.create({
          data: { name },
        });
      }

      categoryId = category.id;
    }

    // 3. Kalau belum ada subcategoryId, tapi ada nama subkategori & categoryId → findOrCreate
    if (
      categoryId &&
      !subcategoryId &&
      subcategoryName &&
      subcategoryName.trim() !== ''
    ) {
      const subName = subcategoryName.trim();

      let subcategory = await prisma.subcategory.findFirst({
        where: {
          name: subName,
          categoryId,
        },
      });

      if (!subcategory) {
        subcategory = await prisma.subcategory.create({
          data: {
            name: subName,
            categoryId,
          },
        });
      }

      subcategoryId = subcategory.id;
    }

    // ========= SIMPAN KE DATABASE (GambarUpload) =========
    const gambar = await prisma.gambarUpload.create({
      data: {
        url,
        title: autoTitle,
        tags: tagList.join(', '),
        categoryId,
        subcategoryId,
      },
      include: {
        category: true,
        subcategory: true,
      },
    });

    // ========= RESPONSE =========
    return NextResponse.json({
      success: true,
      data: gambar,      // buat kode lama
      id: gambar.id,     // buat kebutuhan baru
      url: gambar.url,
      title: gambar.title,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server saat upload' },
      { status: 500 },
    );
  }
}
