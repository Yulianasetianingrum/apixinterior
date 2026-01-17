"use client";

import { useState } from "react";
import styles from "./toko.module.css";
import FooterGeneralConfig from "./FooterGeneralConfig";
import FooterLinksEditor from "./FooterLinksEditor";
import FooterTagsEditor from "./FooterTagsEditor";

export default function FooterEditorWrapper({ config }: { config: any }) {
    // State for all fields
    const [useGlobalContact, setUseGlobalContact] = useState(!!config.useGlobalContact);
    const [useGlobalSocial, setUseGlobalSocial] = useState(!!config.useGlobalSocial);
    const [whatsapp, setWhatsapp] = useState(config.whatsapp ?? "");
    const [address, setAddress] = useState(config.address ?? "");
    const [email, setEmail] = useState(config.email ?? "");
    const [instagram, setInstagram] = useState(config.instagram ?? "");
    const [facebook, setFacebook] = useState(config.facebook ?? "");
    const [copyright, setCopyright] = useState(config.copyright ?? "");

    // JSON fields
    const [menuLinks, setMenuLinks] = useState<any[]>(config.menuLinks || []);
    const [footerTags, setFooterTags] = useState<any[]>(config.footerTags || []);

    const handleAutoGenerate = async () => {
        if (!confirm("Auto Generate akan mengisi/menimpa data konfigurasi footer (kecuali Email). Lanjutkan?")) return;

        // 1. Enable Globals
        setUseGlobalContact(true);
        setUseGlobalSocial(true);

        // 2. Fill Menu Links (From Dynamic Pages + Contact)
        try {
            const res = await fetch("/api/admin/admin_dashboard/admin_pengaturan/faq");
            const data = await res.json();
            const dynamicPages = data.pages || [];

            const generatedLinks = dynamicPages.map((p: any) => ({
                label: p.title,
                url: p.slug.startsWith("/") ? p.slug : `/${p.slug}`
            }));

            // Append standard Contact link
            generatedLinks.push({ label: "Hubungi Kami", url: "/hubungi" });

            setMenuLinks(generatedLinks);
        } catch (e) {
            console.error("Failed to fetch dynamic pages for auto-generate", e);
            // Fallback
            setMenuLinks([
                { label: "Hubungi Kami", url: "/hubungi" }
            ]);
        }

        // 3. Fill Tags (Smart Random SEO Generator)
        const products = [
            "Sofa", "Meja Makan", "Kursi Kantor", "Lemari Pakaian", "Tempat Tidur",
            "Rak Sepatu", "Meja TV", "Kitchen Set", "Sofa Bed", "Kursi Teras",
            "Meja Belajar", "Lemari Hias", "Dipan", "Kasur", "Partisi", "Backdrop TV"
        ];
        const scopes = ["Interior", "Furniture", "Mebel", "Furnitur"];
        const adjectives = ["Minimalis", "Modern", "Mewah", "Murah", "Terbaru", "Kayu Jati", "Estetik"];
        const prefixes = ["Jual", "Toko", "Agen", "Pusat", "Distributor"];

        // Helper: pick random
        const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
        const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5);

        // Generate combinations
        let smartTags: string[] = [];

        // A. Product + Adjective (e.g., Sofa Minimalis) - Core
        products.forEach(p => {
            if (Math.random() > 0.3) smartTags.push(`${p} ${pick(adjectives)}`);
            else smartTags.push(p); // standalone sometimes
        });

        // B. Product + Scope (e.g., Meja Makan Furniture) - Context
        products.slice(0, 15).forEach(p => {
            smartTags.push(`${p} ${pick(scopes)}`);
        });

        // C. Prefix + Product (e.g., Jual Lemari Pakaian) - Intent
        products.slice(0, 10).forEach(p => {
            smartTags.push(`${pick(prefixes)} ${p}`);
        });

        // D. Scope + Adjective (e.g., Furniture Minimalis) - Broad
        scopes.forEach(s => {
            smartTags.push(`${s} ${pick(adjectives)}`);
        });

        // E. Long Tail Specifics (Randomized) - Niche
        const specific = [
            "Toko Mebel Terdekat", "Interior Design Jakarta", "Jasa Interior Rumah",
            "Mebel Kayu Jepara", "Furniture Kantor Murah", "Paket Seserahan Furniture"
        ];
        smartTags.push(...specific);

        // Deduplicate & Shuffle & Limit to ~50
        smartTags = Array.from(new Set(smartTags));
        smartTags = shuffle(smartTags).slice(0, 48);

        setFooterTags(smartTags.map(label => ({
            label,
            url: "" // User requested no links, just text for SEO
        })));

        // 4. Default Copyright
        setCopyright(`© ${new Date().getFullYear()} Apix Interior. All rights reserved.`);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Hidden inputs to submit with the parent form */}
            <input type="hidden" name="useGlobalContact" value={useGlobalContact ? "1" : "0"} />
            <input type="hidden" name="useGlobalSocial" value={useGlobalSocial ? "1" : "0"} />
            <input type="hidden" name="whatsapp" value={whatsapp} />
            <input type="hidden" name="address" value={address} />
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="instagram" value={instagram} />
            <input type="hidden" name="facebook" value={facebook} />
            <input type="hidden" name="copyright" value={copyright} />
            <input type="hidden" name="menuLinks" value={JSON.stringify(menuLinks)} />
            <input type="hidden" name="footerTags" value={JSON.stringify(footerTags)} />

            {/* MASTER AUTO GENERATE BUTTON */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: -10 }}>
                <button
                    type="button"
                    onClick={handleAutoGenerate}
                    style={{
                        background: "linear-gradient(to right, #d4af37, #f5c042)",
                        color: "#0f172a",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: 6,
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)",
                        display: "flex", alignItems: "center", gap: 6,
                        fontSize: 13
                    }}
                >
                    <span>✨ Auto Generate All</span>
                </button>
            </div>

            {/* General Config */}
            <FooterGeneralConfig
                useGlobalContact={useGlobalContact} setUseGlobalContact={setUseGlobalContact}
                useGlobalSocial={useGlobalSocial} setUseGlobalSocial={setUseGlobalSocial}
                whatsapp={whatsapp} setWhatsapp={setWhatsapp}
                address={address} setAddress={setAddress}
                email={email} setEmail={setEmail}
                instagram={instagram} setInstagram={setInstagram}
                facebook={facebook} setFacebook={setFacebook}
                copyright={copyright} setCopyright={setCopyright}
            />

            {/* Menu Links */}
            <FooterLinksEditor
                links={menuLinks}
                onChange={setMenuLinks}
            />

            {/* Footer Tags */}
            <FooterTagsEditor
                tags={footerTags}
                onChange={setFooterTags}
            />
        </div>
    );
}
