"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "./ProductFilterSidebar.module.css";
import { FaFilter, FaXmark, FaChevronDown, FaChevronUp } from "react-icons/fa6";

interface FilterSidebarProps {
    categories: Array<{ name: string; count: number }>;
    tags: Array<{ name: string; count: number }>;
    minPrice: number;
    maxPrice: number;
}

export default function ProductFilterSidebar({ categories, tags, minPrice, maxPrice }: FilterSidebarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isOpen, setIsOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        category: true,
        price: true,
        discount: true,
        tags: true,
        sort: true
    });

    // Parse current filters from URL
    const selectedCategories = searchParams.get("kategori")?.split(",").filter(Boolean) || [];
    const selectedTags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
    const priceMin = parseInt(searchParams.get("minHarga") || String(minPrice));
    const priceMax = parseInt(searchParams.get("maxHarga") || String(maxPrice));
    const discountFilter = searchParams.get("diskon") || "";
    const sortBy = searchParams.get("sort") || "";

    const [localPriceMin, setLocalPriceMin] = useState(priceMin);
    const [localPriceMax, setLocalPriceMax] = useState(priceMax);

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const updateFilters = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === "") {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });

        router.push(`/produk?${params.toString()}`, { scroll: false });
    };

    const toggleCategory = (category: string) => {
        const newCategories = selectedCategories.includes(category)
            ? selectedCategories.filter(c => c !== category)
            : [...selectedCategories, category];

        updateFilters({ kategori: newCategories.length > 0 ? newCategories.join(",") : null });
    };

    const toggleTag = (tag: string) => {
        const newTags = selectedTags.includes(tag)
            ? selectedTags.filter(t => t !== tag)
            : [...selectedTags, tag];

        updateFilters({ tags: newTags.length > 0 ? newTags.join(",") : null });
    };

    const applyPriceRange = () => {
        updateFilters({
            minHarga: localPriceMin.toString(),
            maxHarga: localPriceMax.toString()
        });
    };

    const clearAllFilters = () => {
        router.push("/produk");
    };

    const activeFilterCount =
        selectedCategories.length +
        selectedTags.length +
        (discountFilter ? 1 : 0) +
        (sortBy ? 1 : 0) +
        ((priceMin !== minPrice || priceMax !== maxPrice) ? 1 : 0);

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                className={styles.mobileToggle}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle Filters"
            >
                <FaFilter size={18} />
                <span>Filter</span>
                {activeFilterCount > 0 && <span className={styles.badge}>{activeFilterCount}</span>}
            </button>

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
                <div className={styles.header}>
                    <h2>Filter Produk</h2>
                    <button onClick={() => setIsOpen(false)} className={styles.closeBtn} aria-label="Close">
                        <FaXmark />
                    </button>
                </div>

                {activeFilterCount > 0 && (
                    <button className={styles.clearAll} onClick={clearAllFilters}>
                        <FaXmark size={14} />
                        Hapus Semua Filter ({activeFilterCount})
                    </button>
                )}

                {/* Category Filter */}
                <div className={styles.filterSection}>
                    <button className={styles.sectionHeader} onClick={() => toggleSection("category")}>
                        <span>Kategori</span>
                        {expandedSections.category ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                    </button>
                    {expandedSections.category && (
                        <div className={styles.sectionContent}>
                            {categories.map(cat => (
                                <label key={cat.name} className={styles.checkbox}>
                                    <input
                                        type="checkbox"
                                        checked={selectedCategories.includes(cat.name)}
                                        onChange={() => toggleCategory(cat.name)}
                                    />
                                    <span>{cat.name}</span>
                                    <span className={styles.count}>({cat.count})</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Price Range Filter */}
                <div className={styles.filterSection}>
                    <button className={styles.sectionHeader} onClick={() => toggleSection("price")}>
                        <span>Harga</span>
                        {expandedSections.price ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                    </button>
                    {expandedSections.price && (
                        <div className={styles.sectionContent}>
                            <div className={styles.priceInputs}>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={localPriceMin}
                                    onChange={(e) => setLocalPriceMin(parseInt(e.target.value) || minPrice)}
                                    className={styles.priceInput}
                                />
                                <span>-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={localPriceMax}
                                    onChange={(e) => setLocalPriceMax(parseInt(e.target.value) || maxPrice)}
                                    className={styles.priceInput}
                                />
                            </div>
                            <button className={styles.applyBtn} onClick={applyPriceRange}>
                                Terapkan
                            </button>
                        </div>
                    )}
                </div>

                {/* Discount Filter */}
                <div className={styles.filterSection}>
                    <button className={styles.sectionHeader} onClick={() => toggleSection("discount")}>
                        <span>Diskon</span>
                        {expandedSections.discount ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                    </button>
                    {expandedSections.discount && (
                        <div className={styles.sectionContent}>
                            {["10", "20", "30", "50"].map(percent => (
                                <label key={percent} className={styles.radio}>
                                    <input
                                        type="radio"
                                        name="discount"
                                        checked={discountFilter === percent}
                                        onChange={() => updateFilters({ diskon: percent })}
                                    />
                                    <span>Minimal {percent}%</span>
                                </label>
                            ))}
                            {discountFilter && (
                                <button
                                    className={styles.clearBtn}
                                    onClick={() => updateFilters({ diskon: null })}
                                >
                                    Hapus Filter Diskon
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Tag Filter */}
                {tags.length > 0 && (
                    <div className={styles.filterSection}>
                        <button className={styles.sectionHeader} onClick={() => toggleSection("tags")}>
                            <span>Tag</span>
                            {expandedSections.tags ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                        </button>
                        {expandedSections.tags && (
                            <div className={styles.sectionContent}>
                                {tags.map(tag => (
                                    <label key={tag.name} className={styles.checkbox}>
                                        <input
                                            type="checkbox"
                                            checked={selectedTags.includes(tag.name)}
                                            onChange={() => toggleTag(tag.name)}
                                        />
                                        <span>{tag.name}</span>
                                        <span className={styles.count}>({tag.count})</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Sort By */}
                <div className={styles.filterSection}>
                    <button className={styles.sectionHeader} onClick={() => toggleSection("sort")}>
                        <span>Urutkan</span>
                        {expandedSections.sort ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                    </button>
                    {expandedSections.sort && (
                        <div className={styles.sectionContent}>
                            {[
                                { value: "", label: "Terbaru" },
                                { value: "price-asc", label: "Harga: Rendah ke Tinggi" },
                                { value: "price-desc", label: "Harga: Tinggi ke Rendah" },
                                { value: "discount-desc", label: "Diskon Terbesar" }
                            ].map(option => (
                                <label key={option.value} className={styles.radio}>
                                    <input
                                        type="radio"
                                        name="sort"
                                        checked={sortBy === option.value}
                                        onChange={() => updateFilters({ sort: option.value || null })}
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}
        </>
    );
}
