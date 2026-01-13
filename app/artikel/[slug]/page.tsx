
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Navbar from "@/app/navbar/Navbar";

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
    const mainWrapperStyle = {
        minHeight: "100vh",
        backgroundColor: "#f8fafc", // Subtle gray background
        paddingBottom: "80px",
    };

    const containerStyle = {
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 16px",
        fontFamily: "'Outfit', 'Inter', sans-serif",
    };

    const articleCardStyle = {
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        padding: "clamp(24px, 5vw, 60px)",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    };

    const headerStyle = {
        textAlign: "center" as const,
        marginBottom: "40px",
    };

    const badgeStyle = {
        marginBottom: "16px",
        display: "inline-block",
        padding: "6px 16px",
        borderRadius: "99px",
        background: "linear-gradient(135deg, #fef3c7 0%, #ffedd5 100%)",
        color: "#d97706",
        fontSize: "13px",
        fontWeight: "700",
        textTransform: "uppercase" as const,
        letterSpacing: "0.5px",
    };

    const titleStyle = {
        fontSize: "clamp(28px, 6vw, 44px)",
        fontWeight: "800",
        color: "#0f172a",
        lineHeight: "1.2",
        marginBottom: "20px",
        letterSpacing: "-0.02em",
    };

    const metaStyle = {
        fontSize: "15px",
        color: "#64748b",
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap" as const,
        gap: "12px",
        alignItems: "center",
        marginBottom: "40px",
    };

    const imageWrapperStyle = {
        width: "100%",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        marginBottom: "50px",
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
        textAlign: "left" as const,
    };

    const footerStyle = {
        marginTop: "60px",
        paddingTop: "40px",
        borderTop: "2px solid #f1f5f9",
        textAlign: "center" as const,
    };

    // Helper to format date
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    return (
        <main style={mainWrapperStyle}>
            <Navbar />

            <div style={containerStyle}>
                <article style={articleCardStyle}>

                    {/* Header Section */}
                    <header style={headerStyle}>
                        <div style={badgeStyle}>
                            Artikel & Blog
                        </div>
                        <h1 style={titleStyle}>{post.title}</h1>
                        <div style={metaStyle}>
                            <span>Ditulis oleh <strong style={{ color: "#0f172a" }}>{post.author || "Admin"}</strong></span>
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

                    {/* Share Section */}
                    <div style={footerStyle}>
                        <p style={{ fontSize: "15px", fontWeight: "600", color: "#64748b", marginBottom: "20px" }}>
                            Bagikan artikel ini kepada teman Anda:
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <a
                                href={`https://wa.me/?text=Baca artikel menarik ini: ${post.title} - ${typeof window !== 'undefined' ? window.location.href : ""}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    padding: "12px 24px",
                                    borderRadius: "12px",
                                    background: "#25D366",
                                    color: "white",
                                    textDecoration: "none",
                                    fontWeight: "700",
                                    fontSize: "14px",
                                    transition: "transform 0.2s ease"
                                }}
                            >
                                Share di WhatsApp
                            </a>
                        </div>
                    </div>

                </article>
            </div>

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
