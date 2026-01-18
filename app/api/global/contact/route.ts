
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // 1. Try finding Priority
        let waRow = await prisma.hubungi.findFirst({
            where: {
                prioritas: true,
                NOT: { nomor: { contains: "81234567890" } } // Blokir nomor hantu
            },
            select: { nomor: true },
        });

        // 2. Fallback to first valid number
        if (!waRow) {
            waRow = await prisma.hubungi.findFirst({
                where: {
                    NOT: { nomor: { contains: "81234567890" } }
                },
                orderBy: { id: "asc" },
                select: { nomor: true },
            });
        }

        const number = waRow?.nomor ?? "";
        return NextResponse.json({ number });
    } catch (error) {
        return NextResponse.json({ number: "" }, { status: 500 });
    }
}
