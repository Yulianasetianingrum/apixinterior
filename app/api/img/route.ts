import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('f');

    if (!filename) {
        return new NextResponse("Filename required", { status: 400 });
    }

    // Security: Prevent directory traversal
    const safeFilename = path.basename(filename);

    const roots = [
        path.join(process.cwd(), 'public', 'uploads'),
    ];
    const subfolders = ['', 'gambar_upload', 'banners'];

    let filePath = '';
    let found = false;

    for (const root of roots) {
        for (const sub of subfolders) {
            const tryPath = path.join(root, sub, safeFilename);
            if (fs.existsSync(tryPath)) {
                filePath = tryPath;
                found = true;
                break;
            }
        }
        if (found) break;
    }

    if (!found) {
        return new NextResponse("File not found", { status: 404 });
    }

    // Read and serve
    const fileBuffer = fs.readFileSync(filePath);

    // Determine content type
    let contentType = 'application/octet-stream';
    if (safeFilename.endsWith('.webp')) contentType = 'image/webp';
    if (safeFilename.endsWith('.png')) contentType = 'image/png';
    if (safeFilename.endsWith('.jpg') || safeFilename.endsWith('.jpeg')) contentType = 'image/jpeg';
    if (safeFilename.endsWith('.svg')) contentType = 'image/svg+xml';

    return new NextResponse(fileBuffer, {
        headers: {
            'Content-Type': contentType,
            'Content-Length': fileBuffer.length.toString(),
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
}
