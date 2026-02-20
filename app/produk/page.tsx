import Navbar from "@/app/navbar/Navbar";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/app/components/product/ProductCard.client";
import ProductFilter from "@/app/components/product/ProductFilter.client";
import ProductPageClient from "./ProductPageClient";
import styles from "./page.module.css";
import GlobalFooter from "@/app/components/GlobalFooter";
import { Metadata } from "next";
import { getGlobalShowPrice } from "@/lib/product-price-visibility";

export const dynamic = "force-dynamic";

type PageProps = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
    const searchParams = await props.searchParams;
    const getString = (val: string | string[] | undefined) => {
        if (Array.isArray(val)) return val[0];
        return val;
    };

    const q = getString(searchParams?.q) ?? "";
    const catName = getString(searchParams?.cat);
    const catIdRaw = getString(searchParams?.catId);
    const catId = catIdRaw ? parseInt(catIdRaw) : undefined;
    const tagName = getString(searchParams?.tag);

    // Dynamic title and description based on filters
    let title = "Semua Produk Furniture & Mebel";
    let description = "Jelajahi koleksi lengkap furniture, mebel, dan perabotan berkualitas dari Apix Interior. Melayani Jakarta dan sekitarnya dengan harga terjangkau.";

    if (catName) {
        title = `${catName} - Furniture & Mebel Berkualitas`;
        description = `Koleksi ${catName} terlengkap dari Apix Interior. Furniture dan mebel ${catName} berkualitas dengan harga terjangkau. Melayani Jakarta dan sekitarnya.`;
    } else if (q) {
        title = `Pencarian: "${q}" - Furniture & Mebel`;
        description = `Hasil pencarian untuk "${q}". Temukan furniture dan mebel berkualitas dari Apix Interior. Melayani Jakarta dan sekitarnya.`;
    } else if (tagName) {
        title = `Tag: ${tagName} - Furniture & Mebel`;
        description = `Produk dengan tag ${tagName}. Furniture dan mebel berkualitas dari Apix Interior. Melayani Jakarta dan sekitarnya.`;
    }

    return {
        title: `${title} | Apix Interior`,
        description,
        keywords: [
            "furniture",
            "mebel",
            "furnitur",
            "perabotan",
            catName || "",
            tagName || "",
            "furniture jakarta",
            "mebel jakarta",
            "furniture murah",
            "mebel berkualitas",
            "apix interior",
        ].filter(Boolean),
        openGraph: {
            title: `${title} | Apix Interior`,
            description,
            type: "website",
        },
    };
}

export default async function ProductListingPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    // A. Parse Filter Params
    // Helper to safely get string params
    const getString = (val: string | string[] | undefined) => {
        if (Array.isArray(val)) return val[0];
        return val;
    };

    const q = getString(searchParams?.q) ?? "";
    const catName = getString(searchParams?.cat);
    const catIdRaw = getString(searchParams?.catId);
    const catId = catIdRaw ? parseInt(catIdRaw) : undefined;
    const tagName = getString(searchParams?.tag);
    const minRaw = getString(searchParams?.min);
    const minPrice = minRaw ? parseInt(minRaw) : undefined;
    const maxRaw = getString(searchParams?.max);
    const maxPrice = maxRaw ? parseInt(maxRaw) : undefined;
    const sort = getString(searchParams?.sort) ?? "latest";

    // B. Build Where Clause
    const whereClause: any = {};

    // Name search
    if (q) {
        whereClause.nama = {
            contains: q,
        };
    }

    // Category Filter
    if (catId && Number.isFinite(catId)) {
        const orFilters: any[] = [
            {
                kategoriProdukItems: {
                    some: {
                        kategoriId: catId
                    }
                }
            }
        ];
        if (catName) {
            orFilters.push({ kategori: catName });
        }
        whereClause.OR = orFilters;
    } else if (catName) {
        // Fallback to string matching or slug matching if needed (simplified for dynamic strings)
        // Since we are moving to dynamic string categories from Produk table, we check both.
        whereClause.OR = [
            { kategori: catName },
            {
                kategoriProdukItems: {
                    some: {
                        kategori: {
                            nama: catName
                        }
                    }
                }
            }
        ];
    }

    // Tag Filter
    if (tagName) {
        whereClause.tags = {
            contains: tagName
        };
    }

    // Price Filter
    if (minPrice !== undefined || maxPrice !== undefined) {
        whereClause.harga = {};
        if (minPrice !== undefined) whereClause.harga.gte = minPrice;
        if (maxPrice !== undefined) whereClause.harga.lte = maxPrice;
    }

    // C. Build Sort Clause
    let orderBy: any = {};
    switch (sort) {
        case "price_asc":
            orderBy = { harga: "asc" };
            break;
        case "price_desc":
            orderBy = { harga: "desc" };
            break;
        case "name_asc":
            orderBy = { nama: "asc" };
            break;
        case "name_desc":
            orderBy = { nama: "desc" };
            break;
        case "oldest":
            orderBy = { createdAt: "asc" };
            break;
        case "discount_desc":
            orderBy = { promoValue: "desc" };
            break;
        case "latest":
        default:
            orderBy = { createdAt: "desc" };
            break;
    }

    // D. Fetch Content
    // We need unique categories from Category table, and unique tags from Products
    // Also fetch global showPrice setting from PRODUCT_LISTING section
    const [products, allCategories, allProductsMeta, showPrice] = await Promise.all([
        prisma.produk.findMany({
            where: whereClause,
            orderBy,
            include: {
                mainImage: true,
                variasiProduk: true,
            },
        }),
        prisma.kategoriProduk.findMany({
            orderBy: { urutan: "asc" }
        }),
        prisma.produk.findMany({
            select: { tags: true },
            where: { tags: { not: null } }
        }),
        getGlobalShowPrice(),
    ]);

    // Process unique filters
    const uniqueCategories = allCategories.map((c: any) => c.nama);
    const uniqueTags = Array.from(new Set(allProductsMeta.flatMap((p: any) => p.tags ? p.tags.split(',').map((t: any) => t.trim()) : []).filter(Boolean))) as string[];

    // Dynamic Title
    let pageTitle = "Semua Produk";
    if (catName) pageTitle = `Kategori: ${catName}`;
    else if (q) pageTitle = `Pencarian: "${q}"`;
    else if (tagName) pageTitle = `Tag: ${tagName}`;

    return (
        <div style={{ background: "#ffffff", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
            <Navbar />
            <ProductPageClient
                title={pageTitle}
                sidebarSlot={
                    <ProductFilter
                        categories={uniqueCategories}
                        tags={uniqueTags}
                        selectedCategory={catName}
                        selectedTag={tagName}
                        initialSearch={q}
                        initialMinPrice={minRaw}
                        initialMaxPrice={maxRaw}
                        initialSort={sort}
                    />
                }
            >
                {products.length > 0 ? (
                    <div className={styles.grid}>
                        {products.map((p: any, idx: number) => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                index={idx}
                                showPrice={showPrice}
                            />
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: "center", padding: "40px", color: "#64748b", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                        <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔍</div>
                        <div>Tidak ada produk yang ditemukan.</div>
                        {(q || catName || minPrice !== undefined || maxPrice !== undefined) && (
                            <div style={{ fontSize: "14px", marginTop: "4px", color: "#94a3b8" }}>
                                Coba kurangi filter pencarian Anda.
                            </div>
                        )}
                    </div>
                )}
            </ProductPageClient>
            <GlobalFooter />
        </div>
    );
}
