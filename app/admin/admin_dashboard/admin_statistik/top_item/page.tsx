"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../../admin_dashboard.module.css";
import LogoutButton from "../../LogoutButton";

type MenuKey = "home" | "produk" | "galeri" | "pengaturan" | "konten" | "statistik";

interface TopItem {
    id: number;
    nama: string;
    kategori: string;
    cardViews: number;      // Berapa kali card dilihat
    cardClicks: number;     // Berapa kali card diklik (ke detail page)
    contactClicks: number;  // Berapa kali tombol "Hubungi Sekarang" diklik
    lastClicked: string;
    trend: "up" | "down" | "stable";
    conversionRate: number; // Persentase dari view ke contact click
}

type DateFilter = "today" | "week" | "month" | "all";

export default function TopItemEnhancedPage() {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [activeMenu, setActiveMenu] = useState<MenuKey>("statistik");
    const [topItems, setTopItems] = useState<TopItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState<DateFilter>("all");

    useEffect(() => {
        // Data akan muncul setelah deploy dan implement tracking
        setTopItems([]);
        setLoading(false);
    }, [dateFilter]);

    const goHome = () => {
        setActiveMenu("home");
        setIsSidebarOpen(false);
        router.push("/admin/admin_dashboard");
    };

    const handleMenuClick = (menu: Exclude<MenuKey, "home">) => {
        setActiveMenu(menu);
        setIsSidebarOpen(false);

        switch (menu) {
            case "produk":
                router.push("/admin/admin_dashboard/admin_produk");
                break;
            case "galeri":
                router.push("/admin/admin_dashboard/admin_galeri");
                break;
            case "pengaturan":
                router.push("/admin/admin_dashboard/admin_pengaturan");
                break;
            case "statistik":
                router.push("/admin/admin_dashboard/admin_statistik");
                break;
        }
    };

    const exportToCSV = () => {
        if (topItems.length === 0) {
            alert("Tidak ada data untuk di-export");
            return;
        }

        const headers = ["Rank", "Nama Produk", "Kategori", "Card Views", "Card Clicks", "Contact Clicks", "Conversion Rate", "Terakhir Diklik"];
        const rows = topItems.map((item, index) => [
            index + 1,
            item.nama,
            item.kategori,
            item.cardViews,
            item.cardClicks,
            item.contactClicks,
            `${item.conversionRate}%`,
            item.lastClicked,
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.join(",")),
        ].join("\\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `top-items-${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
    };

    return (
        <div className={`${styles.dashboard} ${isDarkMode ? styles.dashboardDark : ""}`}>
            <header className={styles.mobileTopBar}>
                <button
                    className={styles.mobileMenuButton}
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label="Buka menu"
                >
                    =
                </button>
                <h1 className={styles.mobileTitle}>Top Item</h1>
            </header>

            {isSidebarOpen && (
                <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)} />
            )}

            <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
                <div className={styles.sidebarHeader}>
                    <button
                        className={styles.backButton}
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Tutup menu"
                    >
                        ←
                    </button>
                    <div className={styles.brand}>
                        <span className={styles.brandLogo}>A</span>
                        <div className={styles.brandText}>
                            <span className={styles.brandTitle}>APIX Interior</span>
                            <span className={styles.brandSubtitle}>Admin Panel</span>
                        </div>
                    </div>
                </div>

                <nav className={styles.menu}>
                    <button
                        className={`${styles.menuItem} ${activeMenu === "home" ? styles.menuItemActive : ""}`}
                        onClick={goHome}
                    >
                        Home
                    </button>

                    <button
                        className={`${styles.menuItem} ${activeMenu === "produk" ? styles.menuItemActive : ""}`}
                        onClick={() => handleMenuClick("produk")}
                    >
                        Produk
                    </button>

                    <button
                        className={`${styles.menuItem} ${activeMenu === "galeri" ? styles.menuItemActive : ""}`}
                        onClick={() => handleMenuClick("galeri")}
                    >
                        Galeri
                    </button>

                    <button
                        className={`${styles.menuItem} ${activeMenu === "pengaturan" ? styles.menuItemActive : ""}`}
                        onClick={() => handleMenuClick("pengaturan")}
                    >
                        Pengaturan
                    </button>

                    <button
                        className={`${styles.menuItem}`}
                        onClick={() => router.push("/admin/admin_dashboard/admin_konten")}
                    >
                        Konten
                    </button>

                    <button
                        className={`${styles.menuItem} ${activeMenu === "statistik" ? styles.menuItemActive : ""}`}
                        onClick={() => handleMenuClick("statistik")}
                    >
                        Statistik
                    </button>
                </nav>

                <div className={styles.themeSwitchWrapper}>
                    <span className={styles.themeLabel}>
                        Mode: {isDarkMode ? "Malam" : "Siang"}
                    </span>
                    <button
                        className={`${styles.themeSwitch} ${isDarkMode ? styles.themeSwitchOn : ""}`}
                        onClick={() => setIsDarkMode((prev) => !prev)}
                        aria-label="Toggle dark mode"
                    >
                        <span className={styles.themeThumb} />
                    </button>
                </div>

                <div className={styles.logoutInlineWrapper}>
                    <LogoutButton />
                </div>
            </aside>

            <main className={styles.main}>
                <div className={styles.mainHeader}>
                    <button
                        onClick={() => router.back()}
                        style={{
                            background: "transparent",
                            border: "none",
                            fontSize: "24px",
                            cursor: "pointer",
                            marginBottom: "10px",
                        }}
                    >
                        ← Kembali
                    </button>
                    <h2 className={styles.pageTitle}>Top Item</h2>
                    <p className={styles.pageSubtitle}>
                        Produk yang paling banyak dilihat (Most Viewed)
                    </p>
                </div>

                {/* Filter & Actions Bar */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                    gap: "10px"
                }}>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <button
                            onClick={() => setDateFilter("today")}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "8px",
                                border: dateFilter === "today" ? "2px solid #0ea5e9" : "1px solid #e2e8f0",
                                background: dateFilter === "today" ? "#e0f2fe" : "white",
                                color: dateFilter === "today" ? "#0369a1" : "#64748b",
                                cursor: "pointer",
                                fontWeight: dateFilter === "today" ? "600" : "normal",
                            }}
                        >
                            Hari Ini
                        </button>
                        <button
                            onClick={() => setDateFilter("week")}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "8px",
                                border: dateFilter === "week" ? "2px solid #0ea5e9" : "1px solid #e2e8f0",
                                background: dateFilter === "week" ? "#e0f2fe" : "white",
                                color: dateFilter === "week" ? "#0369a1" : "#64748b",
                                cursor: "pointer",
                                fontWeight: dateFilter === "week" ? "600" : "normal",
                            }}
                        >
                            Minggu Ini
                        </button>
                        <button
                            onClick={() => setDateFilter("month")}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "8px",
                                border: dateFilter === "month" ? "2px solid #0ea5e9" : "1px solid #e2e8f0",
                                background: dateFilter === "month" ? "#e0f2fe" : "white",
                                color: dateFilter === "month" ? "#0369a1" : "#64748b",
                                cursor: "pointer",
                                fontWeight: dateFilter === "month" ? "600" : "normal",
                            }}
                        >
                            Bulan Ini
                        </button>
                        <button
                            onClick={() => setDateFilter("all")}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "8px",
                                border: dateFilter === "all" ? "2px solid #0ea5e9" : "1px solid #e2e8f0",
                                background: dateFilter === "all" ? "#e0f2fe" : "white",
                                color: dateFilter === "all" ? "#0369a1" : "#64748b",
                                cursor: "pointer",
                                fontWeight: dateFilter === "all" ? "600" : "normal",
                            }}
                        >
                            Semua
                        </button>
                    </div>

                    <button
                        onClick={exportToCSV}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "8px",
                            border: "none",
                            background: "#10b981",
                            color: "white",
                            cursor: "pointer",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        📥 Export CSV
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                        Loading...
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: "20px", padding: "15px", background: "#f1f5f9", borderRadius: "8px" }}>
                            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                                📊 Total {topItems.length} produk paling populer berdasarkan jumlah views
                            </p>
                        </div>

                        {topItems.length === 0 ? (
                            <div style={{
                                textAlign: "center",
                                padding: "60px 20px",
                                background: "white",
                                borderRadius: "12px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                            }}>
                                <div style={{ fontSize: "64px", marginBottom: "20px" }}>📊</div>
                                <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#0f172a", marginBottom: "10px" }}>
                                    Belum Ada Data
                                </h3>
                                <p style={{ color: "#64748b", lineHeight: "1.6", maxWidth: "500px", margin: "0 auto" }}>
                                    Data klik produk akan muncul setelah website di-publish dan ada pengunjung yang mengklik tombol "Hubungi Sekarang".
                                </p>
                            </div>
                        ) : (
                            <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                                            <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#334155" }}>
                                                Rank
                                            </th>
                                            <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#334155" }}>
                                                Nama Produk
                                            </th>
                                            <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#334155" }}>
                                                Kategori
                                            </th>
                                            <th style={{ padding: "12px", textAlign: "center", fontWeight: "600", color: "#334155", fontSize: "13px" }}>
                                                Card Views
                                            </th>
                                            <th style={{ padding: "12px", textAlign: "center", fontWeight: "600", color: "#334155", fontSize: "13px" }}>
                                                Card Clicks
                                            </th>
                                            <th style={{ padding: "12px", textAlign: "center", fontWeight: "600", color: "#334155", fontSize: "13px" }}>
                                                Contact Clicks
                                            </th>
                                            <th style={{ padding: "12px", textAlign: "center", fontWeight: "600", color: "#334155", fontSize: "13px" }}>
                                                Conversion
                                            </th>
                                            <th style={{ padding: "12px", textAlign: "center", fontWeight: "600", color: "#334155", fontSize: "13px" }}>
                                                Trend
                                            </th>
                                            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#334155", fontSize: "13px" }}>
                                                Terakhir Diklik
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topItems.map((item, index) => (
                                            <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                <td style={{ padding: "16px" }}>
                                                    <div
                                                        style={{
                                                            width: "32px",
                                                            height: "32px",
                                                            borderRadius: "50%",
                                                            background: index === 0 ? "#fbbf24" : index === 1 ? "#94a3b8" : index === 2 ? "#cd7f32" : "#e2e8f0",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontWeight: "bold",
                                                            color: index < 3 ? "white" : "#64748b",
                                                        }}
                                                    >
                                                        {index + 1}
                                                    </div>
                                                </td>
                                                <td style={{ padding: "16px", fontWeight: "500", color: "#0f172a" }}>
                                                    {item.nama}
                                                </td>
                                                <td style={{ padding: "16px", color: "#64748b" }}>
                                                    {item.kategori}
                                                </td>
                                                <td style={{ padding: "12px", textAlign: "center", fontSize: "14px" }}>
                                                    {item.cardViews.toLocaleString()}
                                                </td>
                                                <td style={{ padding: "12px", textAlign: "center", fontSize: "14px" }}>
                                                    {item.cardClicks.toLocaleString()}
                                                </td>
                                                <td style={{ padding: "12px", textAlign: "center" }}>
                                                    <span
                                                        style={{
                                                            display: "inline-block",
                                                            padding: "4px 10px",
                                                            background: "#dcfce7",
                                                            color: "#166534",
                                                            borderRadius: "12px",
                                                            fontWeight: "600",
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {item.contactClicks}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "12px", textAlign: "center", fontSize: "14px", fontWeight: "600", color: "#0ea5e9" }}>
                                                    {item.conversionRate}%
                                                </td>
                                                <td style={{ padding: "12px", textAlign: "center" }}>
                                                    <span style={{ fontSize: "20px" }}>
                                                        {item.trend === "up" ? "📈" : item.trend === "down" ? "📉" : "➡️"}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "12px", color: "#64748b", fontSize: "13px" }}>
                                                    {item.lastClicked}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}


                    </>
                )}
            </main>
        </div>
    );
}
