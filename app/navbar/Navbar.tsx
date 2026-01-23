// app/navbar/Navbar.tsx
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import styles from "./navbar.module.css";
import SearchInputClient from "./SearchInput.client";
import CartBadgeClient from "./CartBadge.client";
import WishlistBadgeClient from "./WishlistBadge.client";

// Corrected paths for public/logo/
const logoBlue = "/logo/logo_apixinterior_biru.png.png";
const logoGolden = "/logo/logo_apixinterior_golden.png.png";
const logoWhite = "/logo/logo_apixinterior_putih.png.png";

// Corrected paths for public/uploads/
// Assuming search icons are in uploads based on previous successful usage, or maybe check them too.
// Let's assume standard uploads path.
const searchGold = "/uploads/search_gold.png";
const searchNavy = "/uploads/search_navy.png";
const searchWhite = "/uploads/search_white.png";

// export const dynamic = "force-dynamic";

export type NavbarTheme =
    | "NAVY_GOLD"
    | "WHITE_GOLD"
    | "NAVY_WHITE"
    | "GOLD_NAVY"
    | "GOLD_WHITE"
    | "WHITE_NAVY";

function themeToColors(theme: NavbarTheme) {
    const NAVY = "#0b1b3b";
    const GOLD = "#d4af37";
    const WHITE = "#ffffff";

    const [bg, accent] = theme.split("_") as [
        "NAVY" | "WHITE" | "GOLD",
        "GOLD" | "WHITE" | "NAVY"
    ];

    const bgColor = bg === "NAVY" ? NAVY : bg === "GOLD" ? GOLD : WHITE;
    const accentColor = accent === "NAVY" ? NAVY : accent === "GOLD" ? GOLD : WHITE;

    return { bgColor, accentColor };
}

