import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    const report: any = {
        timestamp: new Date().toISOString(),
        sharp: { status: 'unknown', message: '' },
        filesystem: { status: 'unknown', message: '', path: '' },
    };

    // 1. CHECK SHARP
    try {
        const sharp = require('sharp');
        report.sharp.status = 'ok';
        report.sharp.message = 'Sharp is installed and loaded successfully.';
        report.sharp.version = require('sharp/package.json').version;
    } catch (e: any) {
        report.sharp.status = 'error';
        report.sharp.message = `Sharp failed to load. uploads will fallback to uncompressed. Error: ${e.message}`;
    }

    // 2. CHECK FILESYSTEM (Write Permission)
    try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        report.filesystem.path = uploadsDir;

        // Check exists
        if (!fs.existsSync(uploadsDir)) {
            report.filesystem.message = 'Directory does not exist. Attempting creation...';
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Try Write
        const testFile = path.join(uploadsDir, 'test_write_perm.txt');
        fs.writeFileSync(testFile, `Write Test ${new Date().toISOString()}`);

        // Try Read
        const content = fs.readFileSync(testFile, 'utf-8');

        // Try Delete
        fs.unlinkSync(testFile);

        report.filesystem.status = 'ok';
        report.filesystem.message = 'Read/Write to public/uploads successful.';

    } catch (e: any) {
        report.filesystem.status = 'error';
        report.filesystem.message = `Filesystem check failed. Error: ${e.message}`;
    }

    return NextResponse.json(report);
}
