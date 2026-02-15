import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

let canWritePageViewCache: boolean | null = null;

async function canWritePageViewsTable(): Promise<boolean> {
    if (canWritePageViewCache !== null) return canWritePageViewCache;

    try {
        const rows = await prisma.$queryRawUnsafe<Array<{ t: string }>>(
            "SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'page_views' LIMIT 1"
        );
        canWritePageViewCache = Array.isArray(rows) && rows.length > 0;
        return canWritePageViewCache;
    } catch {
        canWritePageViewCache = false;
        return false;
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { path } = body;
        const ip = req.headers.get("x-forwarded-for") || (req as any).ip || "unknown";
        const userAgent = req.headers.get("user-agent") || "unknown";

        if (!path) {
            return NextResponse.json({ error: "Path required" }, { status: 400 });
        }

        if (path.startsWith("/admin") || path.startsWith("/api")) {
            return NextResponse.json({ success: true, ignored: true });
        }

        if (!(await canWritePageViewsTable())) {
            return NextResponse.json({ success: true, skipped: "page_views_missing" });
        }

        await prisma.pageView.create({
            data: {
                path,
                ipAddress: ip,
                userAgent,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
            // Analytics table is optional in some environments; skip hard failure.
            canWritePageViewCache = false;
            return NextResponse.json({ success: true, skipped: "page_views_missing" });
        }
        console.error("Tracking Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
