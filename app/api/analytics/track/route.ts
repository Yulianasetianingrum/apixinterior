import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { path } = body;
        const ip = req.headers.get("x-forwarded-for") || req.ip || "unknown";
        const userAgent = req.headers.get("user-agent") || "unknown";

        if (!path) {
            return NextResponse.json({ error: "Path required" }, { status: 400 });
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
        console.error("Tracking Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