export default async function Navbar(props: { themeOverride?: string }) {
    const [info, navbarSetting, categories] = await Promise.all([
        prisma.informasiToko.findUnique({ where: { id: 1 } }),
        prisma.navbarSetting.findUnique({ where: { id: 1 } }),
        prisma.kategoriProduk.findMany({ orderBy: { urutan: "asc" } }),
    ]);

    const namaToko = info?.namaToko ?? "Apix Interior";

    // Priority: Prop Override -> Global Setting -> Default
    let rawTheme = (props?.themeOverride as string) || (navbarSetting?.theme as string) || "NAVY_GOLD";

    // Normalize theme_1...theme_6 to explicit combo names if needed
    if (rawTheme.startsWith("theme_")) {
        const themeMap: Record<string, NavbarTheme> = {
            "theme_1": "NAVY_GOLD",
            "theme_2": "WHITE_GOLD",
            "theme_3": "NAVY_WHITE",
            "theme_4": "GOLD_NAVY",
            "theme_5": "GOLD_WHITE",
            "theme_6": "WHITE_NAVY",
        };
        rawTheme = themeMap[rawTheme] || "NAVY_GOLD";
    }

    const navbarTheme = rawTheme as NavbarTheme;


    const themeClass =
        navbarTheme === "NAVY_GOLD"
            ? styles.navbarNavyGold
            : navbarTheme === "WHITE_GOLD"
                ? styles.navbarWhiteGold
                : navbarTheme === "NAVY_WHITE"
                    ? styles.navbarNavyWhite
                    : navbarTheme === "GOLD_NAVY"
                        ? styles.navbarGoldNavy
                        : navbarTheme === "GOLD_WHITE"
                            ? styles.navbarGoldWhite
                            : styles.navbarWhiteNavy;

    // mapping aset per tema (ikon & logo ikut warna accent)
    let searchIconSrc: any = searchGold;
    let logoSrc: any = logoGolden;

    switch (navbarTheme) {
        case "NAVY_GOLD":
            searchIconSrc = searchGold;
            logoSrc = logoGolden;
            break;

        case "WHITE_GOLD":
            searchIconSrc = searchGold;
            logoSrc = logoGolden;
            break;

        case "NAVY_WHITE":
            searchIconSrc = searchWhite;
            logoSrc = logoWhite;
            break;

        case "GOLD_NAVY":
            searchIconSrc = searchNavy;
            logoSrc = logoBlue;
            break;

        case "GOLD_WHITE":
            searchIconSrc = searchWhite;
            logoSrc = logoWhite;
            break;

        case "WHITE_NAVY":
            searchIconSrc = searchNavy;
            logoSrc = logoBlue;
            break;

        default:
            searchIconSrc = searchGold;
            logoSrc = logoGolden;
    }

    // Chart Icon Logic based on Theme (matching the "=" color logic which follows accent/text color usually)
    // The user said: "warnanya ikutin warna '='"
    // The "=" color is determined by the class `apixSidebarButton` which inherits color from parent or specific CSS.
    // In `navbar.module.css`, we can assume the text color is the 'accent' or contrasting color.
    // We need to map theme -> chart icon color.

    // NAVY_GOLD -> text is GOLD -> chart_yellow (gold)
    // WHITE_GOLD -> text is GOLD -> chart_yellow (gold)
    // NAVY_WHITE -> text is WHITE -> chart_white
    // GOLD_NAVY -> text is NAVY -> chart_navy
    // GOLD_WHITE -> text is WHITE -> chart_white
    // WHITE_NAVY -> text is NAVY -> chart_navy

    let chartIconUrl = "/uploads/chart_yellow.png"; // Default Gold

    switch (navbarTheme) {
        case "NAVY_GOLD":
        case "WHITE_GOLD":
            chartIconUrl = "/uploads/chart_yellow.png";
            break;
        case "NAVY_WHITE":
        case "GOLD_WHITE":
            chartIconUrl = "/uploads/chart_white.png";
            break;
        case "GOLD_NAVY":
        case "WHITE_NAVY":
            chartIconUrl = "/uploads/chart_navy.png";
            break;
        default:
            chartIconUrl = "/uploads/chart_yellow.png";
    }

    const { bgColor, accentColor } = themeToColors(navbarTheme);

    let chartColor = "#d4af37"; // default gold
    if (chartIconUrl.includes("white")) chartColor = "#ffffff";
    if (chartIconUrl.includes("navy")) chartColor = "#0b1b3b";

    return (
        <header className={styles.apixHeader}>
            <input
                type="checkbox"
                id="apix-sidebar-toggle"
                className={styles.apixSidebarToggle}
            />

            <div
                className={`${styles.apixNavbar} ${themeClass}`}
                style={
                    {
                        backgroundColor: bgColor,
                        ["--apix-navbar-accent" as any]: accentColor,
                    } as any
                }
            >
                <div className={styles.apixNavbarLeft}>
                    <Link href="/" className={styles.apixLogoWrapper}>
                        <div className={styles.apixLogoImage}>
                            <Image
                                src={logoSrc}
                                alt={namaToko}
                                fill
                                sizes="120px"
                                priority={true}
                                className={styles.apixLogoImg}
                            />
                        </div>
                        <span className={styles.apixLogoText}>{namaToko}</span>
                    </Link>
                </div>

                <div className={styles.apixNavbarCenter}>
                    <SearchInputClient searchIconSrc={searchIconSrc} />
                </div>

                <div className={styles.apixNavbarRight}>
                    {/* Wishlist Icon */}
                    <WishlistBadgeClient themeColor={chartColor} />

                    {/* Cart Icon */}
                    <CartBadgeClient iconUrl={chartIconUrl} />

                    <label
                        htmlFor="apix-sidebar-toggle"
                        className={styles.apixSidebarButton}
                    >
                        =
                    </label>
                </div>
            </div>

            <label
                htmlFor="apix-sidebar-toggle"
                className={styles.apixSidebarBackdrop}
            />

            <aside className={styles.apixSidebar}>
                <nav className={styles.apixSidebarNav}>
                    <div className={styles.apixSidebarHeader}>
                        <h2 className={styles.apixSidebarTitle}>Menu</h2>
                        <label
                            htmlFor="apix-sidebar-toggle"
                            className={styles.apixSidebarCloseButton}
                        >
                            ×
                        </label>
                    </div>

                    <ul>
                        <li>
                            <Link href="/" className={styles.apixSidebarLink}>
                                Beranda
                            </Link>
                        </li>
                        <li>
                            <Link href="/produk" className={styles.apixSidebarLink}>
                                Produk
                            </Link>
                        </li>
                        <li>
                            <Link href="/kategori" className={styles.apixSidebarLink}>
                                Semua Kategori
                            </Link>
                        </li>



                        <li style={{ marginTop: "1rem" }}>
                            <Link href="/portofolio" className={styles.apixSidebarLink}>
                                Portofolio
                            </Link>
                        </li>
                        <li>
                            <Link href="/artikel" className={styles.apixSidebarLink}>
                                Postingan
                            </Link>
                        </li>
                        <li>
                            <Link href="/hubungi" className={styles.apixSidebarLink}>
                                Hubungi
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>
        </header>
    );
}
