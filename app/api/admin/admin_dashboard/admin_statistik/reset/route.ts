import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
    try {
        await prisma.pageView.deleteMany({});
        await prisma.productView.deleteMany({});
        await prisma.productCardClick.deleteMany({});
        await prisma.productContactClick.deleteMany({});

        return NextResponse.json({ success: true, message: "All analytics data reset." });
    } catch (error) {
        console.error("Reset Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
