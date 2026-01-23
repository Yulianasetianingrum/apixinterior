import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('f');
    const width = searchParams.get('w') ? parseInt(searchParams.get('w')!) : null;

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

    try {
        let fileBuffer = fs.readFileSync(filePath);
        let contentType = 'application/octet-stream';
        if (safeFilename.endsWith('.webp')) contentType = 'image/webp';
        else if (safeFilename.endsWith('.png')) contentType = 'image/png';
        else if (safeFilename.endsWith('.jpg') || safeFilename.endsWith('.jpeg')) contentType = 'image/jpeg';
        else if (safeFilename.endsWith('.svg')) contentType = 'image/svg+xml';

        // Performance: Resize and convert to WebP on the fly
        if (contentType.startsWith('image/') && !contentType.includes('svg')) {
            try {
                const sharp = require('sharp');
                let pipeline = sharp(fileBuffer);

                if (width && width > 0) {
                    pipeline = pipeline.resize({ width, withoutEnlargement: true });
                }

                // Always convert to webp for better performance
                fileBuffer = await pipeline.webp({ quality: 80 }).toBuffer();
                contentType = 'image/webp';
            } catch (sharpError) {
                console.error("[ImgRoute] Sharp processing failed:", sharpError);
                // Continue with original buffer if sharp fails
            }
        }

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': fileBuffer.length.toString(),
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (e) {
        console.error("[ImgRoute] Error:", e);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
