"use client";

import { useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import styles from "./admin_dashboard.module.css";
import LogoutButton from "./LogoutButton";
import { useAdminTheme } from "./AdminThemeContext";

type MenuKey = "home" | "produk" | "galeri" | "pengaturan" | "konten" | "statistik";

export default function AdminLayoutFrame({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isDarkMode, toggleTheme } = useAdminTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Determine active menu based on pathname
    let activeMenu: MenuKey = "home";
    if (pathname.includes("/admin_produk")) activeMenu = "produk";
    else if (pathname.includes("/admin_galeri")) activeMenu = "galeri";
    else if (pathname.includes("/admin_pengaturan")) activeMenu = "pengaturan";
    else if (pathname.includes("/admin_konten")) activeMenu = "konten";
    else if (pathname.includes("/admin_statistik")) activeMenu = "statistik";

    const goHome = () => {
        setIsSidebarOpen(false);
        router.push("/admin/admin_dashboard");
    };

    const handleMenuClick = (menu: Exclude<MenuKey, "home">) => {
        setIsSidebarOpen(false);
        switch (menu) {
            case "produk": router.push("/admin/admin_dashboard/admin_produk"); break;
            case "galeri": router.push("/admin/admin_dashboard/admin_galeri"); break;
            case "pengaturan": router.push("/admin/admin_dashboard/admin_pengaturan"); break;
            case "konten": router.push("/admin/admin_dashboard/admin_konten"); break;
            case "statistik": router.push("/admin/admin_dashboard/admin_statistik"); break;
        }
    };

    // Skip sidebar for preview routes
    if (pathname.includes('/preview')) {
        return <>{children}</>;
    }

    return (
        <div className={`${styles.dashboard} ${isDarkMode ? styles.dashboardDark : ""}`}>
            {/* TOP BAR – MOBILE/TABLET */}
            <header className={styles.mobileTopBar}>
                <button
                    className={styles.mobileMenuButton}
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label="Buka menu"
                >
                    =
                </button>
                <h1 className={styles.mobileTitle}>Admin Dashboard</h1>
            </header>

            {/* OVERLAY */}
            {isSidebarOpen && (
                <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* SIDEBAR */}
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
                        onClick={() => handleMenuClick("konten")}
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
                        onClick={toggleTheme}
                        aria-label="Toggle dark mode"
                    >
                        <span className={styles.themeThumb} />
                    </button>
                </div>

                <div className={styles.logoutInlineWrapper}>
                    <LogoutButton />
                </div>
            </aside>

            {/* MAIN CONTENT WRAPPER */}
            {/* Note: We do NOT define <main> here because children typically contain <main> or the page content. 
          However, usually <main> is the page root. 
          Looking at original code, <main className={styles.main}> wraps the content.
          Since we want to preserve styles.main structure, we should wrap children in it OR return children as is if they provide their own main.
          Let's wrap it in a div that acts as the container, matching original .main styling on the right side.
          BUT, originally the .dashboard has: .sidebar AND .main as siblings.
          So here we should render children as the RIGHT side info.
          Wait, children ARE the page. The page usually contains <main>. 
          If I output <main> here, duplicate main?
          Let's see. Original: <div dashboard> <header><overlay><aside><main>...
          So children should replace <main>.
          But `page.tsx` returns <div dashboard>...
          So I need to STRIP the outer shell from `page.tsx` and return JUST the content which usually *was* inside <main>.
          So I CAN put <main className={styles.main}> here and put children inside!
      */}
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
