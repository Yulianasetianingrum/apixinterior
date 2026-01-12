import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const posts = await prisma.post.findMany({
            orderBy: { updatedAt: "desc" },
        });
        return NextResponse.json({ posts });
    } catch (error) {
        console.error("GET Posts Error:", error);
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, slug, excerpt, content, coverImage, isPublished, seoTitle, seoDescription, author } = body;

        // Validate Slug Uniqueness
        const existing = await prisma.post.findUnique({
            where: { slug },
        });

        if (existing) {
            return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
        }

        const newPost = await prisma.post.create({
            data: {
                title,
                slug,
                excerpt,
                content,
                coverImage,
                isPublished: isPublished ?? true,
                seoTitle,
                seoDescription,
                author,
            },
        });

        return NextResponse.json({ post: newPost }, { status: 201 });
    } catch (error: any) {
        console.error("CREATE Post Error:", error);
        console.error("CREATE Post Error Stack:", error?.stack);
        // Log keys to see if model exists
        console.error("Prisma Keys:", Object.keys(prisma));

        return NextResponse.json({ error: `Failed to create post: ${error?.message || "Unknown error"}` }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, title, slug, excerpt, content, coverImage, isPublished, seoTitle, seoDescription, author } = body;

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        // Validate Slug Uniqueness (excluding self)
        const existing = await prisma.post.findFirst({
            where: {
                slug,
                NOT: { id },
            },
        });

        if (existing) {
            return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
        }

        const updatedPost = await prisma.post.update({
            where: { id },
            data: {
                title,
                slug,
                excerpt,
                content,
                coverImage,
                isPublished,
                seoTitle,
                seoDescription,
                author,
            },
        });

        return NextResponse.json({ post: updatedPost });
    } catch (error) {
        console.error("UPDATE Post Error:", error);
        return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await prisma.post.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Post Error:", error);
        return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
    }
}
