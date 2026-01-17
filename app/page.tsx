
import { prisma } from "@/lib/prisma";


import Navbar from "./navbar/Navbar";
import styles from "./page.module.css";
import SecureImage from "@/app/components/SecureImage";
import { CategoryGridPreview } from "./admin/admin_dashboard/admin_pengaturan/toko/preview/CategoryGridPreview";
import CategoryCommerceColumns from "./components/homepage/CategoryCommerceColumns.client";
import { SocialIcon } from "@/app/components/homepage/social-icons";
import {
  normalizeConfig, upperType, resolveEffectiveTheme,
  getHeroThemeTokens, commerceThemeTokens, heroThemeClassFromConfig,
  buildCategoryGridProps, buildCategoryCommerceGridProps,
  categoryGridVarsFromTheme, parseThemePair, colorForToken,
  resolveCustomPromoPalette, parseCustomPromoBgTheme, getFooterIconPath,
  pickFirstGalleryImageId, formatRupiah, computeHargaSetelahPromo,
  normalizeExternalUrl, resolveGoogleMapsEmbed, resolveGoogleMapsNavigation,
  MAX_CUSTOM_PROMO_VOUCHERS, FALLBACK_CATEGORY_IMAGE_URL,
  type SectionRow, type CategoryGridItem, type CategoryCommerceItem
} from "./page.helpers";
import Link from "next/link";
import Image from "next/image";
import { type CSSProperties } from "react";
import { OrganizationSchema, WebSiteSchema, LocalBusinessSchema } from "./components/seo/StructuredData";

export const dynamic = "force-dynamic";

import {
  themeMetaSlug,
  isThemeMetaRow,
  getThemeKeyFromConfig,
  normalizeThemeKey,
  DEFAULT_THEME_KEY,
  THEME_META_SLUG_PREFIX
} from "./admin/admin_dashboard/admin_pengaturan/toko/toko-utils";

