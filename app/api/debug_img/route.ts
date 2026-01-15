
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const id = 336;
        const img = await prisma.gambarUpload.findUnique({ where: { id } });

        const cwd = process.cwd();
        const publicDir = path.join(cwd, 'public');
        const uploadsDir = path.join(publicDir, 'uploads', 'gambar_upload');
        const publicExists = fs.existsSync(publicDir);
        const uploadsExists = fs.existsSync(uploadsDir);

        let fileExists = false;
        let localPath = "";

        if (img && img.url) {
            const relative = img.url.replace(/^\//, "").replace(/^uploads\/gambar_upload\//, "");
            localPath = path.join(uploadsDir, relative);
            fileExists = fs.existsSync(localPath);
        }

        return NextResponse.json({
            cwd,
            publicExists,
            uploadsExists,
            img,
            localPath,
            fileExists
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    } finally {
        await prisma.$disconnect();
    }
}
