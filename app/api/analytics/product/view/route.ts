import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

let canWriteProductViewsCache: boolean | null = null;

async function canWriteProductViewsTable(): Promise<boolean> {
    if (canWriteProductViewsCache !== null) return canWriteProductViewsCache;
    try {
        const rows = await prisma.$queryRawUnsafe<Array<{ t: string }>>(
            "SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'product_views' LIMIT 1"
        );
        canWriteProductViewsCache = Array.isArray(rows) && rows.length > 0;
        return canWriteProductViewsCache;
    } catch {
        canWriteProductViewsCache = false;
        return false;
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { produkId } = body;

        // 1. Validation
        if (!produkId || isNaN(Number(produkId))) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        // 2. Admin Check (Don't count admin views)
        const cookieStore = await cookies();
        const isAdmin = cookieStore.get("admin_logged_in")?.value === "true";
        if (isAdmin) {
            return NextResponse.json({ success: true, ignored: true });
        }

        // 3. Track View
        const ip = req.headers.get("x-forwarded-for") || (req as any).ip || "unknown";
        const userAgent = req.headers.get("user-agent") || "unknown";

        if (!(await canWriteProductViewsTable())) {
            return NextResponse.json({ success: true, skipped: "product_views_missing" });
        }

        await prisma.productView.create({
            data: {
                produkId: Number(produkId),
                viewType: "detail_view",
                ipAddress: ip,
                userAgent
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
            canWriteProductViewsCache = false;
            return NextResponse.json({ success: true, skipped: "product_views_missing" });
        }
        console.error("Track View Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
