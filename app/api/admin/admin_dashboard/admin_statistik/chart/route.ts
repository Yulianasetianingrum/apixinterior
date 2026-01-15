import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "today"; // today, week, month, year
        const yearParam = searchParams.get("year");

        const now = new Date();
        const currentYear = yearParam ? parseInt(yearParam) : now.getFullYear();

        let data: any[] = [];
        const excludeConditions = {
            NOT: [
                { path: { startsWith: "/admin" } },
                { path: { startsWith: "/api" } },
            ]
        };

        if (period === "today") {
            // Logic: Hourly breakdown (0-23)
            // Comparison: Yesterday
            const startToday = new Date(now);
            startToday.setHours(0, 0, 0, 0);

            const startYesterday = new Date(startToday);
            startYesterday.setDate(startYesterday.getDate() - 1);

            // Fetch Data
            const todayViews = await prisma.pageView.findMany({
                where: {
                    createdAt: { gte: startToday },
                    ...excludeConditions
                },
                select: { createdAt: true }
            });

            const yesterdayViews = await prisma.pageView.findMany({
                where: {
                    createdAt: { gte: startYesterday, lt: startToday },
                    ...excludeConditions
                },
                select: { createdAt: true }
            });

            // Aggregate
            const hours = Array.from({ length: 24 }, (_, i) => i);
            data = hours.map(h => {
                const label = `${h.toString().padStart(2, '0')}:00`;
                const curr = todayViews.filter(v => new Date(v.createdAt).getHours() === h).length;
                const prev = yesterdayViews.filter(v => new Date(v.createdAt).getHours() === h).length;
                return { label, current: curr, previous: prev, periodLabel: "Jam" };
            });

        } else if (period === "week") {
            // Logic: Daily breakdown (Mon-Sun) of current week
            // Comparison: Last week
            const getStartOfWeek = (d: Date) => {
                const date = new Date(d);
                const day = date.getDay(); // 0 (Sun) - 6 (Sat)
                const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
                date.setHours(0, 0, 0, 0);
                date.setDate(diff);
                return date;
            };

            const startThisWeek = getStartOfWeek(now);
            const endThisWeek = new Date(startThisWeek);
            endThisWeek.setDate(endThisWeek.getDate() + 7);

            const startLastWeek = new Date(startThisWeek);
            startLastWeek.setDate(startLastWeek.getDate() - 7);

            const thisWeekViews = await prisma.pageView.findMany({
                where: { createdAt: { gte: startThisWeek, lt: endThisWeek }, ...excludeConditions },
                select: { createdAt: true }
            });

            const lastWeekViews = await prisma.pageView.findMany({
                where: { createdAt: { gte: startLastWeek, lt: startThisWeek }, ...excludeConditions },
                select: { createdAt: true }
            });

            const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
            data = days.map((dayName, idx) => {
                // Determine actual date for "current"
                const targetDate = new Date(startThisWeek);
                targetDate.setDate(targetDate.getDate() + idx);
                const targetDay = targetDate.getDay(); // Mon=1 ... Sun=0

                // Determine previous date
                const prevDate = new Date(startLastWeek);
                prevDate.setDate(prevDate.getDate() + idx);

                const curr = thisWeekViews.filter(v => {
                    const d = new Date(v.createdAt);
                    // Match day of week (1-6, 0) logic is tricky if timezone issue
                    // Simplest: match "YYYY-MM-DD" string
                    return d.getDate() === targetDate.getDate() && d.getMonth() === targetDate.getMonth();
                }).length;

                const prev = lastWeekViews.filter(v => {
                    const d = new Date(v.createdAt);
                    return d.getDate() === prevDate.getDate() && d.getMonth() === prevDate.getMonth();
                }).length;

                return { label: dayName, current: curr, previous: prev, periodLabel: "Hari" };
            });

        } else if (period === "month") {
            // Logic: Daily breakdown (1-31)
            // Comparison: Last month
            const startThisMonth = new Date(currentYear, now.getMonth(), 1);
            const endThisMonth = new Date(currentYear, now.getMonth() + 1, 1);

            const startLastMonth = new Date(currentYear, now.getMonth() - 1, 1);
            const endLastMonth = new Date(currentYear, now.getMonth(), 1);

            const thisMonthViews = await prisma.pageView.findMany({
                where: { createdAt: { gte: startThisMonth, lt: endThisMonth }, ...excludeConditions },
                select: { createdAt: true }
            });

            const lastMonthViews = await prisma.pageView.findMany({
                where: { createdAt: { gte: startLastMonth, lt: endLastMonth }, ...excludeConditions },
                select: { createdAt: true }
            });

            // Days in month
            const daysInMonth = new Date(currentYear, now.getMonth() + 1, 0).getDate();
            const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

            data = days.map(d => {
                const curr = thisMonthViews.filter(v => new Date(v.createdAt).getDate() === d).length;
                const prev = lastMonthViews.filter(v => new Date(v.createdAt).getDate() === d).length;
                return { label: `${d}`, current: curr, previous: prev, periodLabel: "Tanggal" };
            });

        } else if (period === "year") {
            // Logic: Monthly breakdown (Jan-Dec) for specific Year
            // Comparison: Previous Year (currentYear - 1)

            const startYear = new Date(currentYear, 0, 1);
            const endYear = new Date(currentYear + 1, 0, 1);

            const startPrevYear = new Date(currentYear - 1, 0, 1);
            const endPrevYear = new Date(currentYear, 0, 1);

            const thisYearViews = await prisma.pageView.findMany({
                where: { createdAt: { gte: startYear, lt: endYear }, ...excludeConditions },
                select: { createdAt: true }
            });

            const prevYearViews = await prisma.pageView.findMany({
                where: { createdAt: { gte: startPrevYear, lt: endPrevYear }, ...excludeConditions },
                select: { createdAt: true }
            });

            const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
            data = months.map((m, idx) => {
                const curr = thisYearViews.filter(v => new Date(v.createdAt).getMonth() === idx).length;
                const prev = prevYearViews.filter(v => new Date(v.createdAt).getMonth() === idx).length;
                return { label: m, current: curr, previous: prev, periodLabel: "Bulan" };
            });
        }

        return NextResponse.json({ success: true, data, period, year: currentYear });

    } catch (error) {
        console.error("Chart API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
