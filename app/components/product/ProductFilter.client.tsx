"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import styles from "./ProductFilter.module.css";
import { FaMagnifyingGlass, FaFilter } from "react-icons/fa6";

interface ProductFilterProps {
    categories: string[];
    tags: string[];
    selectedCategory?: string;
    selectedTag?: string;
    initialSearch?: string;
    initialMinPrice?: string;
    initialMaxPrice?: string;
    initialSort?: string;
}

export default function ProductFilter({
    categories,
    tags,
    selectedCategory,
    selectedTag,
    initialSearch,
    initialMinPrice,
    initialMaxPrice,
    initialSort,
}: ProductFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Local state for deferred updates (debounce search, etc)
    const [search, setSearch] = useState(initialSearch ?? searchParams.get("q") ?? "");
    const [minPrice, setMinPrice] = useState(initialMinPrice ?? searchParams.get("min") ?? "");
    const [maxPrice, setMaxPrice] = useState(initialMaxPrice ?? searchParams.get("max") ?? "");
    const [sort, setSort] = useState(initialSort ?? searchParams.get("sort") ?? "latest");
    const [isOpen, setIsOpen] = useState(false);

    const selectedCatName = searchParams.get("cat") ?? selectedCategory ?? "";
    const selectedTagName = searchParams.get("tag") ?? selectedTag ?? "";

    // Close drawer when URL changes (filter applied) and syncing state
    useEffect(() => {
        setIsOpen(false);
        // Sync local state if URL changes externally
        setSearch(searchParams.get("q") ?? "");
        setSort(searchParams.get("sort") ?? "latest");
    }, [searchParams]);

    // Apply Filter Helper
    function applyFilter(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }

        startTransition(() => {
            router.push(`/produk?${params.toString()}`, { scroll: false });
        });
    }

    // Debounce search input
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (search !== (searchParams.get("q") ?? "")) {
                applyFilter("q", search);
            }
        }, 500);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    // Debounce price input
    useEffect(() => {
        const timeout = setTimeout(() => {
            const currentMin = searchParams.get("min") ?? "";
            const currentMax = searchParams.get("max") ?? "";

            // Only update if changes exist
            if (minPrice !== currentMin || maxPrice !== currentMax) {
                const params = new URLSearchParams(searchParams.toString());
                if (minPrice) params.set("min", minPrice); else params.delete("min");
                if (maxPrice) params.set("max", maxPrice); else params.delete("max");

                startTransition(() => {
                    router.push(`/produk?${params.toString()}`, { scroll: false });
                });
            }
        }, 800);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minPrice, maxPrice]);

    return (
        <>
            {/* Mobile Toggle Button */}
            <button className={styles.mobileToggle} onClick={() => setIsOpen(true)} aria-label="Filter Produk">
                <FaFilter />
            </button>

            {/* Backdrop */}
            <div
                className={`${styles.backdrop} ${isOpen ? styles.open : ""}`}
                onClick={() => setIsOpen(false)}
            />

            <div className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
                {/* Mobile Header */}
                <div className={styles.headerMobile}>
                    <span className={styles.mobileTitle}>Filter Produk</span>
                    <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                        ✕
                    </button>
                </div>

                {/* Search */}
                <div className={styles.section}>
                    <div className={styles.title}>Cari Produk</div>
                    <div style={{ position: "relative" }}>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Nama produk..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <FaMagnifyingGlass
                            style={{ position: "absolute", right: 12, top: 12, color: "#94a3b8" }}
                        />
                    </div>
                </div>

                {/* Sort */}
                <div className={styles.section}>
                    <div className={styles.title}>Urutkan</div>
                    <select
                        className={styles.select}
                        value={sort}
                        onChange={(e) => {
                            setSort(e.target.value);
                            applyFilter("sort", e.target.value);
                        }}
                    >
                        <option value="latest">Terbaru</option>
                        <option value="oldest">Terlama</option>
                        <option value="price_asc">Harga: Rendah ke Tinggi</option>
                        <option value="price_desc">Harga: Tinggi ke Rendah</option>
                        <option value="name_asc">Nama (A-Z)</option>
                        <option value="name_desc">Nama (Z-A)</option>
                        <option value="discount_desc">Diskon Tertinggi</option>
                    </select>
                </div>

                {/* Categories */}
                <div className={styles.section}>
                    <div className={styles.title}>Kategori</div>
                    <ul className={styles.categoryList}>
                        <li className={styles.categoryItem}>
                            <input
                                type="radio"
                                name="cat"
                                className={styles.checkbox}
                                checked={selectedCatName === ""}
                                onChange={() => applyFilter("cat", "")}
                                id="cat-all"
                            />
                            <label htmlFor="cat-all" className={selectedCatName === "" ? styles.activeCategory : ""}>
                                Semua Kategori
                            </label>
                        </li>
                        {categories.map((c, idx) => (
                            <li key={idx} className={styles.categoryItem}>
                                <input
                                    type="radio"
                                    name="cat"
                                    className={styles.checkbox}
                                    checked={selectedCatName === c}
                                    onChange={() => applyFilter("cat", c)}
                                    id={`cat-${idx}`}
                                />
                                <label htmlFor={`cat-${idx}`} className={selectedCatName === c ? styles.activeCategory : ""}>
                                    {c}
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                    <div className={styles.section}>
                        <div className={styles.title}>Tags</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {tags.map((t, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => applyFilter("tag", selectedTagName === t ? "" : t)}
                                    style={{
                                        padding: "4px 12px",
                                        borderRadius: "20px",
                                        fontSize: "12px",
                                        border: selectedTagName === t ? "1px solid #b88e2f" : "1px solid #e2e8f0",
                                        background: selectedTagName === t ? "#b88e2f" : "#f8fafc",
                                        color: selectedTagName === t ? "#ffffff" : "#64748b",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Price Range */}
                <div className={styles.section}>
                    <div className={styles.title}>Harga</div>
                    <div className={styles.priceInputs}>
                        <input
                            type="number"
                            placeholder="Min"
                            className={styles.priceInput}
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                        />
                        <span className={styles.divider}>-</span>
                        <input
                            type="number"
                            placeholder="Max"
                            className={styles.priceInput}
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                        />
                    </div>
                </div>

                {/* Reset */}
                {(search || selectedCatName || minPrice || maxPrice || sort !== "latest") && (
                    <button
                        className={styles.resetLink}
                        onClick={() => {
                            setSearch("");
                            setMinPrice("");
                            setMaxPrice("");
                            setSort("latest");
                            router.push("/produk");
                        }}
                    >
                        Reset Filter
                    </button>
                )}
            </div>
        </>
    );
}
