
// app/components/GlobalFooter.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getHeroThemeTokens, resolveEffectiveTheme } from "@/lib/theme-utils";
import { FaLocationDot, FaWhatsapp, FaInstagram, FaFacebook } from "react-icons/fa6";

function normalizeConfig(sectionType: string, raw: unknown) {
    // Minimal normalizer for Footer only
    if (sectionType === "FOOTER") {
        const cfg = (raw && typeof raw === "object" && !Array.isArray(raw)) ? raw : {};
        return cfg as any; // simplified
    }
    return raw;
}

export default async function GlobalFooter() {
    // 1. Fetch Footer Section
    const section = await prisma.homepageSection.findFirst({
        where: { type: "FOOTER", enabled: true },
    });

    // 2. Fetch Navbar Theme (for fallback)
    const navbarSetting = await prisma.navbarSetting.findFirst();
    const navbarTheme = navbarSetting?.theme || "NAVY_GOLD";

    // 3. Fetch Global Data (Cabang, Hubungi, Media) if needed
    const cabangList = await prisma.cabangToko.findMany({ orderBy: [{ urutan: "asc" }, { id: "asc" }] });
    const hubungiList = await prisma.hubungi.findMany({ orderBy: [{ prioritas: "desc" }, { id: "asc" }] });
    const mediaListAll = await prisma.mediaSosial.findMany({ orderBy: [{ prioritas: "desc" }, { id: "asc" }] });
    const info = await prisma.informasiToko.findUnique({ where: { id: 1 } });
    const namaToko = info?.namaToko ?? "Apix Interior";

    // If no footer section enabled, return null or default?
    if (!section) return null;

    const cfg = normalizeConfig("FOOTER", section.config);
    const footerThemeKey = resolveEffectiveTheme(String(cfg.sectionTheme ?? "FOLLOW_NAVBAR"), navbarTheme);
    const colors = getHeroThemeTokens(footerThemeKey);

    return (
        <footer
            style={{
                backgroundColor: colors.bg,
                color: colors.element,
                padding: "60px 24px 40px",
            }}
        >
            <div
                style={{
                    maxWidth: 1200,
                    margin: "0 auto",
                    display: "grid",
                    gap: 40,
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                }}
            >
                {/* RIGHT: Info Stack (Vertical Compact) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 4 }}>

                    {/* 1. Address + Brand */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit" }}>

                            <span style={{
                                fontSize: "0.9rem",
                                fontWeight: 600,
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                                color: colors.element
                            }}>{namaToko}</span>
                        </Link>
                        <div style={{ display: "flex", gap: 8 }}>
                            <FaLocationDot style={{ width: 14, height: 14, marginTop: 3, opacity: 0.8, color: colors.element }} />
                            <address style={{ fontStyle: "normal", lineHeight: 1.4, opacity: 0.8, whiteSpace: "pre-line", fontSize: 12 }}>
                                {(() => {
                                    const useGlobal = (cfg as any).useGlobalContact;
                                    const manualAddr = (cfg as any).address;
                                    // Use namaCabang instead of alamat
                                    if (useGlobal) return cabangList[0]?.namaCabang || manualAddr || "Alamat belum diatur.";
                                    return manualAddr || "Alamat belum diatur.";
                                })()}
                            </address>
                        </div>
                    </div>

                    {/* 2. Menu (Vertical) */}
                    {Array.isArray((cfg as any).menuLinks) && (cfg as any).menuLinks.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <h4 style={{ fontSize: 12, fontWeight: 700, margin: 0, color: colors.element, textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.9 }}>Menu</h4>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                                {(cfg as any).menuLinks.map((link: any, idx: number) => (
                                    <li key={idx}>
                                        <a href={link.url} style={{ textDecoration: "none", color: "inherit", opacity: 0.7, fontSize: 12, fontWeight: 500 }}>{link.label}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 3. Contact (Vertical) */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <h4 style={{ fontSize: 12, fontWeight: 700, margin: 0, color: colors.element, textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.9 }}>Hubungi Kami</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {(() => {
                                const useGlobal = (cfg as any).useGlobalContact;
                                const manualWa = (cfg as any).whatsapp;
                                let waVal = manualWa;
                                if (useGlobal) waVal = (hubungiList.find((h: any) => h.prioritas)?.nomor || hubungiList[0]?.nomor || manualWa);

                                if (!waVal) return null;

                                // Auto-prepend + if starts with 62
                                let waDisplay = waVal;
                                if (waDisplay.startsWith("62")) {
                                    waDisplay = "+" + waDisplay;
                                }

                                return (
                                    <a href={`https://wa.me/${waDisplay.replace("+", "")}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit", fontSize: 12, fontWeight: 500, opacity: 0.7 }}>
                                        <FaWhatsapp style={{ width: 14, height: 14, opacity: 0.8, color: colors.element }} />
                                        <span>WhatsApp Kami</span>
                                    </a>
                                );
                            })()}

                            {(cfg as any).email && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500, opacity: 0.7 }}>
                                    <span style={{ fontSize: 14 }}>✉</span>
                                    <span>{(cfg as any).email}</span>
                                </div>
                            )}

                            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                                {/* Instagram */}
                                {(() => {
                                    const igCfg = (cfg as any).instagram;
                                    const globalIg = (mediaListAll as any[]).find((m) => m.iconKey === "instagram")?.url;
                                    const targetUrl = igCfg ? `https://instagram.com/${igCfg.replace("@", "")}` : globalIg;
                                    if (!targetUrl) return null;
                                    return <a href={targetUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", fontSize: 12, fontWeight: 600, opacity: 0.8 }}>Instagram</a>;
                                })()}
                                {/* Facebook */}
                                {(() => {
                                    const fbCfg = (cfg as any).facebook;
                                    const globalFb = (mediaListAll as any[]).find((m) => m.iconKey === "facebook")?.url;
                                    const targetUrl = fbCfg ? "#" : globalFb;
                                    if (!targetUrl && !fbCfg) return null;
                                    return <a href={targetUrl} style={{ textDecoration: "none", color: "inherit", fontSize: 12, fontWeight: 600, opacity: 0.8 }}>Facebook</a>;
                                })()}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Tag Grid (SEO Text Only) */}
            {Array.isArray((cfg as any).footerTags) && (cfg as any).footerTags.length > 0 && (
                <div style={{ maxWidth: 1200, margin: "40px auto 0", borderTop: `1px solid ${colors.divider}`, paddingTop: 30 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px 24px" }} className="responsive-footer-grid">
                        {(cfg as any).footerTags.map((tag: any, idx: number) => (
                            <span key={idx} style={{ color: "inherit", opacity: 0.6, fontSize: 12, cursor: "default" }}>
                                {tag.label}
                            </span>
                        ))}
                    </div>
                    {/* Helper style just for this component */}
                    <style dangerouslySetInnerHTML={{
                        __html: `
              @media (max-width: 768px) {
                  .responsive-footer-grid { grid-template-columns: repeat(2, 1fr) !important; }
              }
          `}} />
                </div>
            )}


            <div style={{ borderTop: `1px solid ${colors.divider}`, marginTop: 60, paddingTop: 24, textAlign: "center", fontSize: 13, opacity: 0.6 }}>
                {(cfg as any).copyright ? (cfg as any).copyright : (
                    <>&copy; {new Date().getFullYear()} Apix Interior. All rights reserved.</>
                )}
            </div>
        </footer>
    );
}
