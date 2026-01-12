
import Navbar from "@/app/navbar/page";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import styles from "./page.module.css";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function KategoriPage() {
    // Fetch categories with a representative image
    // Since we can't easily doing "distinct on" with generic provider in one query with image relation easily without raw query or separate queries, 
    // and we want unique 'kategori' string.

    // 1. Get all categories from KategoriProduk table
    const categories = await prisma.kategoriProduk.findMany({
        orderBy: { urutan: 'asc' },
        include: {
            items: {
                take: 1,
                include: {
                    produk: {
                        include: { mainImage: true }
                    }
                }
            }
        }
    });

    // 2. Map data for display
    const categoryData = categories.map((c) => {
        // Try to get image from the first item in the category
        let imageUrl = c.items?.[0]?.produk?.mainImage?.url;

        return {
            name: c.nama,
            slug: c.slug,
            image: imageUrl || "/placeholder-image.jpg"
        };
    });

    return (
        <div style={{ background: "#ffffff", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
            <Navbar />
            <main className={styles.container}>
                <h1 className={styles.title}>Kategori Produk</h1>
                <p className={styles.subtitle}>Temukan koleksi furniture terbaik berdasarkan kategori</p>

                <div className={styles.grid}>
                    {categoryData.map((cat) => (
                        <Link
                            href={`/kategori/${cat.slug}`}
                            key={cat.slug}
                            className={styles.card}
                        >
                            <div className={styles.imageWrapper}>
                                {cat.image ? (
                                    <Image
                                        src={cat.image}
                                        alt={cat.name}
                                        fill
                                        style={{ objectFit: "cover" }}
                                    />
                                ) : (
                                    <div className={styles.placeholder}>No Image</div>
                                )}
                                <div className={styles.overlay} />
                            </div>
                            <div className={styles.content}>
                                <h2 className={styles.cardTitle}>{cat.name}</h2>
                                <span className={styles.cta}>Lihat Produk &rarr;</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
