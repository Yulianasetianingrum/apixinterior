
import Navbar from "@/app/navbar/Navbar";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import styles from "./page.module.css";
// Remove next/image import as we will use SecureImage
// import Image from "next/image"; 
import SecureImage from "@/app/components/SecureImage";
import { normalizePublicUrl } from "@/lib/product-utils";

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
    const categoryData = categories.map((c: any) => {
        // Try to get image from the first item in the category
        let rawUrl = c.items?.[0]?.produk?.mainImage?.url;
        let imageUrl = normalizePublicUrl(rawUrl);

        return {
            name: c.nama,
            slug: c.slug,
            image: imageUrl // can be null
        };
    });

    return (
        <div style={{ background: "#ffffff", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
            <Navbar />
            <main className={styles.container}>
                <h1 className={styles.title}>Kategori Produk</h1>
                <p className={styles.subtitle}>Temukan koleksi furniture terbaik berdasarkan kategori</p>

                <div className={styles.grid}>
                    {categoryData.map((cat: any) => (
                        <Link
                            href={`/kategori/${cat.slug}`}
                            key={cat.slug}
                            className={styles.card}
                        >
                            <div className={styles.imageWrapper}>
                                {cat.image ? (
                                    <SecureImage
                                        src={cat.image}
                                        alt={cat.name}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
