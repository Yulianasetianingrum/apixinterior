import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ slug: string }>;
};

// 1. Generate Metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    const page = await prisma.dynamicPage.findUnique({
        where: { slug },
    });

    if (!page || !page.isPublished) {
        return {
            title: "Halaman Tidak Ditemukan",
        };
    }

    return {
        title: page.seoTitle || page.title,
        description: page.seoDescription || `Halaman ${page.title}`,
    };
}

// 2. Main Page Component
export default async function DynamicPageComponent({ params }: Props) {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    const page = await prisma.dynamicPage.findUnique({
        where: { slug },
    });

    if (!page || !page.isPublished) {
        notFound();
    }

    return (
        <main style={{ minHeight: "60vh", padding: "40px 24px", background: "#fff" }}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>

                {/* HEADER */}
                <header style={{ marginBottom: 40, borderBottom: "1px solid #eee", paddingBottom: 24 }}>
                    <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: "#111827", marginBottom: 8 }}>
                        {page.title}
                    </h1>
                </header>

                {/* CONTENT */}
                <article
                    style={{ lineHeight: 1.8, fontSize: 16, color: "#374151" }}
                    dangerouslySetInnerHTML={{ __html: page.content }}
                />

            </div>
        </main>
    );
}
