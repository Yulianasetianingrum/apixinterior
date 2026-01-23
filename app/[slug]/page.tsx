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

import Navbar from "@/app/navbar/Navbar";

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

    // Fetch Contacts (Priority number)
    const allContacts = await prisma.hubungi.findMany({
        orderBy: [{ prioritas: 'desc' }, { id: 'desc' }]
    });

    const priorityContact = allContacts[0];
    const waNumber = priorityContact?.nomor || "6282112345678";
    const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo Apix Interior, saya sedang membuka halaman "${page.title}" dan ingin bertanya lebih lanjut.`)}`;

    // --- INLINE STYLES FOR PREMIUM LOOK ---
    const mainWrapperStyle = {
        minHeight: "100vh",
        backgroundColor: "#f9fafb", // Subtle background
        paddingTop: "120px",
        paddingBottom: "80px",
    };

    const containerStyle = {
        maxWidth: "840px",
        margin: "0 auto",
        padding: "0 16px",
        fontFamily: "'Outfit', 'Inter', sans-serif",
    };

    const cardStyle = {
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        padding: "clamp(24px, 6vw, 64px) clamp(16px, 5vw, 56px)",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
        border: "1px solid #f1f5f9",
    };

    const badgeStyle = {
        display: "inline-block",
        backgroundColor: "#e0f2fe", // Soft Azure
        color: "#0369a1", // Sky Blue
        padding: "6px 16px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "700",
        letterSpacing: "0.05em",
        marginBottom: "24px",
        textTransform: "uppercase" as const,
    };

    const titleStyle = {
        fontSize: "clamp(24px, 5vw, 40px)",
        fontWeight: "900",
        color: "#0f172a",
        lineHeight: "1.2",
        marginBottom: "32px",
        letterSpacing: "-0.02em",
    };

    const contentStyle = {
        fontSize: "17px",
        lineHeight: "1.8",
        color: "#334155",
    };

    const ctaStyle = {
        marginTop: "64px",
        paddingTop: "40px",
        borderTop: "1px solid #f1f5f9",
        textAlign: "center" as const,
    };

    return (
        <div style={mainWrapperStyle}>
            <Navbar />
            <main style={containerStyle}>
                <article style={cardStyle}>
                    <div style={badgeStyle}>Bantuan & Informasi</div>
                    <h1 style={titleStyle}>{page.title}</h1>

                    <div
                        className="prose prose-slate max-w-none"
                        style={contentStyle}
                        dangerouslySetInnerHTML={{ __html: page.content }}
                    />

                    {/* CONTACT CTA */}
                    <div style={ctaStyle}>
                        <p style={{ fontSize: "15px", color: "#64748b", fontWeight: "600", marginBottom: "20px" }}>
                            Masih ada pertanyaan lain? Hubungi kami langsung:
                        </p>
                        <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                backgroundColor: "#c5a02e", // Golden
                                color: "#001f3f", // Navy
                                padding: "14px 48px",
                                borderRadius: "123px",
                                textDecoration: "none",
                                fontSize: "16px",
                                fontWeight: "800",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "10px",
                                boxShadow: "0 10px 15px -3px rgba(197, 160, 46, 0.3)",
                                transition: "all 0.3s ease",
                                cursor: "pointer"
                            }}
                        >
                            <span>HUBUNGI KAMI</span>
                        </a>
                    </div>
                </article>
            </main>
        </div>
    );
}
