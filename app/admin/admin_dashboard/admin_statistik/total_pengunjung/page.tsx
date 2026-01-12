"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../../admin_dashboard.module.css";
import LogoutButton from "../../LogoutButton";

type MenuKey = "home" | "produk" | "galeri" | "pengaturan" | "konten" | "statistik";

export default function TotalPengunjungPage() {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [activeMenu, setActiveMenu] = useState<MenuKey>("statistik");

    // Dummy data - nanti bisa diganti dengan real analytics
    const [stats, setStats] = useState({
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        total: 0,
    });

    useEffect(() => {
        // Data akan muncul setelah:
        // 1. Deploy ke VPS
        // 2. Setup Google Analytics atau tracking lainnya
        // Untuk sekarang, semua 0 karena belum publish
        setStats({
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
            total: 0,
        });
    }, []);

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
                <h1 className={styles.mobileTitle}>Total Pengunjung</h1>
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
                        className={`${styles.menuItem} ${activeMenu === "konten" ? styles.menuItemActive : ""}`}
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
                    <h2 className={styles.pageTitle}>Total Pengunjung</h2>
                    <p className={styles.pageSubtitle}>
                        Statistik pengunjung website Anda
                    </p>
                </div>

                <section className={styles.cardsGrid}>
                    <article className={styles.card}>
                        <h3 className={styles.cardTitle}>Hari Ini</h3>
                        <div style={{ fontSize: "48px", fontWeight: "bold", color: "#0ea5e9", marginTop: "20px" }}>
                            {stats.today}
                        </div>
                        <p style={{ color: "#64748b", marginTop: "10px" }}>pengunjung</p>
                    </article>

                    <article className={styles.card}>
                        <h3 className={styles.cardTitle}>Minggu Ini</h3>
                        <div style={{ fontSize: "48px", fontWeight: "bold", color: "#8b5cf6", marginTop: "20px" }}>
                            {stats.thisWeek}
                        </div>
                        <p style={{ color: "#64748b", marginTop: "10px" }}>pengunjung</p>
                    </article>

                    <article className={styles.card}>
                        <h3 className={styles.cardTitle}>Bulan Ini</h3>
                        <div style={{ fontSize: "48px", fontWeight: "bold", color: "#f59e0b", marginTop: "20px" }}>
                            {stats.thisMonth}
                        </div>
                        <p style={{ color: "#64748b", marginTop: "10px" }}>pengunjung</p>
                    </article>

                    <article className={styles.card}>
                        <h3 className={styles.cardTitle}>Total Keseluruhan</h3>
                        <div style={{ fontSize: "48px", fontWeight: "bold", color: "#10b981", marginTop: "20px" }}>
                            {stats.total}
                        </div>
                        <p style={{ color: "#64748b", marginTop: "10px" }}>pengunjung</p>
                    </article>
                </section>


            </main>
        </div>
    );
}
