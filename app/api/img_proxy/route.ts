
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    if (!file) {
        return new NextResponse('Missing file param', { status: 400 });
    }

    // Security: Prevent directory traversal (basic)
    // We allow basic query params in input (e.g. file.png?v=1) but strip them for filesystem
    const rawFile = file.split('?')[0]; // simple strip query
    const safeFile = path.basename(rawFile);

    // Define potential roots
    // 1. Current working directory (standard)
    // 2. Fallback to source directory (absolute path for this environment)
    const roots = [
        path.join(process.cwd(), 'public', 'uploads'),
        path.resolve('d:\\apix_interior\\public\\uploads')
    ];

    // Define potential subfolders to check
    // '' = flat in uploads
    // 'gambar_upload' = standard upload path
    // 'banners' = banner path
    const subfolders = ['', 'gambar_upload', 'banners'];

    let filePath = '';
    let found = false;

    // Search logic
    for (const root of roots) {
        for (const sub of subfolders) {
            const tryPath = path.join(root, sub, safeFile);
            if (fs.existsSync(tryPath)) {
                filePath = tryPath;
                found = true;
                break;
            }
        }
        if (found) break;
    }

    if (!found) {
        console.error(`[ImgProxy] File not found: ${safeFile}. Searched roots: ${roots.join(', ')}`);
        return new NextResponse('File not found', { status: 404 });
    }

    try {
        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(safeFile).toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.svg') contentType = 'image/svg+xml';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (e) {
        console.error("Proxy error:", e);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
