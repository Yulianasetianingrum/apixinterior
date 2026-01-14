import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const [todayCount, thisWeekCount, thisMonthCount, totalCount] = await Promise.all([
            prisma.pageView.count({ where: { createdAt: { gte: today } } }),
            prisma.pageView.count({ where: { createdAt: { gte: startOfWeek } } }),
            prisma.pageView.count({ where: { createdAt: { gte: startOfMonth } } }),
            prisma.pageView.count(),
        ]);

        return NextResponse.json({
            today: todayCount,
            thisWeek: thisWeekCount,
            thisMonth: thisMonthCount,
            total: totalCount,
        });
    } catch (error) {
        console.error("Stats API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
