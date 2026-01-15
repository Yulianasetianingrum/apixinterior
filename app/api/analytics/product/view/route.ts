import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

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
        console.error("Track View Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
