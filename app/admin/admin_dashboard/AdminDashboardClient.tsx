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

  // ... imports 
  import { useState, useEffect } from "react";
  // ... imports

  // ... inside component ...
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0,
    topItem: { name: "-", views: 0 }
  });

  useEffect(() => {
    fetch('/api/admin/admin_dashboard/admin_statistik')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setStats(data);
      })
      .catch(err => console.error("Failed to fetch dashboard stats", err));
  }, []);

  // Simple CSS Chart Helper
  const maxVal = Math.max(stats.today, stats.thisWeek, stats.thisMonth, 10); // avoid div by 0

  return (
    <div
      className={`${styles.dashboard} ${isDarkMode ? styles.dashboardDark : ""
        }`}
    >
      {/* ... keeping existing sidebar & header ... */}
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
            <button
              className={`${styles.menuItem} ${activeMenu === "konten" ? styles.menuItemActive : ""
                }`}
              onClick={() => handleMenuClick("konten")}
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
          <div className={styles.logoutInlineWrapper}>
            <LogoutButton />
          </div>
        </aside>

        <main className={styles.main}>
          <div className={styles.mainHeader}>
            <h2 className={styles.pageTitle}>Ringkasan Admin</h2>
          </div>

          <section className={styles.cardsGrid} aria-label="Menu utama">
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
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <span className={styles.statLabel}>Total Pengunjung</span>
                <span className={styles.statValue} style={{ fontSize: '28px', color: '#10b981' }}>{stats.total}</span>

                {/* Mini Graph (CSS Bar) */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '40px', marginTop: '10px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '100%', background: '#d1fae5', borderRadius: '4px', height: `${(stats.today / maxVal) * 100}%`, minHeight: '4px' }}></div>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Hari Ini</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '100%', background: '#6ee7b7', borderRadius: '4px', height: `${(stats.thisWeek / maxVal) * 100}%`, minHeight: '4px' }}></div>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Minggu</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '100%', background: '#10b981', borderRadius: '4px', height: `${(stats.thisMonth / maxVal) * 100}%`, minHeight: '4px' }}></div>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Bulan</span>
                  </div>
                </div>
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
                <span className={styles.statLabel}>Top Item</span>
                <span className={styles.statValue} style={{ fontSize: '18px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {stats.topItem.name}
                </span>
                <span className={styles.statHint}>
                  Dilihat <b>{stats.topItem.views}</b> kali
                </span>
              </div>
            </div>
          </section>
        </main>
      </div>
      );
}
