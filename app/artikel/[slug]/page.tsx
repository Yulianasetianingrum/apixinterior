
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Navbar from "@/app/navbar/Navbar";
import Image from "next/image";
import Link from "next/link";
import SecureImage from "@/app/components/SecureImage";
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

    // Fetch Contacts
    const allContacts = await prisma.hubungi.findMany({
        orderBy: [{ prioritas: 'desc' }, { id: 'desc' }]
    });

    const priorityContact = allContacts[0];
    const waNumber = priorityContact?.nomor || "6282112345678";
    const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo Apix Interior, saya baru saja membaca artikel "${post.title}" dan tertarik untuk konsultasi.`)}`;

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
                        {/* DEBUG: CoverImage Path = {post.coverImage} */}
                        <div style={{ display: 'none' }}>IMG_PATH: {post.coverImage}</div>
                        <div style={badgeStyle}>ARTIKEL & BLOG</div>
                        <h1 style={{ ...titleStyle, textTransform: 'capitalize' }}>{post.title}</h1>
                        <div style={metaStyle}>
                            <span>Ditulis oleh <strong>{post.author || "Admin"}</strong></span>
                            <span style={{ opacity: 0.3 }}>•</span>
                            <span>{new Date(post.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                        </div>
                    </header>

                    {post.coverImage && (
                        <div style={imageWrapperStyle}>
                            <SecureImage
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

                    {/* CONTACT CTA SECTION */}
                    <div style={{
                        marginTop: "64px",
                        padding: "48px 32px",
                        backgroundColor: "#c5a02e", // Golden Premium
                        borderRadius: "24px",
                        textAlign: "center",
                        color: "#001f3f", // Navy
                        boxShadow: "0 25px 50px -12px rgba(197, 160, 46, 0.25)",
                        border: "1px solid rgba(0, 31, 63, 0.1)",
                        position: "relative",
                        overflow: "hidden"
                    }}>
                        {/* Decorative background element */}
                        <div style={{
                            position: "absolute",
                            top: "-50px",
                            right: "-50px",
                            width: "150px",
                            height: "150px",
                            backgroundColor: "rgba(0, 31, 63, 0.05)",
                            borderRadius: "50%",
                            zIndex: 0
                        }}></div>

                        <div style={{ position: "relative", zIndex: 1 }}>
                            <h3 style={{ fontSize: "28px", fontWeight: "900", marginBottom: "16px", color: "#001f3f", letterSpacing: "-0.5px" }}>
                                Ingin Interior Seperti Ini?
                            </h3>
                            <p style={{ fontSize: "17px", marginBottom: "32px", fontWeight: "500", color: "rgba(0, 31, 63, 0.8)", lineHeight: "1.6" }}>
                                Hubungi tim <strong>Apix Interior</strong> sekarang untuk konsultasi desain gratis dan estimasi biaya pengerjaan mebel custom Anda.
                            </p>

                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
                                <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        backgroundColor: "#001f3f", // Navy
                                        color: "#c5a02e", // Golden
                                        padding: "18px 56px",
                                        borderRadius: "16px",
                                        textDecoration: "none",
                                        fontSize: "20px",
                                        fontWeight: "900",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        boxShadow: "0 10px 15px -3px rgba(0, 31, 63, 0.4)",
                                        border: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    <span>HUBUNGI KAMI SEKARANG</span>
                                </a>

                                {allContacts.length > 1 && (
                                    <div style={{
                                        marginTop: "16px",
                                        width: "100%",
                                        maxWidth: "400px",
                                        padding: "16px",
                                        backgroundColor: "rgba(0, 31, 63, 0.05)",
                                        borderRadius: "12px",
                                        border: "1px dashed rgba(0, 31, 63, 0.2)"
                                    }}>
                                        <p style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", opacity: 0.8 }}>Nomor Layanan Lainnya:</p>
                                        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px" }}>
                                            {allContacts.slice(1).map(c => (
                                                <a
                                                    key={c.id}
                                                    href={`https://wa.me/${c.nomor}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        fontSize: "13px",
                                                        padding: "4px 10px",
                                                        backgroundColor: "white",
                                                        borderRadius: "6px",
                                                        textDecoration: "none",
                                                        color: "#001f3f",
                                                        fontWeight: "600",
                                                        border: "1px solid rgba(0, 31, 63, 0.1)"
                                                    }}
                                                >
                                                    +{c.nomor.slice(0, 2)} {c.nomor.slice(2)}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SHARE SECTION */}
                    <div style={{
                        marginTop: "48px",
                        textAlign: "center",
                        paddingTop: "32px",
                        borderTop: "1px solid #f1f5f9"
                    }}>
                        <p style={{ fontSize: "14px", color: "#64748b", fontWeight: "600", marginBottom: "16px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                            Bagikan Artikel Ini
                        </p>
                        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                            <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    backgroundColor: "#22c55e",
                                    color: "white",
                                    padding: "10px 24px",
                                    borderRadius: "120px",
                                    textDecoration: "none",
                                    fontSize: "14px",
                                    fontWeight: "700",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    boxShadow: "0 4px 6px -1px rgba(34, 197, 94, 0.2)"
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
                                    <SecureImage src={p.coverImage} alt={p.title} fill style={{ objectFit: "cover" }} sizes="(max-width: 1000px) 100vw, 33vw" />
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
