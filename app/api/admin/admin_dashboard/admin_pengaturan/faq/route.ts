
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: List all dynamic pages
export async function GET() {
    try {
        const pages = await prisma.dynamicPage.findMany({
            orderBy: { updatedAt: "desc" },
        });
        return NextResponse.json({ pages });
    } catch (error) {
        console.error("Error fetching dynamic pages:", error);
        return NextResponse.json(
            { message: "Gagal memuat halaman dinamis" },
            { status: 500 }
        );
    }
}

// POST: Create a new page
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, slug, content, isPublished, seoTitle, seoDescription } = body;

        console.log("DEBUG: Prisma Keys available:", Object.keys(prisma));
        console.log("DEBUG: DynamicPage model:", prisma.dynamicPage);

        if (!title || !slug) {
            return NextResponse.json(
                { message: "Judul dan Slug wajib diisi" },
                { status: 400 }
            );
        }

        // Check duplicate slug
        const existing = await prisma.dynamicPage.findUnique({
            where: { slug },
        });
        if (existing) {
            return NextResponse.json(
                { message: "Slug sudah digunakan, harap ganti yang lain." },
                { status: 400 }
            );
        }

        const newPage = await prisma.dynamicPage.create({
            data: {
                title,
                slug,
                content: content || "",
                isPublished: isPublished ?? true,
                seoTitle,
                seoDescription,
            },
        });

        return NextResponse.json({ page: newPage });
    } catch (error) {
        console.error("Error creating dynamic page:", error);
        return NextResponse.json(
            { message: "Gagal membuat halaman" },
            { status: 500 }
        );
    }
}

// PUT: Update exisitng page
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, title, slug, content, isPublished, seoTitle, seoDescription } = body;

        if (!id) {
            return NextResponse.json({ message: "ID wajib diisi" }, { status: 400 });
        }

        // Check duplicate slug (excluding self)
        const existing = await prisma.dynamicPage.findFirst({
            where: {
                slug,
                id: { not: id },
            },
        });
        if (existing) {
            return NextResponse.json(
                { message: "Slug sudah digunakan halaman lain." },
                { status: 400 }
            );
        }

        const updated = await prisma.dynamicPage.update({
            where: { id },
            data: {
                title,
                slug,
                content,
                isPublished,
                seoTitle,
                seoDescription,
            },
        });

        return NextResponse.json({ page: updated });
    } catch (error) {
        console.error("Error updating dynamic page:", error);
        return NextResponse.json(
            { message: "Gagal update halaman" },
            { status: 500 }
        );
    }
}

// DELETE: Remove page
export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { id } = body;
        if (!id) {
            return NextResponse.json({ message: "ID wajib diisi" }, { status: 400 });
        }

        await prisma.dynamicPage.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Halaman dihapus" });
    } catch (error) {
        console.error("Error deleting dynamic page:", error);
        return NextResponse.json(
            { message: "Gagal menghapus halaman" },
            { status: 500 }
        );
    }
}
