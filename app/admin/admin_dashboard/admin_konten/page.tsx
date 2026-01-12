"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../admin_dashboard.module.css";
import LogoutButton from "../LogoutButton";

export default function AdminKontenPage() {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Common Sidebar Navigation Logic
    const handleMenuClick = (path: string) => {
        router.push(path);
    };

    const menuItems = [
        { key: "home", label: "Home", path: "/admin/admin_dashboard" },
        { key: "produk", label: "Produk", path: "/admin/admin_dashboard/admin_produk" },
        { key: "galeri", label: "Galeri", path: "/admin/admin_dashboard/admin_galeri" },
        { key: "pengaturan", label: "Pengaturan", path: "/admin/admin_dashboard/admin_pengaturan" },
        { key: "konten", label: "Konten", path: "/admin/admin_dashboard/admin_konten", active: true },
        { key: "statistik", label: "Statistik", path: "/admin/admin_dashboard/admin_statistik" },
    ];

    return (
        <div className={`${styles.dashboard} ${isDarkMode ? styles.dashboardDark : ""}`}>
            {/* MOBILE TOP BAR */}
            <header className={styles.mobileTopBar}>
                <button className={styles.mobileMenuButton} onClick={() => setIsSidebarOpen(true)}>
                    =
                </button>
                <h1 className={styles.mobileTitle}>Admin Dashboard</h1>
            </header>

            {/* OVERLAY */}
            {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)} />}

            {/* SIDEBAR */}
            <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
                <div className={styles.sidebarHeader}>
                    <button className={styles.backButton} onClick={() => setIsSidebarOpen(false)}>←</button>
                    <div className={styles.brand}>
                        <span className={styles.brandLogo}>A</span>
                        <div className={styles.brandText}>
                            <span className={styles.brandTitle}>APIX Interior</span>
                            <span className={styles.brandSubtitle}>Admin Panel</span>
                        </div>
                    </div>
                </div>

                <nav className={styles.menu}>
                    {menuItems.map(item => (
                        <button
                            key={item.key}
                            className={`${styles.menuItem} ${item.active ? styles.menuItemActive : ""}`}
                            onClick={() => handleMenuClick(item.path)}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className={styles.themeSwitchWrapper}>
                    <span className={styles.themeLabel}>Mode: {isDarkMode ? "Malam" : "Siang"}</span>
                    <button className={`${styles.themeSwitch} ${isDarkMode ? styles.themeSwitchOn : ""}`} onClick={() => setIsDarkMode(!isDarkMode)}>
                        <span className={styles.themeThumb} />
                    </button>
                </div>
                <div className={styles.logoutInlineWrapper}>
                    <LogoutButton />
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className={styles.main}>
                <div className={styles.mainHeader}>
                    <h2 className={styles.pageTitle}>Konten</h2>
                    <p className={styles.pageSubtitle}>Kelola postingan blog, artikel, dan konten lainnya.</p>
                </div>

                <section className={styles.cardsGrid}>
                    <article className={styles.card}>
                        <h3 className={styles.cardTitle}>Postingan</h3>
                        <ul className={styles.cardList}>
                            <li>
                                <button className={styles.cardLink} onClick={() => router.push("/admin/admin_dashboard/admin_konten/postingan")}>
                                    Daftar Postingan
                                </button>
                            </li>
                        </ul>
                    </article>
                </section>
            </main>
        </div>
    );
}
