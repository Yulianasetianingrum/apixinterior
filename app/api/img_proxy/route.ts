
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    if (!file) {
        return new NextResponse('Missing file param', { status: 400 });
    }

    // Security: Prevent directory traversal
    const safeFile = path.basename(file);
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'gambar_upload', safeFile);

    if (!fs.existsSync(filePath)) {
        return new NextResponse('File not found', { status: 404 });
    }

    try {
        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(safeFile).toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.webp') contentType = 'image/webp';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    } catch (e) {
        console.error("Proxy error:", e);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
