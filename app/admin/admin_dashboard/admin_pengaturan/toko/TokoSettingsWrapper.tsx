"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import layoutStyles from "../../admin_dashboard.module.css";
import styles from "./toko.module.css";

export default function TokoSettingsWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    const handleBack = () => {
        router.push("/admin/admin_dashboard");
        setSidebarOpen(false);
    };

    return (
        <div className={layoutStyles.dashboard}>
            {/* TOP BAR MOBILE/TABLET */}
            <div className={layoutStyles.mobileTopBar}>
                <button
                    type="button"
                    className={layoutStyles.mobileMenuButton}
                    onClick={() => setSidebarOpen(true)}
                >
                    =
                </button>
                <div className={layoutStyles.mobileTitle}></div>
                <div
                    className={`${styles.topRightBrand} ${darkMode ? styles.topRightBrandNight : ""
                        }`}
                >
                    APIX INTERIOR
                </div>
            </div>

            {/* OVERLAY HP/TABLET */}
            {sidebarOpen && (
                <div
                    className={layoutStyles.overlay}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside
                className={`${layoutStyles.sidebar} ${sidebarOpen ? layoutStyles.sidebarOpen : ""
                    }`}
            >
                <div className={layoutStyles.sidebarHeader}>
                    <div className={layoutStyles.brand}>
                        <div className={layoutStyles.brandLogo}>A</div>
                        <div className={layoutStyles.brandText}>
                            <span className={layoutStyles.brandTitle}>APIX INTERIOR</span>
                            <span className={layoutStyles.brandSubtitle}>
                                Admin Dashboard
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className={layoutStyles.closeSidebarButton}
                        onClick={() => setSidebarOpen(false)}
                    >
                        ×
                    </button>
                </div>

                <div className={layoutStyles.menu}>
                    <button
                        type="button"
                        className={layoutStyles.menuItem}
                        onClick={() =>
                            router.push("/admin/admin_dashboard/admin_pengaturan/hubungi")
                        }
                    >
                        Hubungi
                    </button>
                    <button
                        type="button"
                        className={layoutStyles.menuItem}
                        onClick={() =>
                            router.push("/admin/admin_dashboard/admin_pengaturan/informasi")
                        }
                    >
                        Informasi
                    </button>
                    <button
                        type="button"
                        className={layoutStyles.menuItem}
                        onClick={() =>
                            router.push(
                                "/admin/admin_dashboard/admin_pengaturan/media_sosial"
                            )
                        }
                    >
                        Media Sosial
                    </button>
                    <button
                        type="button"
                        className={`${layoutStyles.menuItem} ${layoutStyles.menuItemActive}`}
                        onClick={() =>
                            router.push("/admin/admin_dashboard/admin_pengaturan/toko")
                        }
                    >
                        Atur Toko
                    </button>
                    <button
                        type="button"
                        className={layoutStyles.menuItem}
                        onClick={() =>
                            router.push("/admin/admin_dashboard/admin_pengaturan/faq")
                        }
                    >
                        Menu FAQ & DLL
                    </button>
                </div>

                <div className={layoutStyles.themeSwitchWrapper}>
                    <span className={layoutStyles.themeLabel}>
                        Mode tombol: {darkMode ? "Malam" : "Siang"}
                    </span>
                    <button
                        type="button"
                        className={`${layoutStyles.themeSwitch} ${darkMode ? layoutStyles.themeSwitchOn : ""
                            }`}
                        onClick={() => setDarkMode((prev) => !prev)}
                    >
                        <div className={layoutStyles.themeThumb} />
                    </button>
                </div>

                <div className={layoutStyles.sidebarBackWrapper}>
                    <button
                        type="button"
                        className={layoutStyles.sidebarBackButton}
                        onClick={handleBack}
                    >
                        KEMBALI
                    </button>
                </div>

                <div className={layoutStyles.sidebarFooter} />
            </aside>

            {/* MAIN CONTENT */}
            <main
                className={`${layoutStyles.main} ${darkMode ? styles.mainNight : styles.mainDay
                    }`}
            >
                <div className={styles.desktopTopBar}>
                    <span
                        className={`${styles.desktopBrand} ${darkMode ? styles.desktopBrandNight : ""
                            }`}
                    >
                        APIX INTERIOR
                    </span>
                </div>

                {children}
            </main>
        </div>
    );
}
