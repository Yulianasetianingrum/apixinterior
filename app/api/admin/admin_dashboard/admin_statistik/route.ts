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

        const excludeConditions = {
            NOT: [
                { path: { startsWith: "/admin" } },
                { path: { startsWith: "/api" } },
            ]
        };

        const [todayViews, weekViews, monthViews, totalViews] = await Promise.all([
            prisma.pageView.count({
                where: { createdAt: { gte: today }, ...excludeConditions }
            }),
            prisma.pageView.count({
                where: { createdAt: { gte: startOfWeek }, ...excludeConditions }
            }),
            prisma.pageView.count({
                where: { createdAt: { gte: startOfMonth }, ...excludeConditions }
            }),
            prisma.pageView.count({
                where: { ...excludeConditions }
            })
        ]);

        // Fetch Top Item (Most Contact Clicks)
        // Group by produkId, count, order by count desc, take 1
        const topContact = await prisma.productContactClick.groupBy({
            by: ['produkId'],
            _count: { id: true },
            orderBy: {
                _count: { id: 'desc' }
            },
            take: 1
        });

        let topItemData = { name: "-", views: 0, clickLabel: "diklik 0 kali" };

        if (topContact.length > 0) {
            const product = await prisma.produk.findUnique({
                where: { id: topContact[0].produkId },
                select: { nama: true }
            });
            if (product) {
                topItemData = {
                    name: product.nama,
                    views: topContact[0]._count.id,
                    clickLabel: `diklik ${topContact[0]._count.id} kali`
                };
            }
        }

        return NextResponse.json({
            today: todayViews,
            thisWeek: weekViews,
            thisMonth: monthViews,
            total: totalViews,
            topItem: topItemData
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
