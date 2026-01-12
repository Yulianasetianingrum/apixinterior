"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../admin_dashboard.module.css";
import LogoutButton from "../LogoutButton";

type MenuKey = "home" | "produk" | "galeri" | "pengaturan" | "statistik";

const statistikSubMenus = [
  {
    key: "pengunjung",
    title: "Total pengunjung",
    description: "Lihat total pengunjung website (bisa sambung analytics).",
    href: "/admin/admin_dashboard/admin_statistik/total_pengunjung",
  },
  {
    key: "topItem",
    title: "Top item",
    description:
      'Barang yang paling sering diklik "hubungi sekarang".',
    href: "/admin/admin_dashboard/admin_statistik/top_item",
  },
];

export default function AdminStatistikPage() {
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuKey>("statistik");

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

  const goToSubMenu = (href: string) => {
    router.push(href);
  };

  return (
    <div
      className={`${styles.dashboard} ${isDarkMode ? styles.dashboardDark : ""
        }`}
    >
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

      {isSidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""
          }`}
      >
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
            className={`${styles.menuItem} ${activeMenu === "home" ? styles.menuItemActive : ""
              }`}
            onClick={goHome}
          >
            Home
          </button>

          <button
            className={`${styles.menuItem} ${activeMenu === "produk" ? styles.menuItemActive : ""
              }`}
            onClick={() => handleMenuClick("produk")}
          >
            Produk
          </button>

          <button
            className={`${styles.menuItem} ${activeMenu === "galeri" ? styles.menuItemActive : ""
              }`}
            onClick={() => handleMenuClick("galeri")}
          >
            Galeri
          </button>

          <button
            className={`${styles.menuItem} ${activeMenu === "pengaturan" ? styles.menuItemActive : ""
              }`}
            onClick={() => handleMenuClick("pengaturan")}
          >
            Pengaturan
          </button>

          {/* KONTEN */}
          <button
            className={`${styles.menuItem} ${activeMenu === "konten" ? styles.menuItemActive : ""
              }`}
            onClick={() => router.push("/admin/admin_dashboard/admin_konten")}
          >
            Konten
          </button>

          <button
            className={`${styles.menuItem} ${activeMenu === "statistik" ? styles.menuItemActive : ""
              }`}
            onClick={() => handleMenuClick("statistik")}
          >
            Statistik
          </button>
        </nav>

        {/* THEME SWITCH */}
        <div className={styles.themeSwitchWrapper}>
          <span className={styles.themeLabel}>
            Mode: {isDarkMode ? "Malam" : "Siang"}
          </span>
          <button
            className={`${styles.themeSwitch} ${isDarkMode ? styles.themeSwitchOn : ""
              }`}
            onClick={() => setIsDarkMode((prev) => !prev)}
            aria-label="Toggle dark mode"
          >
            <span className={styles.themeThumb} />
          </button>
        </div>

        {/* LOGOUT – tepat di bawah mode siang/malam */}
        <div className={styles.logoutInlineWrapper}>
          <LogoutButton />
        </div>


      </aside>

      {/* MAIN CONTENT – Statistik */}
      <main className={styles.main}>
        <div className={styles.mainHeader}>
          <h2 className={styles.pageTitle}>Statistik</h2>
          <p className={styles.pageSubtitle}>
            Lihat ringkasan performa dan data pengunjung.
          </p>
        </div>

        <section className={styles.cardsGrid} aria-label="Submenu statistik">
          {statistikSubMenus.map((item) => (
            <article key={item.key} className={styles.card}>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <button
                className={styles.cardLink}
                onClick={() => goToSubMenu(item.href)}
              >
                {item.description}
              </button>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
