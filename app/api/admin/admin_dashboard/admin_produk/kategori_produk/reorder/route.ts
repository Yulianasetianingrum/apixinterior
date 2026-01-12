import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { categoryIds } = body;

        if (!Array.isArray(categoryIds)) {
            return NextResponse.json(
                { error: "Invalid data. 'categoryIds' must be an array." },
                { status: 400 }
            );
        }

        // Use transaction to ensure data integrity
        await prisma.$transaction(async (tx) => {
            for (let i = 0; i < categoryIds.length; i++) {
                const id = Number(categoryIds[i]);
                if (id && Number.isFinite(id)) {
                    await tx.kategoriProduk.update({
                        where: { id },
                        data: { urutan: i + 1 },
                    });
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Error reordering categories:", err);
        return NextResponse.json(
            { error: "Gagal menyimpan urutan kategori." },
            { status: 500 }
        );
    }
}
