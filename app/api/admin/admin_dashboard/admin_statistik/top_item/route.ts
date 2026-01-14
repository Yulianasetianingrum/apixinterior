import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter') || 'all'; // today, week, month, all

        // 1. Determine Date Filter
        let dateFilterClause = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filter === 'today') {
            dateFilterClause = { gte: today };
        } else if (filter === 'week') {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            dateFilterClause = { gte: startOfWeek };
        } else if (filter === 'month') {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            dateFilterClause = { gte: startOfMonth };
        }

        const dateWhere = Object.keys(dateFilterClause).length > 0 ? { createdAt: dateFilterClause } : {};

        // 2. Aggregate Data
        // Ideally we do this with raw query for performance, but Prisma groupBy is cleaner for now.

        // A. Card Views (Impressions)
        const cardViews = await prisma.productView.groupBy({
            by: ['produkId'],
            where: { viewType: 'card_view', ...dateWhere },
            _count: { id: true },
        });

        // B. Detail Views (Clicked to see detail) -> Let's count this as "Card Clicks" effectively
        // Note: The schema has ProductCardClick too. Let's use that if available, or Detail Views.
        // User schema has ProductCardClick model.
        const cardClicks = await prisma.productCardClick.groupBy({
            by: ['produkId'],
            where: dateWhere,
            _count: { id: true },
        });

        // C. Contact Clicks (Hubungi Sekarang)
        const contactClicks = await prisma.productContactClick.groupBy({
            by: ['produkId'],
            where: dateWhere,
            _count: { id: true },
            _max: { createdAt: true } // For "Last Clicked"
        });

        // 3. Fetch all products to map names
        const products = await prisma.produk.findMany({
            select: { id: true, nama: true, kategori: true }
        });

        // 4. Merge Data
        const statsMap = new Map();

        // Initialize with products
        products.forEach(p => {
            statsMap.set(p.id, {
                id: p.id,
                nama: p.nama,
                kategori: p.kategori,
                cardViews: 0,
                cardClicks: 0, // This is basically detail views or clicks
                contactClicks: 0,
                lastClicked: "-",
                trend: "stable",
                conversionRate: 0
            });
        });

        // Fill Stats
        cardViews.forEach(item => {
            if (statsMap.has(item.produkId)) {
                statsMap.get(item.produkId).cardViews = item._count.id;
            }
        });

        cardClicks.forEach(item => {
            if (statsMap.has(item.produkId)) {
                statsMap.get(item.produkId).cardClicks = item._count.id;
            }
        });

        contactClicks.forEach(item => {
            if (statsMap.has(item.produkId)) {
                const s = statsMap.get(item.produkId);
                s.contactClicks = item._count.id;
                if (item._max.createdAt) {
                    s.lastClicked = new Date(item._max.createdAt).toLocaleDateString("id-ID", {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    });
                }
            }
        });

        // 5. Calculate Rates & Sort
        const finalResults = Array.from(statsMap.values()).map((item: any) => {
            // Conversion: Contact Clicks / Card Clicks (or Views)
            // Let's do Contact / Card Clicks as "Interest Conversion"
            const base = item.cardClicks > 0 ? item.cardClicks : (item.cardViews > 0 ? item.cardViews : 1);
            const rate = (item.contactClicks / base) * 100;
            item.conversionRate = parseFloat(rate.toFixed(1));

            // Simple trend mock (since we don't have historical diff yet easil)
            if (item.contactClicks > 5) item.trend = "up";

            return item;
        });

        // Sort by Views (default) or Contact Clicks
        finalResults.sort((a, b) => b.cardViews - a.cardViews);

        return NextResponse.json(finalResults);

    } catch (error) {
        console.error("TopItem API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
