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

        // 1. Visitor Stats
        const [todayCount, thisWeekCount, thisMonthCount, totalCount] = await Promise.all([
            prisma.pageView.count({ where: { createdAt: { gte: today } } }),
            prisma.pageView.count({ where: { createdAt: { gte: startOfWeek } } }),
            prisma.pageView.count({ where: { createdAt: { gte: startOfMonth } } }),
            prisma.pageView.count(),
        ]);

        // 2. Top Product (Detail Views)
        // Group by produkId manually or via rawQuery if needed.
        // Prisma `groupBy` is easiest:
        const topView = await prisma.productView.groupBy({
            by: ['produkId'],
            where: { viewType: 'detail_view' },
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 1
        });

        let topItemName = "-";
        let topItemCount = 0;

        if (topView.length > 0) {
            const topId = topView[0].produkId;
            const count = topView[0]._count.id;
            const product = await prisma.produk.findUnique({
                where: { id: topId },
                select: { nama: true }
            });
            if (product) {
                topItemName = product.nama;
                topItemCount = count;
            }
        }

        return NextResponse.json({
            today: todayCount,
            thisWeek: thisWeekCount,
            thisMonth: thisMonthCount,
            total: totalCount,
            topItem: {
                name: topItemName,
                views: topItemCount
            }
        });
    } catch (error) {
        console.error("Stats API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
