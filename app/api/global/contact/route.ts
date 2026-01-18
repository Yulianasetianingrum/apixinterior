
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Fetch ALL candidate numbers
        const allItems = await prisma.hubungi.findMany({
            orderBy: [{ prioritas: "desc" }, { id: "asc" }]
        });

        // Helper: Strip non-digits
        const clean = (s: string) => s.replace(/[^\d]/g, "");

        // Filter out ghost number "081234567890" or "6281234567890" regardless of formatting
        const validItems = allItems.filter(item => {
            const c = clean(item.nomor);
            return !c.includes("81234567890");
        });

        if (validItems.length === 0) {
            return NextResponse.json({ number: "" });
        }

        // Pick priority if exists. First element is best candidate.
        const best = validItems[0];

        return NextResponse.json({ number: best.nomor });
    } catch (error) {
        console.error("Error fetching global contact:", error);
        return NextResponse.json({ number: "" }, { status: 500 });
    }
}
