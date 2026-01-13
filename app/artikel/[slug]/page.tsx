
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Navbar from "@/app/navbar/Navbar";
import Image from "next/image";
import Link from "next/link";
import styles from "./article.module.css";

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

    // --- INLINE STYLES FOR SERVER COMPONENT ---
    const mainWrapperStyle = {
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        paddingTop: "110px",
        paddingBottom: "80px",
    };

    const containerStyle = {
        maxWidth: "840px",
        margin: "0 auto",
        padding: "0 12px",
        fontFamily: "'Outfit', 'Inter', sans-serif",
    };

    const articleCardStyle = {
        backgroundColor: "#ffffff",
        borderRadius: "20px",
        padding: "clamp(24px, 6vw, 56px) clamp(16px, 5vw, 48px)",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        overflow: "hidden",
    };

    const badgeStyle = {
        display: "inline-block",
        backgroundColor: "#fef3c7",
        color: "#d4a017",
        padding: "6px 16px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "700",
        letterSpacing: "0.05em",
        marginBottom: "20px",
        textTransform: "uppercase" as const,
    };

    const titleStyle = {
        fontSize: "clamp(22px, 5vw, 32px)",
        fontWeight: "800",
        color: "#0f172a",
        lineHeight: "1.25",
        marginBottom: "20px",
        letterSpacing: "-0.02em",
    };

    const metaStyle = {
        fontSize: "14px",
        color: "#64748b",
        marginBottom: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        flexWrap: "wrap" as const,
    };

    const headerStyle = {
        textAlign: "center" as const,
        marginBottom: "40px",
    };

    const imageWrapperStyle = {
        position: "relative" as const,
        width: "100%",
        aspectRatio: "16/9",
        borderRadius: "16px",
        overflow: "hidden",
        marginBottom: "40px",
        backgroundColor: "#f1f5f9",
    };

    const contentStyle = {
        fontSize: "17px",
        lineHeight: "1.8",
        color: "#334155",
        textAlign: "left" as const,
    };

    return (
        <div style={mainWrapperStyle}>
            <Navbar />

            <main style={containerStyle}>
                <article style={articleCardStyle}>
                    <header style={headerStyle}>
                        <div style={badgeStyle}>ARTIKEL & BLOG</div>
                        <h1 style={titleStyle}>{post.title}</h1>
                        <div style={metaStyle}>
                            <span>Ditulis oleh <strong>{post.author || "Admin"}</strong></span>
                            <span style={{ opacity: 0.3 }}>•</span>
                            <span>{new Date(post.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                        </div>
                    </header>

                    {post.coverImage && (
                        <div style={imageWrapperStyle}>
                            <Image
                                src={post.coverImage}
                                alt={post.title}
                                fill
                                style={{ objectFit: "cover" }}
                                sizes="(max-width: 840px) 100vw, 840px"
                                priority
                            />
                        </div>
                    )}

                    <div className="prose prose-slate max-w-none" style={contentStyle}>
                        <div dangerouslySetInnerHTML={{ __html: post.content }} />
                    </div>

                    <div style={{
                        marginTop: "56px",
                        paddingTop: "32px",
                        borderTop: "1px solid #f1f5f9",
                        textAlign: "center"
                    }}>
                        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>Bagikan artikel ini:</p>
                        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                            <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + " " + (typeof window !== 'undefined' ? window.location.href : ""))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    backgroundColor: "#22c55e",
                                    color: "white",
                                    padding: "10px 24px",
                                    borderRadius: "12px",
                                    textDecoration: "none",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                }}
                            >
                                <span>WhatsApp</span>
                            </a>
                        </div>
                    </div>
                </article>
            </main>

            {/* RECOMMENDATION SECTION */}
            <RecommendedPosts currentSlug={slug} />
        </div>
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
        <section style={{ background: "#f9fafb", padding: "80px 24px", marginTop: "60px" }}>
            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                <h3 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginBottom: "40px", textAlign: "center", letterSpacing: "-0.02em" }}>
                    Artikel Pilihan Lainnya
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
                    {others.map((p: any) => (
                        <Link key={p.id} href={`/artikel/${p.slug}`} className={styles.hoverCard}>
                            <div style={{ aspectRatio: "16/9", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden", position: "relative" }}>
                                {p.coverImage ? (
                                    <Image src={p.coverImage} alt={p.title} fill style={{ objectFit: "cover" }} sizes="(max-width: 1000px) 100vw, 33vw" />
                                ) : (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: "14px" }}>
                                        No Image
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className={styles.title}>{p.title}</h4>
                                <div className={styles.meta}>
                                    {new Date(p.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
