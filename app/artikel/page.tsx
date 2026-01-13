
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Navbar from "@/app/navbar/Navbar";
import GlobalFooter from "@/app/components/GlobalFooter";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function ArtikelIndexPage() {
    const posts = await prisma.post.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div style={{ background: "#ffffff", minHeight: "100vh", fontFamily: "Inter, sans-serif", paddingTop: "90px" }}>
            <Navbar />

            <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
                <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>
                    Postingan & Artikel
                </h1>
                <p style={{ color: "#64748b", marginBottom: "40px" }}>
                    Temukan inspirasi dan tips menarik seputar interior.
                </p>

                {posts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                        Belum ada artikel yang dipublikasikan.
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "30px" }}>
                        {posts.map((post: any) => (
                            <Link
                                href={`/artikel/${post.slug}`}
                                key={post.id}
                                style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: "16px" }}
                            >
                                <div style={{ aspectRatio: "16/9", background: "#f1f5f9", borderRadius: "12px", overflow: "hidden", position: "relative" }}>
                                    {post.coverImage ? (
                                        <Image
                                            src={post.coverImage}
                                            alt={post.title}
                                            fill
                                            style={{ objectFit: "cover" }}
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#cbd5e1" }}>
                                            No Image
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontSize: "12px", color: "#d97706", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>
                                        Article
                                    </div>
                                    <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", lineHeight: "1.4", marginBottom: "8px" }}>
                                        {post.title}
                                    </h2>
                                    <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                        {post.excerpt || post.seoDescription || "Baca selengkapnya..."}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            <GlobalFooter />
        </div>
    );
}
