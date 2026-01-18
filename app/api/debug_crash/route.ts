
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("DEBUG: Checking for corrupt sections...");

        // 1. Find them
        const sections = await prisma.homepageSectionDraft.findMany({
            where: { type: "TESTIMONIALS" }
        });

        // 2. Delete them
        let deletedCount = 0;
        if (sections.length > 0) {
            const res = await prisma.homepageSectionDraft.deleteMany({
                where: { type: "TESTIMONIALS" }
            });
            deletedCount = res.count;
        }

        return NextResponse.json({
            status: "success",
            message: "Check complete",
            found: sections.length,
            deleted: deletedCount,
            sections_removed: sections.map(s => s.id)
        });

    } catch (error: any) {
        console.error("DEBUG ERROR:", error);
        return NextResponse.json({
            status: "error",
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
