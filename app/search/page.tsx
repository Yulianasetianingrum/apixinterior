import { prisma } from "@/lib/prisma";
import Navbar from "@/app/navbar/Navbar";
import GlobalFooter from "@/app/components/GlobalFooter";
import ProductCard from "@/app/components/product/ProductCard.client";
import Fuse from "fuse.js";

export const dynamic = "force-dynamic";

type Props = {
    searchParams: Promise<{ q?: string; kategori?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
    const { q, kategori } = await searchParams;
    const query = q ? String(q).trim() : "";
    const categoryId = kategori ? Number(kategori) : null;

    let products: any[] = [];
    let categoryName = "";
    let categoryProductIds: number[] | null = null;

    // 1. If Category selected, fetch Category Info & Related Product IDs
    if (categoryId) {
        const categoryData = await prisma.kategoriProduk.findUnique({
            where: { id: categoryId },
            include: {
                items: {
                    select: { produkId: true }
                }
            }
        });

        if (categoryData) {
            categoryName = categoryData.nama;
            categoryProductIds = categoryData.items.map(item => item.produkId);
        }
    }

    // 2. Search Logic
    if (query) {
        // --- SEARCH + FILTER ---
        // Fetch lightweight index
        const allProducts = await prisma.produk.findMany({
            where: {}, // We filter later to support Fuse ranking
            select: { id: true, nama: true, slug: true, deskripsiSingkat: true, kategori: true }
        });

        // Setup Fuse
        const fuse = new Fuse(allProducts, {
            keys: [
                { name: "nama", weight: 0.5 },
                { name: "slug", weight: 0.2 },
                { name: "kategori", weight: 0.2 },
                { name: "deskripsiSingkat", weight: 0.1 },
            ],
            includeScore: true,
            threshold: 0.6,
            isCaseSensitive: false,
        });

        const searchResults = fuse.search(query);
        let matchedIds = searchResults.map(r => r.item.id);

        // Apply Category Filter if active
        if (categoryProductIds !== null) {
            const allowedIds = new Set(categoryProductIds);
            matchedIds = matchedIds.filter(id => allowedIds.has(id));
        }

        if (matchedIds.length > 0) {
            const dbProducts = await prisma.produk.findMany({
                where: { id: { in: matchedIds } },
                include: { mainImage: true }
            });

            // Maintain Sort Order
            products = matchedIds
                .map(id => dbProducts.find(p => p.id === id))
                .filter(Boolean);
        }

    } else if (categoryProductIds !== null) {
        // --- CATEGORY ONLY (No Query) ---
        products = await prisma.produk.findMany({
            where: { id: { in: categoryProductIds } },
            orderBy: { createdAt: 'desc' },
            include: { mainImage: true }
        });
    }

    // Filter Title Helper
    const getPageTitle = () => {
        if (query && categoryName) return `Pencarian: "${query}" di ${categoryName}`;
        if (query) return `Hasil Pencarian: "${query}"`;
        if (categoryName) return `Kategori: ${categoryName}`;
        return "Pencarian Produk";
    };

    return (
        <div style={{ background: "#ffffff", minHeight: "100vh", fontFamily: "Inter, sans-serif", paddingTop: "90px" }}>
            <Navbar />

            <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 24px" }}>
                <div style={{ marginBottom: 30 }}>
                    <h1 style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: "800", color: "#0f172a", marginBottom: 8 }}>
                        {getPageTitle()}
                    </h1>
                    <p style={{ color: "#64748b", fontSize: 14 }}>
                        {products.length > 0 ? `Ditemukan ${products.length} produk` : "Tidak ada produk ditemukan"}
                    </p>
                </div>

                {products.length === 0 && (
                    <div style={{ padding: "80px 20px", textAlign: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                        <h3 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                            Tidak Ada Hasil
                        </h3>
                        <p style={{ color: "#64748b", fontSize: 16 }}>
                            {categoryName
                                ? `Belum ada produk di kategori "${categoryName}"`
                                : "Coba kata kunci lain"}
                        </p>
                    </div>
                )}

                {products.length > 0 && (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: "24px"
                    }}>
                        {products.map((product, index) => (
                            <ProductCard key={product.id} product={product} index={index} />
                        ))}
                    </div>
                )}
            </main>

            <GlobalFooter />
        </div>
    );
}
