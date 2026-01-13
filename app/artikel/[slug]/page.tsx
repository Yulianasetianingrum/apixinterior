
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ slug: string }>;
};

// 1. SEO Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    const post = await prisma.post.findUnique({
        where: { slug: slug },
    });

    if (!post || !post.isPublished) {
        return {
            title: "Artikel Tidak Ditemukan",
        };
    }

    return {
        title: post.seoTitle || post.title,
        description: post.seoDescription || post.excerpt || `Baca artikel "${post.title}" di APIX Interior.`,
        openGraph: {
            title: post.seoTitle || post.title,
            description: post.seoDescription || post.excerpt || "",
            images: post.coverImage ? [post.coverImage] : [],
            type: "article",
            publishedTime: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
            authors: post.author ? [post.author] : undefined,
        },
    };
}

// 2. Main Page Component
export default async function ArticlePage({ params }: Props) {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    // Fetch Post
    const post = await prisma.post.findUnique({
        where: { slug: slug },
    });

    if (!post || !post.isPublished) {
        notFound();
    }

    // Styles
    const containerStyle = {
        maxWidth: "800px",
        margin: "0 auto",
        padding: "40px 24px",
        fontFamily: "'Inter', sans-serif",
    };

    const headerStyle = {
        textAlign: "center" as const,
        marginBottom: "40px",
    };

    const titleStyle = {
        fontSize: "clamp(32px, 5vw, 48px)",
        fontWeight: "800",
        color: "#0f172a",
        lineHeight: "1.2",
        marginBottom: "16px",
    };

    const metaStyle = {
        fontSize: "14px",
        color: "#64748b",
        display: "flex",
        justifyContent: "center",
        gap: "16px",
        alignItems: "center",
        marginBottom: "32px",
    };

    const imageWrapperStyle = {
        width: "100%",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)",
        marginBottom: "40px",
        aspectRatio: "16/9",
        backgroundColor: "#f1f5f9",
    };

    const imageStyle = {
        width: "100%",
        height: "100%",
        objectFit: "cover" as const,
    };

    const contentStyle = {
        fontSize: "18px",
        lineHeight: "1.8",
        color: "#334155",
    };

    // Helper to format date
    const formatDate = (dateString: Date) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    return (
        <main style={{ minHeight: "100vh", background: "#ffffff" }}>
            <article style={containerStyle}>

                {/* Header Section */}
                <header style={headerStyle}>
                    <div style={{ marginBottom: 12, display: "inline-block", padding: "4px 12px", borderRadius: 99, background: "#fef3c7", color: "#d97706", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
                        Artikel & Blog
                    </div>
                    <h1 style={titleStyle}>{post.title}</h1>
                    <div style={metaStyle}>
                        <span>Ditulis oleh <strong>{post.author || "Admin"}</strong></span>
                        <span style={{ width: 4, height: 4, background: "#cbd5e1", borderRadius: "50%" }} />
                        <span>{formatDate(post.updatedAt)}</span>
                    </div>
                </header>

                {/* Hero Image */}
                {post.coverImage && (
                    <figure style={imageWrapperStyle}>
                        <img
                            src={post.coverImage}
                            alt={post.title}
                            style={imageStyle}
                        />
                    </figure>
                )}

                {/* Article Content */}
                <div
                    className="prose prose-lg prose-slate"
                    style={contentStyle}
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Footer / Share (Simple) */}
                <div style={{ marginTop: 60, paddingTop: 30, borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
                    <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>Bagikan artikel ini:</p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                        <a
                            href={`https://wa.me/?text=Baca artikel menarik ini: ${post.title}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ padding: "10px 20px", borderRadius: 8, background: "#25D366", color: "white", textDecoration: "none", fontWeight: 600, fontSize: 14 }}
                        >
                            WhatsApp
                        </a>
                        <button
                            // onClick={() => navigator.clipboard.writeText(window.location.href)} // Requires 'use client' or hydration friendly way
                            style={{ padding: "10px 20px", borderRadius: 8, background: "#f1f5f9", color: "#334155", border: "none", fontWeight: 600, fontSize: 14, cursor: "not-allowed" }}
                            title="Copy Link (Coming Soon)"
                        >
                            Copy Link
                        </button>
                    </div>
                </div>

            </article>

            {/* RECOMMENDATION SECTION */}
            <RecommendedPosts currentSlug={slug} />
        </main>
    );
}

async function RecommendedPosts({ currentSlug }: { currentSlug: string }) {
    const others = await prisma.post.findMany({
        where: {
            slug: { not: currentSlug },
            isPublished: true
        },
        take: 3,
        orderBy: { createdAt: "desc" }
    });

    if (others.length === 0) return null;

    return (
        <section style={{ background: "#f8fafc", padding: "60px 24px", marginTop: 0 }}>
            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", marginBottom: "32px", textAlign: "center" }}>
                    Artikel Lainnya
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "30px" }}>
                    {others.map((p: any) => (
                        <a key={p.id} href={`/artikel/${p.slug}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: "16px", background: "#fff", borderRadius: "12px", padding: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                            <div style={{ aspectRatio: "16/9", background: "#e2e8f0", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
                                {p.coverImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={p.coverImage} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: "14px" }}>
                                        No Image
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px", lineHeight: "1.4" }}>{p.title}</h4>
                                <div style={{ fontSize: "14px", color: "#64748b" }}>
                                    {new Date(p.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
