"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin_dashboard.module.css";
import LogoutButton from "./LogoutButton";

type MenuKey = "home" | "produk" | "galeri" | "pengaturan" | "konten" | "statistik";

export default function AdminDashboardClient() {
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuKey>("home");

  // HOME -> balik ke halaman utama dashboard
  const goHome = () => {
    setActiveMenu("home");
    setIsSidebarOpen(false);
    router.push("/admin/admin_dashboard");
  };

  // Navigasi menu utama sidebar (kecuali "home")
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
      case "konten":
        router.push("/admin/admin_dashboard/admin_konten");
        break;
      case "statistik":
        router.push("/admin/admin_dashboard/admin_statistik");
        break;
    }
  };

  // Navigasi ke halaman sub–menu (yang ada panahnya)
  const goToSubPage = (path: string) => {
    setIsSidebarOpen(false);
    router.push(path);
  };

  return (
    <div
      className={`${styles.dashboard} ${isDarkMode ? styles.dashboardDark : ""
        }`}
    >
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

      {/* OVERLAY ketika sidebar dibuka di mobile */}
      {isSidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""
          }`}
      >
        {/* HEADER SIDEBAR */}
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

        {/* MENU LIST */}
        <nav className={styles.menu}>
          {/* HOME */}
          <button
            className={`${styles.menuItem} ${activeMenu === "home" ? styles.menuItemActive : ""
              }`}
            onClick={goHome}
          >
            Home
          </button>

          {/* PRODUK */}
          <button
            className={`${styles.menuItem} ${activeMenu === "produk" ? styles.menuItemActive : ""
              }`}
            onClick={() => handleMenuClick("produk")}
          >
            Produk
          </button>

          {/* GALERI */}
          <button
            className={`${styles.menuItem} ${activeMenu === "galeri" ? styles.menuItemActive : ""
              }`}
            onClick={() => handleMenuClick("galeri")}
          >
            Galeri
          </button>

          {/* PENGATURAN */}
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
            onClick={() => handleMenuClick("konten")}
          >
            Konten
          </button>

          {/* STATISTIK */}
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

      {/* MAIN CONTENT */}
      <main className={styles.main}>
        <div className={styles.mainHeader}>
          <h2 className={styles.pageTitle}>Ringkasan Admin</h2>
        </div>

        {/* CARD MENU UTAMA */}
        <section className={styles.cardsGrid} aria-label="Menu utama">
          {/* Card Produk */}
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Produk</h3>
            <ul className={styles.cardList}>
              <li>
                <button
                  className={styles.cardLink}
                  onClick={() =>
                    goToSubPage(
                      "/admin/admin_dashboard/admin_produk/tambah_produk"
                    )
                  }
                >
                  Tambah produk
                </button>
              </li>
              <li>
                <button
                  className={styles.cardLink}
                  onClick={() =>
                    goToSubPage(
                      "/admin/admin_dashboard/admin_produk/daftar_produk"
                    )
                  }
                >
                  Daftar produk
                </button>
              </li>
              <li>
                <button
                  className={styles.cardLink}
                  onClick={() =>
                    goToSubPage(
                      "/admin/admin_dashboard/admin_produk/kategori_produk"
                    )
                  }
                >
                  Kategori produk
                </button>
              </li>
            </ul>
          </article>

          {/* Card Galeri */}
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Galeri</h3>
            <ul className={styles.cardList}>
              <li>
                <button
                  className={styles.cardLink}
                  onClick={() =>
                    goToSubPage(
                      "/admin/admin_dashboard/admin_galeri/upload_foto"
                    )
                  }
                >
                  Upload foto
                </button>
              </li>
              <li>
                <button
                  className={styles.cardLink}
                  onClick={() =>
                    goToSubPage(
                      "/admin/admin_dashboard/admin_galeri/kolase_foto"
                    )
                  }
                >
                  Kolase foto
                </button>
              </li>
            </ul>
          </article>

          {/* Card Pengaturan */}
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Pengaturan</h3>
            <ul className={styles.cardList}>
              <li>
                <button
                  className={styles.cardLink}
                  onClick={() =>
                    goToSubPage(
                      "/admin/admin_dashboard/admin_pengaturan/informasi"
                    )
                  }
                >
                  Informasi APIX Interior
                </button>
              </li>
              <li>
                <button
                  className={styles.cardLink}
                  onClick={() =>
                    goToSubPage(
                      "/admin/admin_dashboard/admin_pengaturan/media_sosial"
                    )
                  }
                >
                  Media sosial APIX Interior
                </button>
              </li>
              <li>
                <button
                  className={styles.cardLink}
                  onClick={() =>
                    goToSubPage(
                      "/admin/admin_dashboard/admin_pengaturan/hubungi"
                    )
                  }
                >
                  Hubungi
                </button>
              </li>
              {/* MENU BARU: ATUR TOKO */}
              <li>
                <button
                  className={styles.cardLink}
                  onClick={() =>
                    goToSubPage(
                      "/admin/admin_dashboard/admin_pengaturan/toko"
                    )
                  }
                >
                  Atur Toko
                </button>
              </li>
              {/* MENU PROMO PAGE */}
              <li>
                <button
                  className={styles.cardLink}
                  onClick={() =>
                    goToSubPage(
                      "/admin/admin_dashboard/admin_pengaturan/promo"
                    )
                  }
                >
                  Pengaturan Promo
                </button>
              </li>
              <li>
                <button
                  className={styles.cardLink}
                  onClick={() =>
                    goToSubPage(
                      "/admin/admin_dashboard/admin_pengaturan/faq"
                    )
                  }
                >
                  Menu FAQ & DLL
                </button>
              </li>
            </ul>
          </article>

          {/* Card Konten */}
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Konten</h3>
            <ul className={styles.cardList}>
              <li>
                <button
                  className={styles.cardLink}
                  onClick={() =>
                    goToSubPage(
                      "/admin/admin_dashboard/admin_konten/postingan"
                    )
                  }
                >
                  Postingan
                </button>
              </li>
            </ul>
          </article>
        </section>

        {/* STATISTIK */}
        <section className={styles.statsSection} aria-label="Statistik">
          <h3 className={styles.statsTitle}>Statistik</h3>
          <div className={styles.statsGrid}>
            <div
              className={styles.statCard}
              onClick={() =>
                goToSubPage(
                  "/admin/admin_dashboard/admin_statistik/total_pengunjung"
                )
              }
              role="button"
              tabIndex={0}
            >
              <span className={styles.statLabel}>Total pengunjung</span>
              <span className={styles.statValue}>0</span>
            </div>

            <div
              className={styles.statCard}
              onClick={() =>
                goToSubPage(
                  "/admin/admin_dashboard/admin_statistik/top_item"
                )
              }
              role="button"
              tabIndex={0}
            >
              <span className={styles.statLabel}>Top item</span>
              <span className={styles.statValue}>-</span>
              <span className={styles.statHint}>
                Produk paling banyak dilihat
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