async function fetchThemeData(themeKey: string, isPublished: boolean) {
  // DEBUG LOG

  // Fetch sections from appropriate table
  const rawSections = isPublished
    ? await prisma.homepageSectionPublished.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] })
    : await prisma.homepageSectionDraft.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });



  // Filter sections for this specific theme
  const sections: SectionRow[] = rawSections
    .filter((d: any) => {
      const isMeta = isThemeMetaRow(d);
      const tk = getThemeKeyFromConfig(d?.config);
      const matches = tk === themeKey;
      const isEnabled = d.enabled === true;

      // LOG EACH ROW FOR DEBUGGING
      if (matches || isMeta) {

      }

      return !isMeta && matches && isEnabled;
    })
    .map((d: any) => ({
      id: Number(d.id),
      type: String(d.type),
      title: d.title ?? null,
      slug: d.slug ?? null,
      enabled: Boolean(d.enabled),
      sortOrder: Number(d.sortOrder ?? 0),
      config: normalizeConfig(String(d.type), d.config),
    }));



  // ===== Collect IDs to prefetch related data =====
  const kategoriIds: number[] = [];
  const autoCoverKategoriIds: number[] = [];
  const imageIds: number[] = [];
  const produkIds: number[] = [];
  const branchIds: number[] = [];
  const hubungiIds: number[] = [];
  const mediaIconKeys: string[] = [];
  let needsProductListing = false;

  const categoryGridById = new Map<number, { items: CategoryGridItem[]; columns: number; maxItems?: number }>();
  const categoryCommerceById = new Map<number, { items: CategoryCommerceItem[]; columns: number; maxItems?: number }>();

  // Synced from admin/preview/page.tsx to ensure consistency
  for (const s of sections) {
    if (s.type === "CATEGORY_GRID") {
      const cfg = s.config as any;
      const items: CategoryGridItem[] = Array.isArray(cfg.items) ? cfg.items : [];
      const layout = cfg.layout || {};
      categoryGridById.set(s.id, { items, columns: Number(layout.columns ?? 3), maxItems: layout.maxItems });

      for (const it of items) {
        if (it?.kategoriId) {
          kategoriIds.push(Number(it.kategoriId));
          const cid = Number(it.coverImageId);
          if (Number.isFinite(cid) && cid > 0) {
            imageIds.push(cid);
          } else {
            autoCoverKategoriIds.push(Number(it.kategoriId));
          }
        }
      }
    }

    if (s.type === "CATEGORY_GRID_COMMERCE") {
      const cfg = s.config as any;
      const items: CategoryCommerceItem[] = Array.isArray(cfg.items) ? cfg.items : [];
      categoryCommerceById.set(s.id, { items, columns: Number(cfg.layout?.columns ?? 4), maxItems: cfg.layout?.maxItems });

      for (const it of items) {
        // Handle both 'custom' (explicit image) and 'category' types
        if (it.type === "custom") {
          const iid = Number(it.imageId);
          if (Number.isFinite(iid) && iid > 0) imageIds.push(iid);
        } else {
          if (it.kategoriId) kategoriIds.push(Number(it.kategoriId));
          const iid = Number(it.imageId);
          if (Number.isFinite(iid) && iid > 0) {
            imageIds.push(iid);
          } else if (it.kategoriId) {
            autoCoverKategoriIds.push(Number(it.kategoriId));
          }
        }
      }
    }

    if (s.type === "PRODUCT_CAROUSEL") {
      const cfg = s.config as any;
      if (Array.isArray(cfg.productIds)) {
        cfg.productIds.forEach((id: any) => produkIds.push(Number(id)));
      }
    }

    if (s.type === "PRODUCT_LISTING") {
      const cfg = s.config as any;
      if (Array.isArray(cfg.productIds)) {
        cfg.productIds.forEach((id: any) => produkIds.push(Number(id)));
      }
      needsProductListing = true;
    }

    if (s.type === "HIGHLIGHT_COLLECTION") {
      const cfg = s.config as any;
      const heroImageId = Number(cfg.heroImageId);
      if (Number.isFinite(heroImageId) && heroImageId > 0) {
        imageIds.push(heroImageId);
      }
      if (Array.isArray(cfg.productIds)) {
        cfg.productIds.forEach((id: any) => produkIds.push(Number(id)));
      }
    }

    if (s.type === "HERO") {
      const cfg = s.config as any;
      const iid = Number(cfg.imageId);
      if (Number.isFinite(iid) && iid > 0) imageIds.push(iid);
    }

    if (s.type === "BRANCHES") {
      const cfg = s.config as any;
      if (Array.isArray(cfg.branchIds)) cfg.branchIds.forEach((id: any) => branchIds.push(Number(id)));
    }

    if (s.type === "CONTACT") {
      const cfg = s.config as any;
      if (Array.isArray(cfg.hubungiIds)) cfg.hubungiIds.forEach((id: any) => hubungiIds.push(Number(id)));
      const showImage = Boolean(cfg.showImage);
      const imageId = Number(cfg.imageId);
      if (showImage && Number.isFinite(imageId) && imageId > 0) {
        imageIds.push(imageId);
      }
    }

    if (s.type === "SOCIAL") {
      const cfg = s.config as any;
      if (Array.isArray(cfg.iconKeys)) mediaIconKeys.push(...cfg.iconKeys);
    }

    if (s.type === "CUSTOM_PROMO") {
      const cfg = s.config as any;
      const links = cfg.voucherLinks || {};
      if (Array.isArray(cfg.voucherImageIds)) {
        cfg.voucherImageIds.forEach((id: any) => {
          imageIds.push(Number(id));
          // Robust collection: Check link for this specific voucher ID
          const val = links[id];
          if (typeof val === "string" && val.startsWith("category:")) {
            const cid = Number(val.split(":")[1]);
            if (Number.isFinite(cid) && cid > 0) kategoriIds.push(cid);
          }
        });
      }
      // Also check Object.values just in case there are orphan links we want to preserve or alternate structure
      if (cfg.voucherLinks) {
        Object.values(cfg.voucherLinks).forEach((val: any) => {
          if (typeof val === "string" && val.startsWith("category:")) {
            const cid = Number(val.split(":")[1]);
            if (Number.isFinite(cid) && cid > 0) kategoriIds.push(cid);
          }
        });
      }
    }

    if (s.type === "ROOM_CATEGORY") {
      const cfg = s.config as any;
      if (Array.isArray(cfg.cards)) {
        cfg.cards.forEach((c: any) => {
          if (c.kategoriId) {
            kategoriIds.push(Number(c.kategoriId));
            if (!c.imageId) autoCoverKategoriIds.push(Number(c.kategoriId));
            // FIXED: Also check imageId for Room Category when kategoriId is present but user overrode the image
            if (c.imageId) imageIds.push(Number(c.imageId));
          } else if (c.imageId) {
            // Case: No category, just image
            imageIds.push(Number(c.imageId));
          }
        });
      }
    }
  }

  // Deduplicate
  const uniqKategoriIds = Array.from(new Set(kategoriIds)).filter((n) => n > 0);
  const uniqAutoCoverIds = Array.from(new Set(autoCoverKategoriIds)).filter((n) => n > 0);
  const uniqImageIds = Array.from(new Set(imageIds)).filter((n) => n > 0);
  const uniqProdukIds = Array.from(new Set(produkIds)).filter((n) => n > 0);
  const uniqBranchIds = Array.from(new Set(branchIds)).filter((n) => n > 0);
  const uniqHubungiIds = Array.from(new Set(hubungiIds)).filter((n) => n > 0);
  const uniqMediaIconKeys = Array.from(new Set(mediaIconKeys));

  // Batch Fetch
  const kategoriMap = new Map<number, any>();
  if (uniqKategoriIds.length) {
    const rows = await prisma.kategoriProduk.findMany({ where: { id: { in: uniqKategoriIds } }, select: { id: true, nama: true, slug: true } });
    rows.forEach((r: any) => kategoriMap.set(Number(r.id), r));
  }

  const imageMap = new Map<number, any>();
  if (uniqImageIds.length) {
    const rows = await prisma.gambarUpload.findMany({ where: { id: { in: uniqImageIds } }, select: { id: true, url: true } });
    rows.forEach((r: any) => imageMap.set(Number(r.id), r));
  }

  const autoCoverUrlByKategori = new Map<number, string>();
  if (uniqAutoCoverIds.length) {
    // Logic: fetch 1 latest product image for each category for default cover
    // Use KategoriProdukItem to match Preview's logic (Pivot table)
    const items = await prisma.kategoriProdukItem.findMany({
      where: { kategoriId: { in: uniqAutoCoverIds } },
      orderBy: [{ urutan: "asc" }, { id: "asc" }],
      select: { kategoriId: true, produkId: true },
    });

    // Pick first product for each category
    const firstProdukIdByKategori = new Map<number, number>();
    items.forEach((it: any) => {
      const kId = Number(it.kategoriId);
      if (!firstProdukIdByKategori.has(kId) && it.produkId) {
        firstProdukIdByKategori.set(kId, Number(it.produkId));
      }
    });

    const productIds = Array.from(firstProdukIdByKategori.values());

    if (productIds.length > 0) {
      const products = await prisma.produk.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          mainImageId: true,
          galeri: { select: { gambarId: true } },
        },
      });

      const prodMap = new Map<number, any>();
      products.forEach((p: any) => {
        // Map gallery
        if (Array.isArray(p.galeri)) {
          p.galleryImageIds = p.galeri.map((g: any) => g.gambarId).filter(Boolean);
        }
        prodMap.set(Number(p.id), p);
      });

      const coverImageIds = new Set<number>();
      firstProdukIdByKategori.forEach((pid: number) => {
        const p = prodMap.get(pid);
        if (p) {
          const mainId = p.mainImageId ? Number(p.mainImageId) : null;
          const gId = pickFirstGalleryImageId(p.galleryImageIds || []);
          const chosen = mainId || gId;
          if (chosen) coverImageIds.add(chosen);
        }
      });

      if (coverImageIds.size > 0) {
        const matchingImages = await prisma.gambarUpload.findMany({ where: { id: { in: Array.from(coverImageIds) } }, select: { id: true, url: true } });
        const imgUrlMap = new Map<number, string>();
        matchingImages.forEach((m: any) => imgUrlMap.set(Number(m.id), String(m.url)));

        firstProdukIdByKategori.forEach((pid: number, kid: number) => {
          const p = prodMap.get(pid);
          if (p) {
            const mainId = p.mainImageId ? Number(p.mainImageId) : null;
            const gId = pickFirstGalleryImageId(p.galleryImageIds || []);
            const chosen = mainId || gId;
            const url = chosen ? imgUrlMap.get(chosen) : null;
            if (url) autoCoverUrlByKategori.set(kid, url);
          }
        });
      }
    }
  }

  const produkById = new Map<number, any>();
  if (uniqProdukIds.length) {
    const rows = await prisma.produk.findMany({
      where: { id: { in: uniqProdukIds } },
      include: { galeri: true },
    });
    rows.forEach((r: any) => {
      // Manual mapping: galeri relation -> galleryImageIds array
      if (Array.isArray(r.galeri)) {
        r.galleryImageIds = r.galeri.map((g: any) => g.gambarId).filter(Boolean);
      }
      produkById.set(Number(r.id), r);
    });

    // Fix: Explicitly fetch mainImageId for these products if not already in imageIds
    const extraImageIds = new Set<number>();
    rows.forEach((r: any) => {
      if (r.mainImageId) {
        extraImageIds.add(Number(r.mainImageId));
      } else if (r.galleryImageIds) {
        // Fallback to first gallery image if main irrelevant
        const gid = pickFirstGalleryImageId(r.galleryImageIds);
        if (gid) extraImageIds.add(gid);
      }
    });

    // DEBUG LOG
    const debugPid = rows[0]?.id;
    const debugP = produkById.get(Number(debugPid));

    const missing = Array.from(extraImageIds).filter(id => !imageMap.has(id));
    if (missing.length) {
      const extra = await prisma.gambarUpload.findMany({ where: { id: { in: missing } }, select: { id: true, url: true } });
      extra.forEach((m: any) => imageMap.set(Number(m.id), { url: String(m.url) }));
    }
  }

  let productListingItems: any[] = [];
  if (needsProductListing) {
    // Default 12 latest products
    const rows = await prisma.produk.findMany({
      take: 12, orderBy: { createdAt: 'desc' },
      include: { galeri: true },
    });
    // Map galeri for listing items
    rows.forEach((r: any) => {
      if (Array.isArray(r.galeri)) {
        r.galleryImageIds = r.galeri.map((g: any) => g.gambarId).filter(Boolean);
      }
    });
    productListingItems = rows;
    // Also add images to imageMap if missing? (Not needed if we use product.mainImageId lookup and fetch implicitly? No, we must support rendering)
    // Actually preview logic doesn't fetch listing images implicitly. 
    // Wait, preview logic line 2255: `const imgUrl = pickedId ? imageMap.get(Number(pickedId))?.url ?? null : null;`
    // So if imageId is NOT in imageMap, it won't render. 
    // We SHOULD fetch images for productListingItems.
    // Let's add them to imageMap now.
    const listingImageIds = new Set<number>();
    productListingItems.forEach((p: any) => {
      if (p.mainImageId) listingImageIds.add(Number(p.mainImageId));
      if (p.galleryImageIds) pickFirstGalleryImageId(p.galleryImageIds) && listingImageIds.add(Number(pickFirstGalleryImageId(p.galleryImageIds)!));
    });
    const missingIds = Array.from(listingImageIds).filter(id => !imageMap.has(id));
    if (missingIds.length) {
      const extraImages = await prisma.gambarUpload.findMany({ where: { id: { in: missingIds } }, select: { id: true, url: true } });
      extraImages.forEach((m: any) => imageMap.set(Number(m.id), { url: String(m.url) }));
    }
  }

  const cabangMap = new Map<number, any>();
  if (uniqBranchIds.length) {
    const rows = await prisma.cabangToko.findMany({ where: { id: { in: uniqBranchIds } } });
    rows.forEach((r: any) => cabangMap.set(Number(r.id), r));
  } else {
    // Fetch all for global usage anyway? preview does
    const rows = await prisma.cabangToko.findMany({});
    rows.forEach((r: any) => cabangMap.set(Number(r.id), r));
  }

  const hubungiById = new Map<number, any>();
  if (uniqHubungiIds.length) {
    const rows = await prisma.hubungi.findMany({ where: { id: { in: uniqHubungiIds } }, orderBy: { id: "asc" } });
    rows.forEach((r: any) => hubungiById.set(Number(r.id), r));
  } else {
    const rows = await prisma.hubungi.findMany({ orderBy: { id: "asc" } });
    rows.forEach((r: any) => hubungiById.set(Number(r.id), r));
  }

  const mediaSosialByKey = new Map<string, any>();
  if (uniqMediaIconKeys.length) {
    const rows = await prisma.mediaSosial.findMany({ where: { iconKey: { in: uniqMediaIconKeys } }, orderBy: [{ prioritas: "desc" }, { id: "asc" }] });
    rows.forEach((r: any) => r.iconKey && mediaSosialByKey.set(String(r.iconKey), r));
  } else {
    const rows = await prisma.mediaSosial.findMany({ orderBy: [{ prioritas: "desc" }, { id: "asc" }] });
    rows.forEach((r: any) => r.iconKey && mediaSosialByKey.set(String(r.iconKey), r));
  }

  // Get theme meta for this specific theme
  const metaSlug = themeMetaSlug(themeKey);
  const themeMetaRow = rawSections.find((d: any) => String(d?.slug ?? "") === metaSlug);
  const themeMetaCfg = (themeMetaRow?.config ?? {}) as any;

  const navbarTheme = themeMetaCfg.navbarTheme || "NAVY_GOLD";
  const backgroundTheme = themeMetaCfg.backgroundTheme || "FOLLOW_NAVBAR";

  return {
    sections,
    navbarTheme,
    backgroundTheme,
    categoryGridById,
    categoryCommerceById,
    kategoriMap,
    imageMap,
    autoCoverUrlByKategori,
    produkMap: produkById,
    productListingItems,
    cabangMap,
    hubungiById,
    mediaSosialByKey,
    rawRowsInfo: rawSections.map((r: any) => ({ id: r.id, type: r.type, title: r.title, theme: getThemeKeyFromConfig(r?.config) }))
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const requestedThemeKey = Array.isArray(resolvedParams.theme)
    ? resolvedParams.theme[0]
    : (resolvedParams.theme ?? "");

  // If no theme in URL, read the active theme from database (last published theme)
  let themeKey: string | null = null;
  if (requestedThemeKey) {
    themeKey = normalizeThemeKey(requestedThemeKey);

  } else {
    // Read active theme from __active_theme__ meta row
    const activeThemeMeta = await prisma.homepageSectionDraft.findFirst({
      where: { slug: "__active_theme__" },
    });


    const activeThemeConfig = (activeThemeMeta?.config ?? {}) as any;
    const savedThemeKey = activeThemeConfig.activeThemeKey;


    if (savedThemeKey) {
      themeKey = normalizeThemeKey(savedThemeKey);

    } else {
      // NO active theme - homepage should be EMPTY

      themeKey = null;
    }
  }

  // If no theme key, show empty homepage (no navbar, nothing published)
  if (!themeKey) {
    return (
      <main style={{ minHeight: "100vh", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <h2 style={{ fontSize: 24, color: "#333", marginBottom: 10 }}>Homepage Kosong</h2>
          <p style={{ fontSize: 16, color: "#666" }}>Belum ada konten yang dipublikasikan.</p>
        </div>
      </main>
    );
  }

  const isPublished = !requestedThemeKey;

  const {
    sections,
    navbarTheme,
    backgroundTheme,
    categoryGridById,
    categoryCommerceById,
    kategoriMap,
    imageMap,
    autoCoverUrlByKategori,
    produkMap,
    productListingItems,
    cabangMap,
    hubungiById: hubungiMap,
    mediaSosialByKey,
    rawRowsInfo,
  } = await fetchThemeData(themeKey, isPublished);

  // Resolve Global Theme for the Page Background & Text
  // If backgroundTheme is explicitly set (e.g. GOLD_NAVY), use it.
  // Otherwise fallback to "FOLLOW_NAVBAR" which usually means WHITE/NAVY defaults or follows navbar.
  // We use the same helper as preview:
  const pageThemeAttr = resolveEffectiveTheme(backgroundTheme, navbarTheme);
  const themeTokens = getHeroThemeTokens(pageThemeAttr);

  // DEBUG: Log theme values


  // Resolve Phone from Hubungi Data (Dynamic)
  const contacts = Array.from(hubungiMap.values());
  const primaryContact = contacts.find((c: any) => c.nomor && String(c.nomor).length > 5);
  // Format phone to E.164 if possible, or just use as is if it's mostly numeric
  const schemaPhone = primaryContact ? String(primaryContact.nomor).replace(/[^\d+]/g, "") : "";

  return (
    <div style={{ position: "relative" }}>
      {/* SEO Structured Data */}
      <OrganizationSchema
        name="Apix Interior"
        url="https://apixinterior.com"
        description="Furniture berkualitas, mebel custom, dan jasa desain interior profesional untuk rumah, kantor, hotel, dan bangunan komersial."
        sameAs={[
          // Add your social media URLs here when available
          // "https://www.facebook.com/apixinterior",
          // "https://www.instagram.com/apixinterior",
          // "https://www.linkedin.com/company/apixinterior",
        ]}
      />
      <WebSiteSchema />
      <LocalBusinessSchema
        name="Apix Interior"
        description="Jasa Desain Interior & Furniture Custom No. 1. Spesialis Kitchen Set, Wardrobe, & Renovasi Rumah. Melayani Jakarta, Bogor, Depok, Tangerang, Bekasi."
        priceRange="$$"
        address={{
          streetAddress: "Jl. Raya Jatiasih, Jl. Swadaya Raya, Gang K24 (Sebelah Gereja HKBP), RT.001/RW.004, Jatirasa",
          addressLocality: "Jatiasih, Bekasi",
          addressRegion: "Jawa Barat",
          postalCode: "17424",
          addressCountry: "ID"
        }}
        geo={{
          latitude: -6.294167,
          longitude: 106.966111
        }}
        telephone={schemaPhone || "+6281234567890"}
        openingHours={["Mo-Su 08:00-18:00"]}
        image="/logo/logo_apixinterior_biru.png"
      />

      <Navbar themeOverride={navbarTheme} />
      <main className={`${styles.homepageMain} ${styles.pageBg}`} style={{ background: themeTokens.bg, color: themeTokens.element, minHeight: "100vh" }} data-theme={pageThemeAttr}>
        {sections.map((section) => {
          const t = upperType(section.type);

          // --- CATEGORY_GRID ---
          if (t === "CATEGORY_GRID") {
            const cfg = section.config as any;
            const data = categoryGridById.get(section.id);
            if (!data) return null;
            // Use existing data but potentially use cfg for themes if needed
            const categoryGridData = buildCategoryGridProps({
              sectionTitle: section.title, columns: data.columns, maxItems: data.maxItems, items: data.items, kategoriMap, imageMap, autoCoverUrlByKategori,
            });
            // ... keep rest ...
            const titleTextColorRaw = String(cfg.titleTextColor ?? "").trim();
            const gridThemeRaw = String(cfg.sectionTheme ?? "").trim();
            // ... rest of logic uses cfg ...

            const titleTextColor = (titleTextColorRaw === "NAVY" || titleTextColorRaw === "GOLD" || titleTextColorRaw === "WHITE") ? titleTextColorRaw === "NAVY" ? "#0b1d3a" : titleTextColorRaw === "GOLD" ? "#d4af37" : "#ffffff" : null;
            const gridResolvedTheme = resolveEffectiveTheme(gridThemeRaw || "FOLLOW_NAVBAR", navbarTheme);
            const vars = categoryGridVarsFromTheme(gridResolvedTheme);

            const sectionBgRaw = (cfg.sectionBgTheme);
            const sectionBg = parseCustomPromoBgTheme(sectionBgRaw);
            const customPalette = resolveCustomPromoPalette(sectionBg, navbarTheme);

            const content = (
              <div
                className={!customPalette ? styles.previewSection : undefined}
                style={!customPalette ? {
                  ["--cg-card-bg" as any]: vars.cardBg, ["--cg-card-fg" as any]: vars.insideText, ["--cg-element" as any]: vars.outsideText, ["--cg-title-color" as any]: titleTextColor ?? vars.outsideText, ["--cg-card-border" as any]: vars.border,
                } : {
                  ["--cg-card-bg" as any]: vars.cardBg, ["--cg-card-fg" as any]: vars.insideText, ["--cg-element" as any]: vars.outsideText, ["--cg-title-color" as any]: titleTextColor ?? customPalette.fg, ["--cg-card-border" as any]: vars.border,
                  width: "100%", maxWidth: 1200, margin: "0 auto", padding: "0 24px"
                }}
              >
                <CategoryGridPreview data={categoryGridData} />
              </div>
            );

            if (customPalette) {
              return (
                <div key={section.id} className={styles.previewSectionFull} style={{ background: customPalette.bg, color: customPalette.fg }}>
                  {content}
                </div>
              );
            }

            return <div key={section.id}>{content}</div>;
          }

          // --- CATEGORY_GRID_COMMERCE ---
          if (t === "CATEGORY_GRID_COMMERCE") {
            const data = categoryCommerceById.get(section.id);
            if (!data) return null;
            const cfg = section.config as any;
            const rawMode = String(cfg.layout?.mode ?? cfg.mode ?? "clean").toLowerCase();
            const mode = rawMode === "reverse" ? "reverse" : rawMode === "commerce" ? "commerce" : "clean";
            const sectionThemeResolved = resolveEffectiveTheme(cfg.sectionTheme ?? "FOLLOW_NAVBAR", navbarTheme);
            const sectionThemeTokens = commerceThemeTokens(sectionThemeResolved);

            const sectionBgRaw = (cfg.sectionBgTheme);
            const sectionBg = parseCustomPromoBgTheme(sectionBgRaw);
            const customPalette = resolveCustomPromoPalette(sectionBg, navbarTheme);

            const commerceGridData = buildCategoryCommerceGridProps({
              sectionTitle: section.title, maxItems: data.maxItems, mode, tabs: Array.isArray(cfg.tabs) ? cfg.tabs : [], items: data.items, kategoriMap, imageMap, autoCoverUrlByKategori, fallbackUrl: FALLBACK_CATEGORY_IMAGE_URL,
            });

            if (customPalette) {
              const useSectionTheme = sectionBg === "FOLLOW_NAVBAR";
              // Use section theme tokens if standard theme is rendering (i.e. not using a custom bg override)
              const finalBg = useSectionTheme ? sectionThemeTokens.bg : customPalette.bg;
              const finalTextColor = useSectionTheme ? sectionThemeTokens.element : (customPalette.fg ?? sectionThemeTokens.element);

              return (
                <div key={section.id} className={styles.previewSectionFull} style={{
                  background: finalBg,
                  color: finalTextColor
                }}>
                  <div className={styles.themeScope} data-theme={sectionThemeResolved} style={{
                    padding: "56px 0",
                    ["--t-bg" as any]: "transparent",
                    ["--t-element" as any]: finalTextColor,
                    ["--t-card" as any]: sectionThemeTokens.card,
                    ["--t-card-fg" as any]: finalTextColor,
                    ["--t-card-border" as any]: sectionThemeTokens.cardBorder,
                    ["--t-cta-bg" as any]: sectionThemeTokens.ctaBg,
                    ["--t-cta-fg" as any]: sectionThemeTokens.ctaFg,
                    ["--t-cta-hover-bg" as any]: sectionThemeTokens.ctaHoverBg,
                    ["--t-cta-hover-fg" as any]: sectionThemeTokens.ctaHoverFg,
                    ["--t-divider" as any]: sectionThemeTokens.divider,
                  }}>
                    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
                      {commerceGridData.title ? <h2 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 16px", color: "var(--t-element)" }}>{commerceGridData.title}</h2> : null}
                      {commerceGridData.items.length >= 1 ? (
                        <CategoryCommerceColumns items={commerceGridData.items.map((it) => ({ id: it.categoryId, name: it.name, href: it.href, imageUrl: it.imageUrl, tabId: it.tabId }))} fallbackUrl={FALLBACK_CATEGORY_IMAGE_URL} mode={commerceGridData.mode} tabs={commerceGridData.tabs} viewAllHref={commerceGridData.mode === "reverse" ? "/kategori" : null} />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            }

            const textColor = mode === "clean" ? themeTokens.element : "var(--t-card-fg)";

            return (
              <div key={section.id} className={styles.themeScope} data-theme={sectionThemeResolved} style={{
                background: mode === "clean" ? "transparent" : "var(--t-card)", color: textColor, padding: "24px 0",
                ["--t-bg" as any]: sectionThemeTokens.bg, ["--t-element" as any]: sectionThemeTokens.element, ["--t-card" as any]: sectionThemeTokens.card, ["--t-card-fg" as any]: mode === "clean" ? textColor : sectionThemeTokens.cardFg, ["--t-card-border" as any]: sectionThemeTokens.cardBorder, ["--t-cta-bg" as any]: sectionThemeTokens.ctaBg, ["--t-cta-fg" as any]: sectionThemeTokens.ctaFg, ["--t-cta-hover-bg" as any]: sectionThemeTokens.ctaHoverBg, ["--t-cta-hover-fg" as any]: sectionThemeTokens.ctaHoverFg, ["--t-divider" as any]: sectionThemeTokens.divider,
              }}>
                <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
                  {commerceGridData.title ? <h2 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 16px", color: "var(--t-element)" }}>{commerceGridData.title}</h2> : null}
                  {commerceGridData.items.length >= 1 ? ( // Adjusted threshold to 1 for visibility
                    <CategoryCommerceColumns items={commerceGridData.items.map((it) => ({ id: it.categoryId, name: it.name, href: it.href, imageUrl: it.imageUrl, tabId: it.tabId }))} fallbackUrl={FALLBACK_CATEGORY_IMAGE_URL} mode={commerceGridData.mode} tabs={commerceGridData.tabs} viewAllHref={commerceGridData.mode === "reverse" ? "/kategori" : null} />
                  ) : null}
                </div>
              </div>
            );
          }

          // --- TEXT_SECTION ---
          if (t === "TEXT_SECTION") {
            const cfg = section.config as any;
            const blocks = Array.isArray(cfg.blocks) ? cfg.blocks : [];
            const fallbackText = String(cfg.text ?? "").trim();
            const blockItems = blocks.length ? blocks : fallbackText ? [{ mode: String(cfg.mode ?? "body"), text: fallbackText }] : [];
            if (!blockItems.length) return null;
            const mode = String(cfg.mode ?? "body");
            const align = String(cfg.align ?? "left");
            const width = String(cfg.width ?? "normal");
            const sectionThemeResolved = resolveEffectiveTheme(cfg.sectionTheme ?? "FOLLOW_NAVBAR", navbarTheme);
            const themeTokens = commerceThemeTokens(sectionThemeResolved);
            const pair = parseThemePair(sectionThemeResolved);
            const accent = colorForToken(pair.b);
            const alignClass = align === "center" ? styles.textAlignCenter : styles.textAlignLeft;
            const widthClass = width === "wide" ? styles.textWidthWide : styles.textWidthNormal;

            return (
              <section key={section.id} className={styles.textSection} style={{ ["--ts-text" as any]: themeTokens.cardFg, ["--ts-bg" as any]: themeTokens.bg, ["--ts-accent" as any]: accent }}>
                <div className={`${styles.textBlock} ${alignClass} ${widthClass}`}>
                  <div className={styles.textStack}>
                    {blockItems.map((b: any, idx: number) => {
                      const m = String(b?.mode ?? mode);
                      const cls = m === "heading" ? styles.textHeading : m === "subtitle" ? styles.textSubtitle : m === "caption" ? styles.textCaption : styles.textBody;
                      return <p key={idx} className={`${styles.textBase} ${cls}`}>{String(b?.text ?? "").trim()}</p>;
                    })}
                  </div>
                </div>
              </section>
            );
          }

          // --- HERO ---
          if (t === "HERO") {
            const cfg = section.config as any;
            const heroThemeClass = heroThemeClassFromConfig(String(cfg.sectionTheme ?? cfg.heroTheme ?? "FOLLOW_NAVBAR"), navbarTheme);
            const imageId = Number(cfg.imageId);
            const imgUrl = Number.isFinite(imageId) && imageId > 0 ? imageMap.get(imageId)?.url ?? null : null;

            // Reuse preview logic for displaying components
            const finalBadges = Array.isArray(cfg.badges) ? cfg.badges : [];
            const finalHighlights = Array.isArray(cfg.highlights) ? cfg.highlights : [];
            const finalTrust = Array.isArray(cfg.trustChips) ? cfg.trustChips : [];
            const mini = Array.isArray(cfg.miniInfo) ? cfg.miniInfo : [];

            // Strict content check helper
            const hasText = (s: any) => String(s || "").trim().length > 0;

            const hasHeadline = hasText(cfg.headline);
            const hasSubheadline = hasText(cfg.subheadline);
            // Hide eyebrow if it looks like a generic theme name (e.g. "Theme 1", "THEME_1")
            const isGenericEyebrow = /^(theme[\s_-]*\d+|untitled|draft)/i.test(cfg.eyebrow || "");
            const hasEyebrow = hasText(cfg.eyebrow) && !isGenericEyebrow;
            const hasFloat1 = hasText(cfg.floatLookbookTitle) || hasText(cfg.floatLookbookSubtitle);
            const hasFloat2 = hasText(cfg.floatPromoTitle) || hasText(cfg.floatPromoText);

            const hasContent = Boolean(imgUrl || hasHeadline || hasSubheadline || hasEyebrow || finalBadges.length || finalHighlights.length || finalTrust.length || mini.length || hasFloat1 || hasFloat2);
            if (!hasContent) return null;

            return (
              <section key={section.id} className={`${styles.hero} ${styles.heroV1} ${heroThemeClass}`}>
                <div className={styles.heroInner}>
                  <div className={styles.heroText}>
                    <div className={styles.heroTopRow}>
                      {hasEyebrow ? <div className={styles.heroEyebrow}>{cfg.eyebrow}</div> : null}
                      <div className={styles.heroTopBadges}>{finalBadges.map((b: any, idx: number) => <span key={idx} className={styles.heroBadge}>{b}</span>)}</div>
                    </div>
                    {hasHeadline ? <h1 className={styles.heroTitle}>{cfg.headline}</h1> : null}
                    {hasSubheadline ? <p className={styles.heroDescription}>{cfg.subheadline}</p> : null}
                    {hasText(cfg.ctaLabel) ? <div className={styles.heroActions}><a className={`${styles.heroCta} ${styles.heroCtaPrimary}`} href={cfg.ctaHref || "#"}>{cfg.ctaLabel}</a></div> : null}
                    <ul className={styles.heroHighlights}>{finalHighlights.map((text: any, idx: number) => <li key={idx} className={styles.heroHighlightItem}><span className={styles.heroHighlightIcon}>✓</span><span className={styles.heroHighlightText}>{text}</span></li>)}</ul>
                    <div className={styles.heroTrustRow}>{finalTrust.map((text: any, idx: number) => <span key={idx} className={styles.heroTrustChip}>{text}</span>)}</div>
                    <div className={styles.heroMiniInfoRow}>{mini.map((m: any, idx: number) => <div key={idx} className={styles.heroMiniInfoCard}><div className={styles.heroMiniInfoTitle}>{m.title}</div><div className={styles.heroMiniInfoDesc}>{m.desc}</div></div>)}</div>
                  </div>
                  <div className={styles.heroMedia}>
                    <div className={styles.heroMediaBg} aria-hidden="true" />
                    {imgUrl ? (
                      <SecureImage className={styles.heroImage} src={imgUrl} alt={`${cfg.headline || "Interior & Furniture"} - Apix Interior`} priority={true} />
                    ) : <div className={styles.heroMediaPlaceholder} aria-hidden="true" />}
                    <div className={styles.heroFloatingCards} aria-hidden="true">
                      {hasFloat1 ? (
                        <div className={`${styles.heroFloatCard} ${styles.heroFloatCardRight}`}><div className={styles.heroFloatLabel}>{cfg.floatLookbookTitle}</div><div className={styles.heroFloatMeta}><span className={styles.heroFloatDot} /> {cfg.floatLookbookSubtitle}</div></div>
                      ) : null}
                      {hasFloat2 ? (
                        <div className={`${styles.heroFloatCard} ${styles.heroFloatCardWide}`}><div className={styles.heroFloatLabel}>{cfg.floatPromoTitle}</div><div className={styles.heroFloatRow}><span className={styles.heroFloatDot} /><span className={styles.heroFloatRowText}>{cfg.floatPromoText}</span></div></div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          // --- PRODUCT_CAROUSEL ---
          if (t === "PRODUCT_CAROUSEL") {
            const cfg = normalizeConfig(t, section.config) as any;
            const sectionThemeRaw = String((cfg as any).sectionTheme ?? (cfg as any).carouselTheme ?? (cfg as any).theme ?? "FOLLOW_NAVBAR").trim();
            const sectionTheme = resolveEffectiveTheme(sectionThemeRaw, navbarTheme);
            const themeTokens = getHeroThemeTokens(sectionTheme);

            // Resolve Background Override
            const bgThemeRaw = (cfg as any).sectionBgTheme;
            const palette = resolveCustomPromoPalette(bgThemeRaw, navbarTheme);
            const hasBgOverride = bgThemeRaw && bgThemeRaw !== "FOLLOW_NAVBAR";
            const bgStyle = hasBgOverride ? { backgroundColor: palette.bg, color: palette.fg } : {};

            const products = Array.isArray(cfg.productIds) ? cfg.productIds.map((id: any) => produkMap.get(Number(id))).filter(Boolean) as any[] : [];

            if (!products.length) return null;

            const carouselContent = (
              <section className={hasBgOverride ? "" : styles.previewSection} style={{ background: "transparent", padding: hasBgOverride ? "0 16px" : undefined }}>
                {section.title ? <h2 className={styles.sectionTitle}>{section.title}</h2> : null}
                {cfg.description ? <div style={{ marginBottom: 10, fontSize: 13, opacity: 0.72, maxWidth: 820, color: themeTokens.cardFg }}>{cfg.description}</div> : null}
                {products.length ? (
                  <div className={styles.pcRow}>
                    {products.map((p: any) => {
                      const mainId = p.mainImageId ? Number(p.mainImageId) : null;
                      const gId = pickFirstGalleryImageId(p.galleryImageIds || []);
                      const pickedId = mainId || gId;
                      const imgUrl = pickedId ? imageMap.get(Number(pickedId))?.url ?? null : null;
                      const href = p.slug ? `/produk/${p.slug}` : "#";
                      const pr = computeHargaSetelahPromo(p);
                      const priceNode = cfg.showPrice ? (pr.isPromo ? <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><div style={{ display: "flex", gap: 8 }}><span style={{ fontWeight: 800 }}>{formatRupiah(pr.hargaFinal)}</span></div><div style={{ display: "flex", gap: 8 }}><span style={{ textDecoration: "line-through", opacity: 0.6 }}>{formatRupiah(pr.hargaAsli)}</span><span style={{ fontWeight: 800, color: themeTokens.element }}>{pr.promoLabel}</span></div></div> : <>{formatRupiah(p.harga)}</>) : null;
                      return (
                        <article key={Number(p.id)} className={styles.pcCard} style={{ background: themeTokens.card, border: `1px solid ${themeTokens.cardBorder}`, color: themeTokens.cardFg }}>
                          {imgUrl ? <div className={styles.pcMedia}><div className={styles.pcMediaBlur} aria-hidden="true" /><SecureImage className={styles.pcMediaImg} src={imgUrl} alt={String(p.nama)} /></div> : <div className={styles.pcMediaPlaceholder} />}
                          <div className={styles.pcBody}><div className={styles.pcTitle} style={{ color: themeTokens.cardFg }}>{String(p.nama)}</div>{cfg.showPrice ? <div className={styles.pcPrice} style={{ color: themeTokens.cardFg }}>{priceNode}</div> : null}
                            <div className={styles.pcCtaWrap}>{cfg.showCta ? <a className={styles.pcCta} href={href} style={{ background: themeTokens.ctaBg, color: themeTokens.ctaFg, border: `1px solid ${themeTokens.ctaBg}` }}>Lihat Produk</a> : null}</div></div>
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );

            if (hasBgOverride) {
              return (
                <div key={section.id} className={styles.previewSectionFull} style={{ background: palette.bg, color: palette.fg }}>
                  {carouselContent}
                </div>
              );
            }
            return <div key={section.id}>{carouselContent}</div>;
          }

          // --- PRODUCT_LISTING ---
          if (t === "PRODUCT_LISTING") {
            const cfg = normalizeConfig(t, section.config) as any;
            const sectionThemeRaw = String((cfg as any).sectionTheme ?? (cfg as any).carouselTheme ?? (cfg as any).theme ?? "FOLLOW_NAVBAR").trim();
            const sectionTheme = resolveEffectiveTheme(sectionThemeRaw, navbarTheme);
            const themeTokens = getHeroThemeTokens(sectionTheme);

            // Resolve Background Override
            const bgThemeRaw = (cfg as any).sectionBgTheme;
            const palette = resolveCustomPromoPalette(bgThemeRaw, navbarTheme);
            const hasBgOverride = bgThemeRaw && bgThemeRaw !== "FOLLOW_NAVBAR";
            const bgStyle = hasBgOverride ? { backgroundColor: palette.bg, color: palette.fg } : {};

            // If specific productIds are set, use them. Else use the global latest listing.
            let products: any[] = [];
            if (Array.isArray(cfg.productIds) && cfg.productIds.length > 0) {
              products = cfg.productIds.map((id: any) => produkMap.get(Number(id))).filter(Boolean);
            } else {
              products = productListingItems;
            }
            if (!products.length) return null;

            const listingContent = (
              <section className={hasBgOverride ? "" : styles.previewSection} style={{ background: "transparent", padding: hasBgOverride ? "0 16px" : undefined }}>
                {section.title ? <h2 className={styles.sectionTitle}>{section.title}</h2> : null}
                <div className={styles.productListingGrid}>
                  {products.map((p: any, idx: number) => {

                    const mainId = p.mainImageId ? Number(p.mainImageId) : null;
                    const gId = pickFirstGalleryImageId(p.galleryImageIds || []);
                    const pickedId = mainId || gId;
                    const imgUrl = pickedId ? imageMap.get(Number(pickedId))?.url ?? null : null;
                    const href = p.slug ? `/produk/${p.slug}` : "#";
                    const pr = computeHargaSetelahPromo(p);
                    return (
                      <article key={Number(p.id)} className={styles.productListingItem}>
                        <a href={href} className={styles.pcCard} style={{ background: themeTokens.card, border: `1px solid ${themeTokens.cardBorder}`, color: themeTokens.cardFg, textDecoration: "none", width: "100%", height: "100%" }}>
                          {imgUrl ? <div className={styles.pcMedia}><div className={styles.pcMediaBlur} aria-hidden="true" /><SecureImage className={styles.pcMediaImg} src={imgUrl} alt={String(p.nama)} /></div> : <div className={styles.pcMediaPlaceholder} />}
                          <div className={styles.pcBody}>
                            <div className={styles.pcTitle} style={{ color: themeTokens.cardFg }}>{String(p.nama || "Nama Produk")}</div>
                            <div className={styles.pcPrice} style={{ color: themeTokens.cardFg }}>
                              {pr.isPromo ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  <span style={{ fontWeight: 800 }}>{formatRupiah(pr.hargaFinal)}</span>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{formatRupiah(pr.hargaAsli)}</span>
                                    <span style={{ fontWeight: 800, color: themeTokens.element }}>{pr.promoLabel}</span>
                                  </div>
                                </div>
                              ) : (
                                <>{formatRupiah(p.harga)}</>
                              )}
                            </div>
                          </div>
                        </a>
                      </article>
                    );
                  })}
                </div>
                <div className={styles.productListingFooter}><a className={styles.productListingMore} href="/produk" style={{ background: themeTokens.ctaBg, color: themeTokens.ctaFg, border: `1px solid ${themeTokens.ctaBg}` }}>Tampilkan Semua</a></div>
              </section>
            );

            if (hasBgOverride) {
              return (
                <div key={section.id} className={styles.previewSectionFull} style={{ background: palette.bg, color: palette.fg }}>
                  {listingContent}
                </div>
              );
            }
            return <div key={section.id}>{listingContent}</div>;
          }

          // --- HIGHLIGHT_COLLECTION ---
          if (t === "HIGHLIGHT_COLLECTION") {
            const cfg = section.config as any;
            const heroId = Number(cfg.heroImageId);
            const heroUrl = Number.isFinite(heroId) && heroId > 0 ? imageMap.get(heroId)?.url ?? null : null;
            const sectionThemeResolved = resolveEffectiveTheme(cfg.sectionTheme ?? "FOLLOW_NAVBAR", navbarTheme);
            const productIds: number[] = Array.isArray(cfg.productIds) ? cfg.productIds : [];
            const products = productIds.map((id) => produkMap.get(Number(id))).filter(Boolean) as any[];
            const hasOverlay = Boolean(cfg.headline || cfg.description || (cfg.ctaText && cfg.ctaHref));
            const useOverlay = Boolean(heroUrl) && hasOverlay;

            return (
              <section key={section.id} className={styles.previewSection}>
                <article className={styles.hcSection} data-theme={sectionThemeResolved} data-layout={cfg.layout} data-hc-layout={cfg.layout} data-hc-nohero={!heroUrl ? "1" : undefined}>
                  <div className={styles.hcInner}>
                    {!useOverlay ? <header className={styles.hcHeader}>{cfg.headline ? <div className={styles.hcTitle}>{cfg.headline}</div> : null}{cfg.description ? <div className={styles.hcDesc}>{cfg.description}</div> : null}{cfg.ctaText ? <a className={styles.hcCta} href={cfg.ctaHref}>{cfg.ctaText}</a> : null}</header> : null}
                    <div className={styles.hcGrid}>
                      {heroUrl ? <div className={styles.hcHero}><div className={styles.hcHeroMedia}><div className={styles.hcHeroMediaBlur} style={{ backgroundImage: `url(${heroUrl})` }} /><div style={{ position: "relative", width: "100%", height: "100%" }}><Image className={styles.hcHeroMediaImg} src={heroUrl} alt={cfg.headline || "Highlight"} fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, 50vw" /></div>{useOverlay ? <div className={styles.hcHeroOverlay}><div className={styles.hcHeroGlass}>{cfg.headline ? <div className={styles.hcHeroOverlayTitle}>{cfg.headline}</div> : null}{cfg.description ? <div className={styles.hcHeroOverlayDesc}>{cfg.description}</div> : null}{cfg.ctaText ? <a className={styles.hcHeroOverlayCta} href={cfg.ctaHref}>{cfg.ctaText}</a> : null}</div></div> : null}</div></div> : null}
                      <div className={styles.hcItems}>{products.length ? products.map((p: any) => {
                        const imgUrl = (p.mainImageId ? imageMap.get(Number(p.mainImageId))?.url : null) ?? null;
                        const href = p.slug ? `/produk/${p.slug}` : "#";
                        const pr = computeHargaSetelahPromo(p);
                        return (
                          <a key={Number(p.id)} href={href} className={styles.hcItem}>{imgUrl ? <div className={styles.hcItemMedia}><div className={styles.hcItemMediaBlur} style={{ backgroundImage: `url(${imgUrl})` }} /><SecureImage className={styles.hcItemMediaImg} src={imgUrl} alt={String(p.nama)} /></div> : <div className={styles.hcItemEmptyMedia} />}<div className={styles.hcItemBody}><div className={styles.hcItemTitle}>{String(p.nama)}</div><div className={styles.hcItemPrice}>{pr.isPromo ? <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><div style={{ display: "flex", gap: 8 }}><span style={{ fontWeight: 800 }}>{formatRupiah(pr.hargaFinal)}</span></div><div style={{ display: "flex", gap: 8 }}><span style={{ textDecoration: "line-through", opacity: 0.6 }}>{formatRupiah(pr.hargaAsli)}</span><span style={{ fontWeight: 800 }}>{pr.promoLabel}</span></div></div> : <>{formatRupiah(p.harga)}</>}</div></div></a>
                        );
                      }) : null}</div>
                    </div>
                  </div>
                </article>
              </section>
            );
          }

          // --- BRANCHES ---
          if (t === "BRANCHES") {
            const cfg = normalizeConfig(t, section.config) as any;
            const sectionThemeResolved = resolveEffectiveTheme(cfg.sectionTheme ?? "FOLLOW_NAVBAR", navbarTheme);
            const cardThemeClass = sectionThemeResolved ? `theme-${String(sectionThemeResolved).toLowerCase()}` : "";

            // Normalize theme string for parsing
            const normalizedTheme = String(sectionThemeResolved || "")
              .toUpperCase()
              .trim()
              .replace(/\s*\+\s*/g, "_")
              .replace(/\s+/g, "_")
              .replace(/-/g, "_");

            // Manual color mapping for all 6 theme combinations
            const themePair = parseThemePair(normalizedTheme);
            let cardBg = "#ffffff";
            let cardFg = "#0f172a";
            let ctaBg = "#d4af37";
            let ctaFg = "#0b1d3a";

            if (themePair.a === "WHITE" && themePair.b === "GOLD") {
              cardBg = "#ffffff"; cardFg = "#0f172a"; ctaBg = "#d4af37"; ctaFg = "#0b1d3a";
            } else if (themePair.a === "NAVY" && themePair.b === "GOLD") {
              cardBg = "#0b1d3a"; cardFg = "#ffffff"; ctaBg = "#d4af37"; ctaFg = "#0b1d3a";
            } else if (themePair.a === "NAVY" && themePair.b === "WHITE") {
              cardBg = "#0b1d3a"; cardFg = "#ffffff"; ctaBg = "#ffffff"; ctaFg = "#0b1d3a";
            } else if (themePair.a === "GOLD" && themePair.b === "NAVY") {
              cardBg = "#d4af37"; cardFg = "#0b1d3a"; ctaBg = "#0b1d3a"; ctaFg = "#ffffff";
            } else if (themePair.a === "GOLD" && themePair.b === "WHITE") {
              cardBg = "#d4af37"; cardFg = "#0b1d3a"; ctaBg = "#ffffff"; ctaFg = "#0b1d3a";
            } else if (themePair.a === "WHITE" && themePair.b === "NAVY") {
              cardBg = "#ffffff"; cardFg = "#0f172a"; ctaBg = "#0b1d3a"; ctaFg = "#ffffff";
            }

            const colors = { card: cardBg, cardFg, ctaBg, ctaFg };

            // Independent Background Logic
            const savedBg = (cfg as any).sectionBgTheme;
            const effectiveBgToken = savedBg && ["NAVY", "GOLD", "WHITE"].includes(savedBg) ? savedBg : "NAVY";

            const sectionBgColor = effectiveBgToken === "WHITE" ? "#FFFFFF" : effectiveBgToken === "GOLD" ? "#D4AF37" : "#0B1D3A";
            const sectionTextColor = effectiveBgToken === "WHITE" || effectiveBgToken === "GOLD" ? "#0f172a" : "#FFFFFF";

            const selectedIds: number[] = Array.isArray(cfg.branchIds) ? cfg.branchIds : [];
            const branches = selectedIds.map((id: any) => cabangMap.get(Number(id))).filter(Boolean);
            const layoutEffective = (cfg.layout === "carousel" && branches.length > 0 && branches.length <= 5) ? "grid" : cfg.layout;

            const renderCard = (b: any) => {
              const name = String(b?.namaCabang ?? "").trim();
              const mapsUrl = String(b?.mapsUrl ?? "").trim();
              const meta = mapsUrl ? "Google Maps" : "Link maps belum diisi";
              // NEW: Resolve Embed
              const embedSrc = (resolveGoogleMapsEmbed as any)(mapsUrl, name);
              const isSingle = branches.length === 1;

              return (
                <article key={Number(b?.id)} className={`${styles.pcCard} ${cardThemeClass}`} style={{ width: layoutEffective === "carousel" ? "clamp(260px, 70vw, 420px)" : "100%", backgroundColor: colors.card, color: colors.cardFg }}>
                  <div className={styles.pcMediaPlaceholder} style={{ position: "relative", aspectRatio: "16/9", maxHeight: isSingle ? 360 : 240, borderBottom: "1px solid var(--t-card-border)", background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(0,0,0,0.14))" }}>
                    {embedSrc ? (
                      <iframe src={embedSrc} title={`Map - ${name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" style={{ border: 0, width: "100%", height: "100%" }} />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>📍</div>
                    )}
                  </div>
                  <div className={styles.pcBody}><div className={styles.pcTitle}>{name}</div><div className={styles.pcMeta}>{meta}</div><div className={styles.pcCtaWrap}>{mapsUrl ? <a className={styles.pcCta} href={resolveGoogleMapsNavigation(mapsUrl, name)} target="_blank" rel="noreferrer" style={{ background: colors.ctaBg, color: colors.ctaFg }}>Buka Maps</a> : <div className={styles.pcCtaPlaceholder} />}</div></div>
                </article>
              );
            };

            if (!branches.length) return null;

            return (
              <section key={section.id} className={`${styles.previewSection} ${styles.previewSectionTheme}`} data-theme={sectionThemeResolved} style={{ backgroundColor: sectionBgColor, color: sectionTextColor }}>
                {section.title ? <h2 className={styles.sectionTitle}>{section.title}</h2> : null}
                {layoutEffective === "carousel" ? <div className={styles.pcRow}>{branches.map(renderCard)}</div> : <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", width: "100%" }}>{branches.map(renderCard)}</div>}
              </section>
            );
          }

          // --- SOCIAL ---
          if (t === "SOCIAL") {
            const cfg = section.config as any;
            const iconKeys = Array.isArray(cfg.iconKeys) ? cfg.iconKeys : [];
            const items = iconKeys.map((k: string) => ({ k, row: mediaSosialByKey.get(k) })).filter((it: any) => it.row);
            if (!items.length) return null;
            const sectionThemeResolved = resolveEffectiveTheme(((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR"), navbarTheme);
            const pair = parseThemePair(sectionThemeResolved);
            const bgToken = pair.a; const accentToken = pair.b;
            const btnBg = bgToken === "NAVY" ? "rgba(11, 29, 58, 0.94)" : bgToken === "GOLD" ? "rgba(212, 175, 55, 0.92)" : "rgba(255,255,255,0.94)";
            const iconColor = accentToken === "WHITE" ? "rgba(255,255,255,0.95)" : accentToken === "NAVY" ? "rgba(11, 29, 58, 0.92)" : colorForToken(accentToken);

            return (
              <div key={section.id} style={{ position: "fixed", right: 18, bottom: 18, zIndex: 60, display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map(({ k, row }: any) => {
                  const url = normalizeExternalUrl(row?.url);
                  return (
                    <a
                      key={k}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Kunjungi ${row?.nama || k}`}
                      style={{ width: 46, height: 46, borderRadius: 999, display: "grid", placeItems: "center", textDecoration: "none", background: btnBg, border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 12px 28px rgba(0,0,0,0.35)", backdropFilter: "blur(10px)" }}
                    >
                      <span style={{ display: "grid", placeItems: "center", color: iconColor }}>
                        <SocialIcon iconKey={String(row?.iconKey ?? k)} />
                      </span>
                    </a>
                  )
                })}
              </div>
            );
          }

          // --- CUSTOM_PROMO ---
          if (t === "CUSTOM_PROMO") {
            const cfg = section.config as any;
            const layout = cfg.layout;
            const voucherIds = Array.isArray(cfg.voucherImageIds) ? cfg.voucherImageIds : [];
            const voucherLinks = (cfg as any)?.voucherLinks || {};
            // Filter and Map Items with Link Resolution
            const items = voucherIds.map((id: any) => {
              const nId = Number(id);
              const url = imageMap.get(nId)?.url;
              if (!url) return null;

              let href = "";
              const rawLink = voucherLinks[nId];

              // DEBUG: Trace link generation
              // console.log(`DEBUG_VOUCHER: ID=${nId}, RawLink=${rawLink}`);

              if (typeof rawLink === "string") {
                if (rawLink.startsWith("category:")) {
                  const catId = Number(rawLink.split(":")[1]);
                  const k = kategoriMap.get(catId);

                  // console.log(`DEBUG_VOUCHER_CAT: CatID=${catId}, Found=${!!k}, Slug=${k?.slug}`);

                  if (k && k.nama) {
                    // Use Product Link with Category Filter
                    href = `/produk?cat=${encodeURIComponent(k.nama)}`;
                  } else if (Number.isFinite(catId) && catId > 0) {
                    const fallbackPath = `/cari?kategori=${catId}`;
                    href = fallbackPath;
                  }
                } else {
                  href = rawLink.trim();
                }
              }
              // console.log(`DEBUG_VOUCHER_FINAL: Href=${href}`);
              return { id: nId, url, href };
            }).filter(Boolean);

            if (!items.length) return null;
            const palette = resolveCustomPromoPalette(cfg.sectionBgTheme, navbarTheme);

            const renderItem = (item: any) => {
              const innerContent = (
                <SecureImage
                  src={item.url}
                  alt="Promo"
                  className={styles.promoImg}
                />
              );

              if (item.href) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`${styles.promoCard} ${styles.promoClickable}`}
                    style={{ borderColor: palette.border }}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {innerContent}
                  </Link>
                );
              }
              return (
                <article
                  key={item.id}
                  className={styles.promoCard}
                  style={{ borderColor: palette.border }}
                >
                  {innerContent}
                </article>
              );
            };

            return (
              <section key={section.id} className={`${styles.previewSection} ${styles.previewSectionFull}`}>
                {section.title ? <h2 className={styles.sectionTitle}>{section.title}</h2> : null}
                <div className={`${styles.promoStage} ${styles.promoStageFull}`} data-layout={layout} style={{ background: palette.bg, color: palette.fg, borderColor: palette.border }}>
                  {layout === "grid" ? (
                    <div className={styles.promoGrid} style={{ ["--promoGridDesktopCols" as any]: "3" }}>
                      {items.map(renderItem)}
                    </div>
                  ) : layout === "hero" ? (
                    <div className={styles.promoHero}>
                      <SecureImage
                        src={items[0].url}
                        alt=""
                        className={styles.promoHeroImg}
                      />
                    </div>
                  ) : (
                    <div className={styles.promoCarousel}>{items.map(renderItem)}</div>
                  )}
                </div>
              </section>
            );
          }

          // --- CONTACT ---
          if (t === "CONTACT") {
            const cfg = normalizeConfig(t, section.config) as any;
            const sectionThemeResolved = resolveEffectiveTheme((cfg as any).sectionTheme, navbarTheme);
            const showImage = Boolean((cfg as any).showImage);
            const imageId = (cfg as any).imageId ? Number((cfg as any).imageId) : null;
            const imgUrl = imageId && imageMap.get(imageId) ? String((imageMap.get(imageId) as any).url) : "";

            const headerText = String((cfg as any).headerText ?? "").trim();
            const bodyText = String((cfg as any).bodyText ?? "").trim();

            const selectedIds = Array.isArray((cfg as any).hubungiIds) ? (cfg as any).hubungiIds : [];
            const selected = selectedIds
              .map((v: any) => hubungiMap.get(Number(v)))
              .filter(Boolean) as any[];

            const buttonLabels = typeof (cfg as any).buttonLabels === "object" ? ((cfg as any).buttonLabels as any) : {};

            const contacts = selected
              .slice(0, 10)
              .map((h: any, idx: number) => ({ ...(h || {}), __idx: idx }));

            const makeLabel = (h: any) => {
              const idKey = String(h?.id ?? "");
              const custom = typeof buttonLabels?.[idKey] === "string" ? String(buttonLabels[idKey]).trim() : "";
              if (custom) return custom;

              const idx = Number(h?.__idx ?? 0);
              return idx === 0 ? "Hubungi" : `CS ${idx + 1}`;
            };

            const normalizePhone = (raw: string) => {
              const digits = String(raw || "").replace(/[^\d+]/g, "");
              if (!digits) return "";
              if (digits.startsWith("0")) return "62" + digits.slice(1);
              if (digits.startsWith("+")) return digits.slice(1);
              return digits;
            };

            const makeHref = (h: any) => {
              const jenis = String(h?.jenis ?? "").toLowerCase();
              const nomor = String(h?.nomor ?? "").trim();
              const email = String(h?.email ?? "").trim();

              if (email) return `mailto:${email}`;
              if (nomor) {
                const digits = normalizePhone(nomor);
                if (jenis.includes("wa") || jenis.includes("whatsapp")) return `https://wa.me/${digits}`;
                if (jenis.includes("tel") || jenis.includes("phone") || jenis.includes("call")) return `tel:${nomor}`;
                return digits.length >= 9 ? `https://wa.me/${digits}` : `tel:${nomor}`;
              }
              return "#";
            };

            const primary = contacts[0] ?? null;
            const rest = contacts.slice(1);

            const NoContacts = () => <div className={styles.notice}>Belum ada kontak dipilih.</div>;

            const ChipsRow = ({ items }: { items: any[] }) =>
              items.length ? (
                <div className={styles.contactChipsRow}>
                  {items.map((h) => (
                    <a key={String(h.id)} className={`${styles.pcCta} ${styles.contactChip}`} href={makeHref(h)}>{makeLabel(h)}</a>
                  ))}
                </div>
              ) : null;

            // ===== Mode: SPLIT_IMAGE_STACK =====
            const SplitImageStack = () => {
              const hasImg = Boolean(showImage && imgUrl);
              const title = headerText || section.title || "";
              const desc = bodyText;

              return (
                <article className={styles.contactSplit}>
                  <div className={styles.contactMediaCard}>
                    {hasImg ? (<SecureImage src={imgUrl} alt="Hubungi Kami" className={styles.contactCoverImg} />) : (<div className={styles.contactMediaPlaceholder}>🖼️</div>)}
                  </div>
                  <div className={styles.contactSplitRight}>
                    <div className={styles.contactTextStack}>
                      {title ? <div className={styles.contactTitle}>{title}</div> : null}
                      {desc ? <div className={styles.contactDesc}>{desc}</div> : null}
                    </div>
                    {contacts.length ? (
                      <div style={{ display: "grid", gap: 10 }}>
                        {contacts.map((h: any) => (
                          <a key={String(h.id)} className={`${styles.pcCta} ${styles.contactBtn}`} href={makeHref(h)}>{makeLabel(h)}</a>
                        ))}
                      </div>
                    ) : (<NoContacts />)}
                  </div>
                </article>
              );
            };

            // Using Split Stack as primary render
            const body = <SplitImageStack />;

            return (
              <section key={section.id} className={`${styles.previewSection} ${styles.previewSectionTheme}`} data-theme={sectionThemeResolved}>
                <div className={styles.contactStage}>
                  {section.title ? <h2 className={styles.sectionTitle}>{section.title}</h2> : null}
                  <div className={styles.contactStageBody}>{body}</div>
                </div>
              </section>
            );
          }

          // --- ROOM_CATEGORY ---
          if (t === "ROOM_CATEGORY") {
            const cfg = section.config as any;
            const cards = Array.isArray(cfg.cards) ? cfg.cards : [];
            const roomThemeKey = resolveEffectiveTheme(String(cfg.sectionTheme ?? "FOLLOW_NAVBAR"), navbarTheme);
            const { a: rcA, b: rcB } = parseThemePair(roomThemeKey);
            const rcLabelBg = colorForToken(rcA);
            // Override Gold to be brighter specifically for Room Category
            const rcAccent = rcB === "GOLD" ? "#FFD700" : colorForToken(rcB);

            return (
              <section key={section.id} className={styles.previewSection}>
                {section.title ? <h2 className={styles.sectionTitle}>{section.title}</h2> : null}
                <div className={styles.roomGrid} aria-label="Grid Kategori Ruangan">
                  {cards.map((card: any, idx: number) => {
                    const kategoriId = Number(card?.kategoriId);
                    const k = Number.isFinite(kategoriId) ? kategoriMap.get(kategoriId) : null;
                    const href = k?.slug ? `/kategori/${k.slug}` : "#";
                    const imageId = Number(card?.imageId);
                    const imgUrl = Number.isFinite(imageId) ? imageMap.get(imageId)?.url : (kategoriId ? autoCoverUrlByKategori.get(kategoriId) : null);

                    // Fallback title to category name if manual title is empty
                    const displayTitle = card.title || k?.nama || "";
                    const isImageOnly = !displayTitle;

                    return (
                      <Link key={idx} href={href} className={styles.roomCardLink}>
                        <div className={`${styles.roomCard} ${isImageOnly ? styles.roomCardImageOnly : ""}`} style={{ borderColor: rcAccent }}>
                          <div className={styles.roomMedia}>{imgUrl ? <SecureImage className={styles.roomImg} src={imgUrl} alt={displayTitle || "Kategori"} /> : <div className={styles.roomMediaPlaceholder} />}</div>
                          {!isImageOnly ? <div className={styles.roomBody} style={{ background: rcLabelBg }}><div className={styles.roomTopRow}><div className={styles.roomTitle} style={{ color: rcAccent }}>{displayTitle}</div>{card.badge ? <span className={styles.roomBadge} style={{ borderColor: rcAccent, color: rcAccent }}>{card.badge}</span> : null}</div></div> : null}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          }

          // --- FOOTER ---
          if (t === "FOOTER") {
            const cfg = normalizeConfig(t, section.config) as any;
            const footerThemeKey = resolveEffectiveTheme(String(cfg.sectionTheme ?? "FOLLOW_NAVBAR"), navbarTheme);
            const colors = getHeroThemeTokens(footerThemeKey);
            const useGlobal = Boolean(cfg.useGlobalContact);

            return (
              <section key={section.id} className={styles.footerSection} style={{ backgroundColor: colors.bg, color: colors.element }}>
                <div className={styles.footerLayout}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
                    {(() => {
                      const tags = Array.isArray(cfg.footerTags) ? cfg.footerTags : [];
                      // Allow rendering even if tags are empty (so logo/contact still shows)
                      // if (tags.length === 0) return null; 

                      const mid = Math.ceil(tags.length / 2);
                      const leftTags = tags.slice(0, mid);
                      const rightTags = tags.slice(mid);

                      return (
                        <>
                          <div className={styles.footerTagsGrid}>
                            {leftTags.map((tag: any, i: number) => (
                              <span key={i} style={{ color: "inherit", opacity: 0.6, fontSize: 12, fontWeight: "bold" }}>{tag.label}</span>
                            ))}
                          </div>
                          {rightTags.length > 0 && (
                            <div className={styles.footerTagsGrid}>
                              {rightTags.map((tag: any, i: number) => (
                                <span key={i} style={{ color: "inherit", opacity: 0.6, fontSize: 12, fontWeight: "bold" }}>{tag.label}</span>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <div className={styles.footerRightStack}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {/* Logo and Icon */}
                      <img src={getFooterIconPath("LOGO", colors.element)} alt="Apix Interior" style={{ height: 32, width: "auto", objectFit: "contain", alignSelf: "flex-start" }} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <img src={getFooterIconPath("LOC", colors.element)} alt="Loc" style={{ width: 14, height: 14 }} />
                        <address style={{ fontStyle: "normal", fontSize: 12, opacity: 0.8 }}>
                          {(() => {
                            const manualAddr = cfg.address;
                            if (useGlobal) {
                              const firstBranch = cabangMap?.values().next().value;
                              const branchAddr = firstBranch?.alamat || firstBranch?.namaCabang;
                              return branchAddr || manualAddr || "Alamat belum diatur.";
                            }
                            return manualAddr || "Alamat belum diatur.";
                          })()}
                        </address>
                      </div>
                    </div>
                    {/* Menu Links */}
                    <div className={styles.footerMenuContactGrid}>
                      {/* Menu */}
                      {Array.isArray(cfg.menuLinks) && cfg.menuLinks.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <h4 style={{ fontSize: 12, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.9 }}>Menu</h4>
                          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                            {cfg.menuLinks.map((link: any, idx: number) => (
                              <li key={idx}>
                                <a href={link.url} style={{ textDecoration: "none", color: "inherit", opacity: 0.7, fontSize: 13, fontWeight: 500 }}>{link.label}</a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Contact */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <h4 style={{ fontSize: 12, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.9 }}>Hubungi</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {(() => {
                            const waCfg = cfg.whatsapp;
                            const useGlobal = cfg.useGlobalContact;
                            let globalWa = "";
                            // Need access to hubungiMap (globally available as map of cached hubungi)
                            // In page.tsx rendering logic, we have hubungiMap.
                            if (useGlobal && hubungiMap && hubungiMap.size > 0) {
                              for (const h of hubungiMap.values()) {
                                if (h.prioritas) { globalWa = h.nomor; break; }
                              }
                              if (!globalWa) globalWa = hubungiMap.values().next().value?.nomor;
                            }
                            const waVal = useGlobal ? (globalWa || waCfg) : waCfg;
                            if (!waVal) return null;

                            const displayWa = waVal.startsWith("62") ? "+" + waVal : waVal;
                            const linkWa = waVal.replace(/^\+/, "");

                            return (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, opacity: 0.7 }}>
                                {/* Use footer icon helper or emoji if path not avail? We have getFooterIconPath */}
                                <img src={getFooterIconPath("WA", colors.element)} alt="WA" style={{ width: 14, height: 14, opacity: 0.8 }} />
                                <a href={`https://wa.me/${linkWa}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", fontWeight: 600 }}>
                                  {displayWa}
                                </a>
                              </div>
                            );
                          })()}

                          {cfg.email && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, opacity: 0.7, fontWeight: 500 }}>
                              {/* Use generic envelope or icon */}
                              <span>✉</span>
                              <span>{cfg.email}</span>
                            </div>
                          )}

                          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                            {(() => {
                              const useGlobal = cfg.useGlobalSocial;
                              const items = [];

                              if (useGlobal && mediaSosialByKey) {
                                for (const [key, val] of mediaSosialByKey.entries()) {
                                  items.push({ key, url: val.url, label: val.nama || key });
                                }
                              } else {
                                // Manual fallback
                                const ig = cfg.instagram;
                                const fb = cfg.facebook;
                                if (ig) items.push({ key: "instagram", url: `https://instagram.com/${ig.replace("@", "")}`, label: "IG" });
                                if (fb) items.push({ key: "facebook", url: "#", label: "FB" });
                              }

                              if (items.length === 0) return null;

                              return items.map((it, idx) => (
                                <a key={idx} href={it.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", transition: "opacity 0.2s" }} title={it.label}>
                                  <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <SocialIcon iconKey={it.key} />
                                  </div>
                                </a>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          return null;
        })}
      </main>
    </div>
  );
}
