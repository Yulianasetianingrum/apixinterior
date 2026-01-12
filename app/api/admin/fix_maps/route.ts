
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
    const targetId = 7;
    // The full URL that was truncated
    const fullUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.7707336605604!2d106.96402257499095!3d-6.293832693695207!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e698d049216585b%3A0x69c6e1c0ddbb1f1b!2sAPIX%20INTERIOR!5e0!3m2!1sid!2sid!4v1767962639406!5m2!1sid!2sid";

    try {
        let alterResult = "Skipped";
        // 1. Try to force ALTER the column to TEXT
        try {
            await prisma.$executeRawUnsafe("ALTER TABLE cabang_toko MODIFY mapsUrl TEXT");
            alterResult = "Success";
        } catch (e: any) {
            alterResult = "Failed: " + e.message;
        }

        // 2. Read the current value before update
        const before = await prisma.cabangToko.findUnique({ where: { id: targetId } });

        // 3. Update the data
        const updated = await prisma.cabangToko.update({
            where: { id: targetId },
            data: { mapsUrl: fullUrl }
        });

        return NextResponse.json({
            status: "OK",
            alterResult,
            before: {
                length: before?.mapsUrl.length,
                value: before?.mapsUrl,
            },
            after: {
                length: updated.mapsUrl.length,
                value: updated.mapsUrl,
                match: updated.mapsUrl === fullUrl
            }
        });

    } catch (error: any) {
        return NextResponse.json({ status: "ERROR", message: error.message }, { status: 500 });
    }
}
