import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    const report: any = {
        timestamp: new Date().toISOString(),
        cwd: process.cwd(),
        sharp: { status: 'unknown', message: '' },
        filesystem: { status: 'unknown', message: '', path: '', files: [] },
    };

    // 1. CHECK SHARP
    try {
        const sharp = require('sharp');
        report.sharp.status = 'ok';
        report.sharp.message = 'Sharp is installed and loaded successfully.';
        report.sharp.version = require('sharp/package.json').version;
    } catch (e: any) {
        report.sharp.status = 'error';
        report.sharp.message = `Sharp failed to load. Fallback active. Error: ${e.message}`;
    }

    // 2. CHECK FILESYSTEM
    try {
        // Try to identify the public folder relative to CWD
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        report.filesystem.path = uploadsDir;

        // Check exists
        if (fs.existsSync(uploadsDir)) {
            // Test Write
            const testFile = path.join(uploadsDir, 'test_perm.txt');
            fs.writeFileSync(testFile, 'OK');
            fs.unlinkSync(testFile);
            report.filesystem.status = 'ok';
            report.filesystem.message = 'Writable.';

            // LIST FILES (Last 10)
            const files = fs.readdirSync(uploadsDir)
                .map(f => ({ name: f, time: fs.statSync(path.join(uploadsDir, f)).mtime }))
                .sort((a, b) => b.time.getTime() - a.time.getTime())
                .slice(0, 10);

            report.filesystem.files = files;
        } else {
            report.filesystem.status = 'error';
            report.filesystem.message = 'Directory public/uploads NOT FOUND.';
        }

    } catch (e: any) {
        report.filesystem.status = 'error';
        report.filesystem.message = `Filesystem Error: ${e.message}`;
    }

    return NextResponse.json(report);
}
