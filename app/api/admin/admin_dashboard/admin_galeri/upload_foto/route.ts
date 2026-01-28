// app/api/admin/admin_galeri/upload_foto/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large files


export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // Support multiple files
    const files = formData.getAll('foto') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'File foto tidak ditemukan' },
        { status: 400 },
      );
    }

    // Common fields for all files (if shared)
    const formTitle = formData.get('title') as string | null;
    const formTags = formData.get('tags') as string | null;

    // Category handling
    const formCategoryId = formData.get('categoryId') as string | null;
    const formSubcategoryId = formData.get('subcategoryId') as string | null;
    const formCategoryName = formData.get('category') as string | null;
    const formSubcategoryName = formData.get('subcategory') as string | null;

    // --- PREPARE CATEGORY (Once for all files if shared) ---
    // If user selects specific category, we resolve it now
    let finalCategoryId: number | null = null;
    let finalSubcategoryId: number | null = null;

    // 1. Resolve Category
    if (formCategoryId && !Number.isNaN(Number(formCategoryId))) {
      finalCategoryId = Number(formCategoryId);
    } else if (formCategoryName && formCategoryName.trim() !== '') {
      const name = formCategoryName.trim();
      let cat = await prisma.category.findUnique({ where: { name } });
      if (!cat) {
        cat = await prisma.category.create({ data: { name } });
      }
      finalCategoryId = cat.id;
    }

    // 2. Resolve Subcategory
    if (finalCategoryId) {
      if (formSubcategoryId && !Number.isNaN(Number(formSubcategoryId))) {
        finalSubcategoryId = Number(formSubcategoryId);
      } else if (formSubcategoryName && formSubcategoryName.trim() !== '') {
        const subName = formSubcategoryName.trim();
        let sub = await prisma.subcategory.findFirst({
          where: { name: subName, categoryId: finalCategoryId }
        });
        if (!sub) {
          sub = await prisma.subcategory.create({
            data: { name: subName, categoryId: finalCategoryId }
          });
        }
        finalSubcategoryId = sub.id;
      }
    }

    // --- PROCESS FILES ---
    const results = [];
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Tags processing
    const tagList = formTags
      ? formTags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    const tagsString = tagList.join(', ');

    for (const file of files) {
      if (!file.name) continue;

      const originalBuffer = Buffer.from(await file.arrayBuffer());
      let finalBuffer = originalBuffer;
      let finalFileName = "";

      // Auto-generate title if not provided or if multiple files (append index/name?)
      // If multiple files, we probably shouldn't use the exact same title for all unless intended.
      // Logic: If title is provided, use it. If multiple files, properly just use filename or append?
      // Let's stick to: If 1 file, use formTitle provided. If >1 file, use filename as title fallback usually safer,
      // UNLESS formTitle is generic like "Project A". Let's use FormTitle if exists.

      // Sharp Optimization
      const originalName = file.name;
      let safeName = originalName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-]/g, '');

      try {
        const sharp = require('sharp');
        const processing = sharp(originalBuffer)
          .resize({ width: 1920, withoutEnlargement: true })
          .webp({ quality: 65, effort: 4 });

        finalBuffer = await processing.toBuffer();
        const baseName = safeName.substring(0, safeName.lastIndexOf('.')) || safeName;
        finalFileName = `${Date.now()}-${baseName}-${Math.floor(Math.random() * 1000)}.webp`;

      } catch (filesError) {
        console.error(`Sharp failed for ${originalName}`, filesError);
        finalBuffer = originalBuffer;
        finalFileName = `${Date.now()}-${safeName}`;
      }

      // Write
      await fs.writeFile(path.join(uploadsDir, finalFileName), finalBuffer);
      const url = `/api/img?f=${finalFileName}`;

      // Determine Title
      // If user gave a title, use it. If multiple, maybe append? 
      // Current requirement: simple "Add" might imply batch upload. 
      // Let's use regex to nice-ify filename if no title provided.
      let thisTitle = formTitle;
      if (!thisTitle || thisTitle.trim() === '') {
        let name = originalName.replace(/\.[^/.]+$/, "");
        name = name.replace(/[-_]/g, " ");
        thisTitle = name.replace(/\b\w/g, (l) => l.toUpperCase());
      }

      // Save DB
      const gambar = await prisma.gambarUpload.create({
        data: {
          url,
          title: thisTitle,
          tags: tagsString,
          categoryId: finalCategoryId,
          subcategoryId: finalSubcategoryId,
        }
      });
      results.push(gambar);
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      data: results // Array of created items
    });

  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server saat upload' },
      { status: 500 },
    );
  }
}
