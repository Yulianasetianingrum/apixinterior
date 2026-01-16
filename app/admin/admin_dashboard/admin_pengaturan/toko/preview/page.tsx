import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";

import Navbar from "@/app/navbar/Navbar";
import homeStyles from "@/app/page.module.css";
import ui from "./preview.module.css";

import { CategoryGridPreview } from "./CategoryGridPreview";
import CategoryCommerceColumns from "@/app/components/homepage/CategoryCommerceColumns.client";
import SecureImage from "@/app/components/SecureImage";
import { SocialIcon } from "@/app/components/homepage/social-icons";
import { themeMetaSlug, getThemeKeyFromRow, isThemeMetaRow, getThemeKeyFromConfig, normalizeThemeKey, readSp, upperType, normalizeVoucherImageIds } from "../toko-utils";
import {
  normalizeConfig,
  getHeroThemeTokens,
  commerceThemeTokens,
  heroThemeClassFromConfig,
  buildCategoryGridProps,
  categoryGridVarsFromTheme,
  resolveEffectiveTheme,
  parseSectionTheme,
  parseCustomPromoBgTheme,
  resolveCustomPromoPalette,
  pickFirstGalleryImageId,
  formatRupiah,
  computeHargaSetelahPromo,
  resolveGoogleMapsEmbed,
  normalizeExternalUrl,
  normalizeThemeAttr, // Needed if used elsewhere
  buildCategoryCommerceGridProps,
  getFooterIconPath,
  isObject,
  colorForToken,
  parseThemePair,
  MAX_CUSTOM_PROMO_VOUCHERS,
} from "@/app/page.helpers";

export const dynamic = "force-dynamic";


const THEME_META_SLUG_PREFIX = "__theme_meta__";
const ADMIN_TOKO_PATH = "/admin/admin_dashboard/admin_pengaturan/toko";

type JsonObject = Record<string, any>;

type SectionRow = {
  id: number;
  type: string;
  title: string | null;
  slug: string | null;
  enabled: boolean;
  sortOrder: number;
  config: JsonObject;
};

type CategoryGridItem = { kategoriId: number; coverImageId: number | null };
type CategoryCommerceItem = {
  type?: "category" | "custom";
  kategoriId?: number;
  slug?: string;
  label?: string;
  imageId?: number | null;
  href?: string;
  imageUrl?: string;
  tabId?: string;
};

const FALLBACK_CATEGORY_IMAGE_URL = "/logo/logo_apixinterior_biru.png.png";



// Helpers imported from @/app/page.helpers


async function publishTheme(formData: FormData) {
  "use server";

  const themeKey = normalizeThemeKey(String(formData.get("themeKey") ?? "").trim());

  const meta = await prisma.homepageSectionDraft.findFirst({
    where: { slug: `${THEME_META_SLUG_PREFIX}${themeKey}` },
    select: { id: true },
  });

  if (!meta) {
    redirect(
      `${ADMIN_TOKO_PATH}/preview?theme=${encodeURIComponent(themeKey)}&error=${encodeURIComponent(
        "Belum ada theme ini. Buat theme dulu sebelum publish.",
      )}`,
    );
  }

  const allDrafts = await prisma.homepageSectionDraft.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  // ===== Prefetch contacts (hubungi) =====
  const hubungiAll = await prisma.hubungi.findMany({
    orderBy: { id: "asc" },
    select: { id: true, nomor: true, prioritas: true },
  });
  const hubungiById = new Map<number, any>();
  for (const h of hubungiAll as any[]) {
    const id = Number(h.id);
    const nomor = String((h as any).nomor ?? "");
    const prioritas = Boolean((h as any).prioritas);
    // Normalisasi untuk UI preview (model Hubungi hanya punya nomor + prioritas)
    hubungiById.set(id, { id, nomor, prioritas, label: prioritas ? "Kontak Utama" : `Kontak #${id}` });
  }

  // Theme meta (e.g. backgroundTheme) for this themeKey
  const themeMetaRow = (allDrafts as any[]).find(
    (d) => String(d?.slug ?? "") === `${THEME_META_SLUG_PREFIX}${themeKey}`,
  );
  const themeMetaCfg = isObject((themeMetaRow as any)?.config) ? ((themeMetaRow as any).config as any) : {};
  const backgroundTheme =
    typeof themeMetaCfg?.backgroundTheme === "string" ? String(themeMetaCfg.backgroundTheme).trim() : "FOLLOW_NAVBAR";
  const themeName =
    typeof themeMetaCfg?.themeName === "string" ? String(themeMetaCfg.themeName).trim() : "";
  console.log(`🚀 [publishTheme] Starting publish for theme: ${themeKey}`);
  console.log(`   - Total drafts in DB: ${allDrafts.length}`);

  const drafts = (allDrafts as any[])
    .filter((d) => {
      // 1. Exclude the marker row itself
      if (d.slug === "__active_theme__") return false;

      const isMeta = isThemeMetaRow(d);
      const tk = getThemeKeyFromConfig(d?.config);

      // 2. If it's a theme meta row, only include if it matches this theme's slug
      if (isMeta) {
        return d.slug === themeMetaSlug(themeKey);
      }

      // 3. Normal sections must match the themeKey
      const matches = tk === themeKey;

      if (matches) {
        console.log(`   - [PUBLISH FILTER] ID: ${d.id}, Type: ${d.type}, Theme: ${tk}`);
      }
      return matches;
    });

  console.log(`   - Found ${drafts.length} sections to publish for ${themeKey}`);

  await prisma.$transaction([
    prisma.homepageSectionPublished.deleteMany({}),
    ...drafts.map((d) => {
      console.log(`   - [CREATE PUBLISHED] ID: ${d.id}, Type: ${d.type}`);
      return prisma.homepageSectionPublished.create({
        data: {
          type: d.type as any,
          title: d.title,
          slug: d.slug,
          enabled: d.enabled,
          sortOrder: d.sortOrder,
          config: d.config,
        },
      });
    }),
  ]);
  console.log(`   - Transaction complete. Published updated.`);

  // Save the active theme key so homepage knows which theme to display
  // Clean up any existing active theme markers to prevent duplicates
  await prisma.homepageSectionDraft.deleteMany({
    where: { slug: "__active_theme__" },
  });

  // Create fresh marker
  await prisma.homepageSectionDraft.create({
    data: {
      type: "HERO", // Must be a valid enum
      title: "Active Theme Marker",
      slug: "__active_theme__",
      enabled: true,
      sortOrder: -1000,
      config: { __isActiveTheme: true, activeThemeKey: themeKey },
    },
  });

  revalidatePath("/");
  revalidatePath(ADMIN_TOKO_PATH);

  redirect(
    `${ADMIN_TOKO_PATH}/preview?theme=${encodeURIComponent(themeKey)}&notice=${encodeURIComponent(
      "Publish berhasil. Homepage utama sudah di-refresh.",
    )}`,
  );
}

async function unpublishTheme(formData: FormData) {
  "use server";

  console.log("🧨 [unpublishTheme] Request received. Clearing published site...");
  // Delete ALL published sections (makes homepage completely empty)
  const delPublished = await prisma.homepageSectionPublished.deleteMany({});
  console.log(`   - Deleted ${delPublished.count} sections from Published table.`);

  // Delete active theme marker (so homepage doesn't know which theme to show)
  // Delete active theme marker (so homepage doesn't know which theme to show)
  const delMarker = await prisma.homepageSectionDraft.deleteMany({
    where: { slug: "__active_theme__" },
  });
  console.log(`   - Deleted ${delMarker.count} active theme marker rows.`);

  revalidatePath("/");
  revalidatePath("/navbar");
  revalidatePath(ADMIN_TOKO_PATH);

  // Redirect back to admin with success notice
  redirect(
    `${ADMIN_TOKO_PATH}?notice=${encodeURIComponent(
      "Publish berhasil dihapus. Homepage sekarang kosong.",
    )}`,
  );
}

async function fetchPreviewTheme(themeKey: string) {
  const allDrafts = await prisma.homepageSectionDraft.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  const draftSections: SectionRow[] = (allDrafts as any[])
    .filter((d) => !isThemeMetaRow(d))
    .filter((d) => getThemeKeyFromRow(d) === themeKey)
    .filter((d) => d.enabled === true)
    .map((d) => ({
      id: Number(d.id),
      type: String(d.type),
      title: d.title ?? null,
      slug: d.slug ?? null,
      enabled: Boolean(d.enabled),
      sortOrder: Number(d.sortOrder ?? 0),
      config: normalizeConfig(String(d.type), d.config),
    }));

  // --- AUTO CLEANUP GHOSTS ---
  // User reported "sections render but not in list". These are likely untitled ghost sections.
  // We delete them automatically if they are found in the preview fetch.
  const ghosts = (allDrafts as any[]).filter(d => {
    if (isThemeMetaRow(d)) return false;
    const key = getThemeKeyFromRow(d);
    if (key !== themeKey) return false;
    // Ghost definition: No title OR title is empty string
    const title = String(d.title || "").trim();
    return title === "";
  });

  if (ghosts.length > 0) {
    console.log(`[Preview] Detecting ${ghosts.length} ghost sections for ${themeKey}. Deleting...`);
    const ghostIds = ghosts.map(g => Number(g.id));
    // Fire and forget cleanup (don't await to avoid blocking render too long, but ideally should await)
    await prisma.homepageSectionDraft.deleteMany({
      where: { id: { in: ghostIds } }
    });
    // Filter them out of the current render so user sees immediate effect
    const ghostIdSet = new Set(ghostIds);
    for (let i = draftSections.length - 1; i >= 0; i--) {
      if (ghostIdSet.has(draftSections[i].id)) {
        draftSections.splice(i, 1);
      }
    }
  }
  // ---------------------------

  // ===== Collect IDs to prefetch related data =====
  const kategoriIds: number[] = [];
  const autoCoverKategoriIds: number[] = [];
  const imageIds: number[] = [];
  const produkIds: number[] = [];
  const highlightProdukIds: number[] = [];
  const branchIds: number[] = [];
  const hubungiIds: number[] = [];
  const mediaIconKeys: string[] = [];
  let needsProductListing = false;
  let footerNeedsGlobalBranches = false;

  const categoryGridById = new Map<number, { items: CategoryGridItem[]; columns: number; maxItems?: number }>();
  const categoryCommerceById = new Map<number, { items: CategoryCommerceItem[]; columns: number; maxItems?: number }>();

  for (const s of draftSections) {
    if (s.type === "CATEGORY_GRID") {
      const cfg = s.config as any;
      const items: CategoryGridItem[] = Array.isArray(cfg.items) ? cfg.items : [];
      const layout = isObject(cfg.layout) ? cfg.layout : {};
      const columns = Number.isFinite(Number(layout.columns)) ? Math.max(2, Math.min(6, Number(layout.columns))) : 3;
      const maxItems = layout.maxItems ? Number(layout.maxItems) : undefined;

      for (const it of items) {
        if (it?.kategoriId) {
          kategoriIds.push(Number(it.kategoriId));
          if (it.coverImageId && Number.isFinite(it.coverImageId)) {
            imageIds.push(Number(it.coverImageId));
          } else {
            autoCoverKategoriIds.push(Number(it.kategoriId));
          }
        }
      }

      categoryGridById.set(s.id, { items, columns, ...(maxItems ? { maxItems } : {}) });
    }

    if (s.type === "CATEGORY_GRID_COMMERCE") {
      const cfg = s.config as any;
      const items: CategoryCommerceItem[] = Array.isArray(cfg.items) ? cfg.items : [];
      const layout = isObject(cfg.layout) ? cfg.layout : {};
      const columns = Number.isFinite(Number(layout.columns)) ? Math.max(2, Math.min(6, Number(layout.columns))) : 4;
      const maxItems = layout.maxItems ? Number(layout.maxItems) : undefined;

      for (const it of items) {
        if (it?.kategoriId) {
          kategoriIds.push(Number(it.kategoriId));
          if (it.imageId && Number.isFinite(it.imageId as number)) {
            imageIds.push(Number(it.imageId));
          } else {
            autoCoverKategoriIds.push(Number(it.kategoriId));
          }
        }
      }

      categoryCommerceById.set(s.id, { items, columns, ...(maxItems ? { maxItems } : {}) });
    }

    if (s.type === "HERO") {
      const imgId = Number((s.config as any).imageId);
      if (Number.isFinite(imgId) && imgId > 0) imageIds.push(imgId);
    }

    if (s.type === "PRODUCT_CAROUSEL") {
      const ids = Array.isArray((s.config as any).productIds) ? (s.config as any).productIds : [];
      for (const id of ids) {
        const n = Number(id);
        if (Number.isFinite(n) && n > 0) produkIds.push(n);
      }
    }

    if (s.type === "PRODUCT_LISTING") {
      const ids = Array.isArray((s.config as any).productIds) ? (s.config as any).productIds : [];
      for (const id of ids) {
        const n = Number(id);
        if (Number.isFinite(n) && n > 0) produkIds.push(n);
      }
      // Also keep needsProductListing if we want to support fallback or mixed content later? 
      // For now, let's keep it true just in case, but we might prioritize selected IDs.
      // actually, if we use selected IDs, we don't need the 'latest 60' fetch if we update the renderer.
      // But let's leave needsProductListing = true for safety if I don't remove that block yet.
      needsProductListing = true;
    }

    if (s.type === "HIGHLIGHT_COLLECTION") {
      const heroImageId = Number((s.config as any).heroImageId);
      if (Number.isFinite(heroImageId) && heroImageId > 0) imageIds.push(heroImageId);

      const ids = Array.isArray((s.config as any).productIds) ? (s.config as any).productIds : [];
      for (const id of ids) {
        const n = Number(id);
        if (Number.isFinite(n) && n > 0) {
          highlightProdukIds.push(n);
          produkIds.push(n);
        }
      }
    }

    if (s.type === "BRANCHES") {
      const ids = Array.isArray((s.config as any).branchIds) ? (s.config as any).branchIds : [];
      for (const id of ids) {
        const n = Number(id);
        if (Number.isFinite(n) && n > 0) branchIds.push(n);
      }
    }

    if (s.type === "SOCIAL") {
      const cfg = s.config as any;
      const keys: string[] = Array.isArray((cfg as any).iconKeys)
        ? (cfg as any).iconKeys.map((v: any) => String(v ?? "").trim()).filter(Boolean)
        : [];

      for (const k of keys) {
        if (k) mediaIconKeys.push(String(k));
      }
    }

    if (s.type === "CONTACT") {
      const cfg = s.config as any;
      const ids = Array.isArray((cfg as any).hubungiIds) ? (cfg as any).hubungiIds : [];
      for (const id of ids) {
        const n = Number(id);
        if (Number.isFinite(n) && n > 0) hubungiIds.push(n);
      }
      const showImage = Boolean((cfg as any).showImage);
      const imageId = Number((cfg as any).imageId);
      if (showImage && Number.isFinite(imageId) && imageId > 0) {
        imageIds.push(imageId);
      }
    }

    if (s.type === "CUSTOM_PROMO") {
      const cfg = normalizeConfig("CUSTOM_PROMO", s.config) as any;
      const vouchers = Array.isArray((cfg as any).voucherImageIds) ? (cfg as any).voucherImageIds : [];
      for (const id of vouchers) {
        const n = Number(id);
        if (Number.isFinite(n) && n > 0) imageIds.push(n);
      }
      if (cfg.voucherLinks) {
        Object.values(cfg.voucherLinks).forEach((val: any) => {
          if (typeof val === "string" && val.startsWith("category:")) {
            const cid = Number(val.split(":")[1]);
            if (Number.isFinite(cid) && cid > 0) kategoriIds.push(cid);
          }
        });
      }
    }

    if (s.type === "FOOTER") {
      if ((s.config as any)?.useGlobalContact) {
        footerNeedsGlobalBranches = true;
      }
    }


    if (s.type === "ROOM_CATEGORY") {
      const cfg = s.config as any;
      const cards = Array.isArray(cfg.cards) ? cfg.cards : [];
      for (const c of cards) {
        const kId = Number(c?.kategoriId);
        if (Number.isFinite(kId) && kId > 0) kategoriIds.push(kId);

        const imgId = Number(c?.imageId);
        if (Number.isFinite(imgId) && imgId > 0) {
          imageIds.push(imgId);
        } else if (Number.isFinite(kId) && kId > 0) {
          // allow auto cover (fallback) when room card has kategoriId but no image
          autoCoverKategoriIds.push(kId);
        }
      }
    }

  }

  // ===== Prefetch product listing (latest) =====
  let productListingItems: any[] = [];
  if (needsProductListing) {
    productListingItems = await prisma.produk.findMany({
      orderBy: { id: "desc" },
      take: 60,
      select: {
        id: true,
        nama: true,
        slug: true,
        harga: true,
        promoAktif: true,
        promoTipe: true,
        promoValue: true,
        kategori: true,
        subkategori: true,
        mainImageId: true,
      },
    });

    for (const p of productListingItems as any[]) {
      const mainId = p.mainImageId ? Number(p.mainImageId) : null;
      if (mainId) imageIds.push(mainId);
      // Fallback for gallery images if needed, but for now avoiding the crash is priority
      // If we need gallery images, we should select `galeri: { select: { id: true } }` and map it.
      // But given the error, we just remove the invalid selection.
      const gId = pickFirstGalleryImageId((p as any).galeri?.map((g: any) => g.id) || []);
      if (gId) imageIds.push(gId);
    }
  }

  const uniqKategoriIds = Array.from(new Set(kategoriIds)).filter((n) => Number.isFinite(n));
  const uniqAutoCoverKategoriIds = Array.from(new Set(autoCoverKategoriIds)).filter((n) => Number.isFinite(n));
  const uniqImageIds = Array.from(new Set(imageIds)).filter((n) => Number.isFinite(n));
  const uniqProdukIds = Array.from(new Set(produkIds)).filter((n) => Number.isFinite(n));
  const uniqHighlightProdukIds = Array.from(new Set(highlightProdukIds)).filter((n) => Number.isFinite(n));
  const uniqBranchIds = Array.from(new Set(branchIds)).filter((n) => Number.isFinite(n));
  const uniqHubungiIds = Array.from(new Set(hubungiIds)).filter((n) => Number.isFinite(n));
  const uniqMediaIconKeys = Array.from(new Set(mediaIconKeys)).map((s) => String(s ?? "").trim()).filter(Boolean);

  // ===== Prefetch categories =====
  const kategoriMap = new Map<number, any>();
  if (uniqKategoriIds.length) {
    const kategoris = await prisma.kategoriProduk.findMany({
      where: { id: { in: uniqKategoriIds } },
      select: { id: true, nama: true, slug: true },
    });
    for (const k of kategoris as any[]) kategoriMap.set(Number(k.id), k);
  }

  // ===== Prefetch products =====
  const produkById = new Map<number, any>();
  if (uniqProdukIds.length) {
    const produk = await prisma.produk.findMany({
      where: { id: { in: uniqProdukIds } },
      select: {
        id: true,
        nama: true,
        slug: true,
        harga: true,
        promoAktif: true,
        promoTipe: true,
        promoValue: true,
        kategori: true,
        subkategori: true,
        mainImageId: true,
      },
    });

    for (const p of produk as any[]) {
      produkById.set(Number(p.id), p);
      const mainId = p.mainImageId ? Number(p.mainImageId) : null;
      if (mainId) uniqImageIds.push(mainId);

      const gId = pickFirstGalleryImageId(p.galleryImageIds || []);
      if (gId) uniqImageIds.push(gId);
    }
  }

  // ===== Auto cover for categories (use first product in kategori_produk_item order) =====
  const autoCoverImageIdByKategori = new Map<number, number>();
  if (uniqAutoCoverKategoriIds.length) {
    const items = await prisma.kategoriProdukItem.findMany({
      where: { kategoriId: { in: uniqAutoCoverKategoriIds } },
      orderBy: [{ kategoriId: "asc" }, { urutan: "asc" }, { id: "asc" }],
      select: { kategoriId: true, produkId: true },
    });

    const firstProdukIdByKategori = new Map<number, number>();
    for (const it of items as any[]) {
      const kId = Number(it.kategoriId);
      if (!firstProdukIdByKategori.has(kId) && it.produkId) {
        firstProdukIdByKategori.set(kId, Number(it.produkId));
      }
    }

    const produkIdsAuto = Array.from(new Set(Array.from(firstProdukIdByKategori.values()))).filter((n) => n > 0);

    if (produkIdsAuto.length) {
      const produkAuto = await prisma.produk.findMany({
        where: { id: { in: produkIdsAuto } },
        select: { id: true, mainImageId: true },
      });

      const produkAutoById = new Map<number, any>();
      for (const p of produkAuto as any[]) produkAutoById.set(Number(p.id), p);

      for (const [kategoriId, produkId] of firstProdukIdByKategori.entries()) {
        const p = produkAutoById.get(Number(produkId));
        const mainId = p?.mainImageId ? Number(p.mainImageId) : null;
        const galleryId = pickFirstGalleryImageId(p?.galleryImageIds || []);

        const chosen = mainId || galleryId;
        if (chosen) {
          autoCoverImageIdByKategori.set(Number(kategoriId), Number(chosen));
          uniqImageIds.push(Number(chosen));
        }
      }
    }
  }

  // ===== Prefetch images =====
  const imageMap = new Map<number, any>();
  if (uniqImageIds.length) {
    const imgs = await prisma.gambarUpload.findMany({
      where: { id: { in: Array.from(new Set(uniqImageIds)) } },
      select: { id: true, url: true },
    });
    for (const img of imgs as any[]) imageMap.set(Number(img.id), img);
  }

  // Auto cover URL by kategori
  const autoCoverUrlByKategori = new Map<number, string>();
  for (const [kategoriId, imgId] of autoCoverImageIdByKategori.entries()) {
    const url = imageMap.get(Number(imgId))?.url;
    if (url) autoCoverUrlByKategori.set(Number(kategoriId), String(url));
  }

  // ===== Prefetch branches (cabang_toko) =====
  const cabangMap = new Map<number, any>();
  if (uniqBranchIds.length > 0) {
    const cabangs = await prisma.cabangToko.findMany({
      where: { id: { in: uniqBranchIds } },
      select: { id: true, namaCabang: true, mapsUrl: true, urutan: true },
    });
    for (const b of cabangs as any[]) cabangMap.set(Number(b.id), b);
    for (const b of cabangs as any[]) cabangMap.set(Number(b.id), b);
  } else {
    // ALWAYS fetch at least 1 branch as fallback for Footer global contact
    // This handles cases where FOOTER might be implicit or flag check fails
    const cabangs = await prisma.cabangToko.findMany({
      take: 1,
      select: { id: true, namaCabang: true, mapsUrl: true, urutan: true },
    });
    for (const b of cabangs as any[]) cabangMap.set(Number(b.id), b);
  }

  // ===== Prefetch hubungi (Hubungi Kami) =====
  const hubungiById = new Map<number, any>();
  if (uniqHubungiIds.length) {
    const hubungis = await prisma.hubungi.findMany({
      where: { id: { in: uniqHubungiIds } },
      select: { id: true, nomor: true, prioritas: true },
      orderBy: { id: "asc" },
    });
    for (const h of hubungis as any[]) hubungiById.set(Number(h.id), h);
  } else {
    // Fallback: fetch ALL contacts for Footer global usage
    const hubungis = await prisma.hubungi.findMany({
      orderBy: { id: "asc" },
      select: { id: true, nomor: true, prioritas: true },
    });
    for (const h of hubungis as any[]) hubungiById.set(Number(h.id), h);
  }


  // ===== Prefetch media sosial (iconKey -> url) =====
  const mediaSosialByKey = new Map<string, any>();
  if (uniqMediaIconKeys.length) {
    const rows = await prisma.mediaSosial.findMany({
      where: { iconKey: { in: uniqMediaIconKeys } },
      select: { id: true, nama: true, iconKey: true, url: true, prioritas: true },
      orderBy: [{ prioritas: "desc" }, { id: "asc" }],
    });
    for (const r of rows as any[]) {
      const k = String((r as any).iconKey ?? "").trim();
      if (k) mediaSosialByKey.set(k, r);
    }
  } else {
    // Fallback: fetch ALL social media for Footer global usage
    const rows = await prisma.mediaSosial.findMany({
      orderBy: [{ prioritas: "desc" }, { id: "asc" }],
      select: { id: true, nama: true, iconKey: true, url: true, prioritas: true },
    });
    for (const r of rows as any[]) {
      const k = String((r as any).iconKey ?? "").trim();
      if (k) mediaSosialByKey.set(k, r);
    }
  }


  // Theme meta (e.g. backgroundTheme) for this themeKey
  const themeMetaRow = (allDrafts as any[]).find(
    (d) => String(d?.slug ?? "") === `${THEME_META_SLUG_PREFIX}${themeKey}`,
  );
  const themeMetaCfg = isObject((themeMetaRow as any)?.config) ? ((themeMetaRow as any).config as any) : {};
  const backgroundTheme =
    typeof themeMetaCfg?.backgroundTheme === "string" ? String(themeMetaCfg.backgroundTheme).trim() : "FOLLOW_NAVBAR";

  // ISOLATION FIX: Preview should NOT fallback to global NavbarSetting.
  // We default to "NAVY_GOLD" if the draft hasn't specified a theme yet.
  const navbarTheme =
    typeof themeMetaCfg?.navbarTheme === "string" ? String(themeMetaCfg.navbarTheme).trim() : "NAVY_GOLD";



  const themeName =
    typeof themeMetaCfg?.themeName === "string" ? String(themeMetaCfg.themeName).trim() : "";

  return { draftSections, categoryGridById, categoryCommerceById, kategoriMap, imageMap, autoCoverUrlByKategori, produkMap: produkById, productListingItems, cabangMap, hubungiById, mediaSosialByKey, backgroundTheme, themeName, navbarTheme };
}



export default async function TokoPreviewDraftPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const themeKey = normalizeThemeKey(readSp(sp, "theme") || "theme_1");
  const focus = upperType(readSp(sp, "focus"));
  const notice = readSp(sp, "notice").trim();
  const error = readSp(sp, "error").trim();
  const buildCloseUrl = (removeKeys: string[]) => {
    const params = new URLSearchParams();
    const del = new Set(removeKeys);
    if (sp && typeof sp === "object") {
      Object.entries(sp).forEach(([k, v]) => {
        if (del.has(k)) return;
        if (Array.isArray(v)) {
          v.forEach((item) => {
            if (item !== undefined && item !== null) params.append(k, String(item));
          });
        } else if (v !== undefined && v !== null) {
          params.set(k, String(v));
        }
      });
    }
    const qs = params.toString();
    return `${ADMIN_TOKO_PATH}/preview${qs ? `?${qs}` : ""}`;
  };
  const closeNoticeUrl = buildCloseUrl(["notice", "error", "r"]);
  const noticeAutoCloseScript =
    notice || error
      ? `
(() => {
  const closeUrl = ${JSON.stringify(closeNoticeUrl)};
  setTimeout(() => {
    try {
      window.history.replaceState({}, "", closeUrl);
      const wrap = document.querySelector('[data-preview-notice="1"]');
      if (wrap) wrap.remove();
    } catch {
      window.location.href = closeUrl;
    }
  }, 3000);
})();
`
      : "";

  // Navbar theme source-of-truth:
  // STRICT ISOLATION: DRAFT CONFIG ONLY.
  // We do NOT fallback to global NavbarSetting to prevent "theme leak" (cross-talk between drafts).
  // If a draft has no setting, it defaults to "NAVY_GOLD". The user must explicitly SAVE the theme to "lock" it.
  const { draftSections, categoryGridById, categoryCommerceById, kategoriMap, imageMap, autoCoverUrlByKategori, produkMap, productListingItems, cabangMap, hubungiById, mediaSosialByKey, backgroundTheme, themeName, navbarTheme: rawNavbarTheme } =
    await fetchPreviewThemeOptimized(themeKey);

  const navbarTheme = normalizeThemeAttr(rawNavbarTheme || "NAVY_GOLD") || "NAVY_GOLD";

  const displayThemeName = themeName || themeKey;

  const pageThemeAttr = resolveEffectiveTheme(backgroundTheme, navbarTheme);

  return (
    <>
      <Navbar themeOverride={navbarTheme} />

      <div className={ui.floatingBar}>
        <a className={ui.floatingLink} href={`${ADMIN_TOKO_PATH}?theme=${encodeURIComponent(themeKey)}`}>
          ← Kembali ke /toko
        </a>

        <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 900 }}>
          Preview Draft Theme: <span style={{ color: "white" }}>{displayThemeName}</span>
        </span>

        <div style={{ display: "inline-flex", gap: 10, marginLeft: "auto" }}>
          <form action={publishTheme} style={{ display: "inline-flex" }}>
            <input type="hidden" name="themeKey" value={themeKey} />
            <button type="submit" className={ui.publishBtn}>
              Publish ke Website Utama
            </button>
          </form>

          <form action={unpublishTheme} style={{ display: "inline-flex" }}>
            <button type="submit" className={ui.dangerBtn}>
              Hapus Publish
            </button>
          </form>
        </div>
      </div>

      <main className={`${homeStyles.homepageMain} ${ui.pageBg}`} data-theme={pageThemeAttr}>
        <div className={ui.noticeWrap} data-preview-notice="1">
          {notice ? (
            <div className={ui.notice}>
              <strong>Info:</strong> {notice}
            </div>
          ) : null}

          {error ? (
            <div className={ui.error}>
              <strong>Error:</strong> {error}
            </div>
          ) : null}
        </div>
        {noticeAutoCloseScript ? <script dangerouslySetInnerHTML={{ __html: noticeAutoCloseScript }} /> : null}

        {draftSections.length ? (
          <div className={focus ? ui.focusStage : ui.contents}>
            <div className={focus ? ui.focusStageInner : ui.contents}>
              {draftSections.map((section) => {
                const pageThemeTokens = getHeroThemeTokens(pageThemeAttr);
                const t = upperType(section.type);
                if (focus && t !== focus) return null;

                // CATEGORY GRID
                if (t === "CATEGORY_GRID") {
                  const data = categoryGridById.get(section.id);
                  if (!data) return null;

                  const categoryGridData = buildCategoryGridProps({
                    sectionTitle: section.title,
                    columns: data.columns,
                    maxItems: data.maxItems,
                    items: data.items,
                    kategoriMap,
                    imageMap,
                    autoCoverUrlByKategori,
                  });

                  const gridThemeRaw = String(((section.config as any)?.sectionTheme ?? "")).trim();
                  const titleTextColorRaw = String(((section.config as any)?.titleTextColor ?? "")).trim();
                  const titleTextColor =
                    titleTextColorRaw === "NAVY"
                      ? "#0b1d3a"
                      : titleTextColorRaw === "GOLD"
                        ? "#d4af37"
                        : titleTextColorRaw === "WHITE"
                          ? "#ffffff"
                          : null;

                  const gridResolvedTheme = resolveEffectiveTheme(gridThemeRaw || "FOLLOW_NAVBAR", navbarTheme);
                  const vars = categoryGridVarsFromTheme(gridResolvedTheme);

                  const sectionBgRaw = (section.config as any).sectionBgTheme;
                  const sectionBg = parseCustomPromoBgTheme(sectionBgRaw);
                  const customPalette = resolveCustomPromoPalette(sectionBg, navbarTheme);

                  if (customPalette) {
                    return (
                      <div
                        key={section.id}
                        className={ui.previewSectionFull}
                        style={{
                          background: customPalette.bg,
                          color: customPalette.fg,
                        }}
                      >
                        <div
                          className={ui.previewSection}
                          style={{
                            ["--cg-card-bg" as any]: vars.cardBg,
                            ["--cg-card-fg" as any]: vars.insideText,
                            ["--cg-element" as any]: vars.outsideText,
                            ["--cg-title-color" as any]: titleTextColor ?? customPalette.fg,
                            ["--cg-card-border" as any]: vars.border,
                          }}
                        >
                          <CategoryGridPreview data={categoryGridData} />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={section.id}
                      // Inline CSS variables so CATEGORY_GRID theme works even if other CSS modules hardcode colors.
                      style={{
                        ["--cg-card-bg" as any]: vars.cardBg,
                        ["--cg-card-fg" as any]: vars.insideText,
                        ["--cg-element" as any]: vars.outsideText,
                        ["--cg-title-color" as any]: titleTextColor ?? vars.outsideText,
                        ["--cg-card-border" as any]: vars.border,
                      }}
                    >
                      <CategoryGridPreview data={categoryGridData} />
                    </div>
                  );
                }

                if (t === "CATEGORY_GRID_COMMERCE") {
                  const data = categoryCommerceById.get(section.id);
                  if (!data) return null;

                  const rawMode = String((section.config as any)?.layout?.mode ?? (section.config as any)?.mode ?? "clean").toLowerCase();
                  const mode = rawMode === "reverse" ? "reverse" : rawMode === "commerce" ? "commerce" : "clean";
                  const sectionThemeRaw = String((section.config as any)?.sectionTheme ?? "FOLLOW_NAVBAR").trim();
                  const sectionThemeResolved = resolveEffectiveTheme(sectionThemeRaw, navbarTheme);
                  const themeTokens = commerceThemeTokens(sectionThemeResolved);

                  const sectionBgRaw = (section.config as any).sectionBgTheme;
                  const sectionBg = parseCustomPromoBgTheme(sectionBgRaw);
                  const customPalette = resolveCustomPromoPalette(sectionBg, navbarTheme);

                  const commerceGridData = buildCategoryCommerceGridProps({
                    sectionTitle: section.title,
                    maxItems: data.maxItems,
                    mode,
                    tabs: Array.isArray((section.config as any)?.tabs) ? (section.config as any).tabs : [],
                    items: data.items,
                    kategoriMap,
                    imageMap,
                    autoCoverUrlByKategori,
                    fallbackUrl: FALLBACK_CATEGORY_IMAGE_URL,
                  });

                  if (customPalette) {
                    const useSectionTheme = sectionBg === "FOLLOW_NAVBAR";
                    // Use section theme tokens if standard theme is rendering (i.e. not using a custom bg override)
                    const finalBg = useSectionTheme ? themeTokens.bg : customPalette.bg;
                    const finalTextColor = useSectionTheme ? themeTokens.element : (customPalette.fg ?? themeTokens.element);

                    return (
                      <div
                        key={section.id}
                        className={ui.previewSectionFull}
                        style={{
                          background: finalBg,
                          color: finalTextColor,
                        }}
                      >
                        <div
                          className={`${ui.themeScope} ${ui.previewSection}`}
                          data-theme={sectionThemeResolved}
                          style={{
                            padding: "56px 0",
                            ["--t-bg" as any]: "transparent", // Use wrapper bg instead
                            ["--t-element" as any]: finalTextColor, // Keep accent
                            ["--t-card" as any]: themeTokens.card,
                            ["--t-card-fg" as any]: finalTextColor,
                            ["--t-card-border" as any]: themeTokens.cardBorder,
                            ["--t-cta-bg" as any]: themeTokens.ctaBg,
                            ["--t-cta-fg" as any]: themeTokens.ctaFg,
                            ["--t-cta-hover-bg" as any]: themeTokens.ctaHoverBg,
                            ["--t-cta-hover-fg" as any]: themeTokens.ctaHoverFg,
                            ["--t-divider" as any]: themeTokens.divider,
                          }}
                        >
                          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
                            {commerceGridData.title ? (
                              <h2 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 16px", color: "var(--t-element)" }}>
                                {commerceGridData.title}
                              </h2>
                            ) : null}
                            {commerceGridData.items.length >= 1 ? (
                              <CategoryCommerceColumns {...commerceGridData} viewAllHref={commerceGridData.mode === "reverse" ? "/kategori" : null} />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const textColor = mode === "clean" ? pageThemeTokens.element : "var(--t-card-fg)";
                  return (
                    <div
                      key={section.id}
                      className={ui.themeScope}
                      data-theme={sectionThemeResolved}
                      style={{
                        background: mode === "clean" ? "transparent" : "var(--t-card)",
                        color: textColor,
                        padding: "24px 0",
                        ["--t-bg" as any]: themeTokens.bg,
                        ["--t-element" as any]: themeTokens.element,
                        ["--t-card" as any]: themeTokens.card,
                        ["--t-card-fg" as any]: mode === "clean" ? textColor : themeTokens.cardFg,
                        ["--t-card-border" as any]: themeTokens.cardBorder,
                        ["--t-cta-bg" as any]: themeTokens.ctaBg,
                        ["--t-cta-fg" as any]: themeTokens.ctaFg,
                        ["--t-cta-hover-bg" as any]: themeTokens.ctaHoverBg,
                        ["--t-cta-hover-fg" as any]: themeTokens.ctaHoverFg,
                        ["--t-divider" as any]: themeTokens.divider,
                      }}
                    >
                      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
                        {commerceGridData.title ? (
                          <h2 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 16px", color: "var(--t-element)" }}>
                            {commerceGridData.title}
                          </h2>
                        ) : null}
                        {commerceGridData.items.length >= 1 ? (
                          <CategoryCommerceColumns
                            {...commerceGridData}
                            viewAllHref={commerceGridData.mode === "reverse" ? "/kategori" : null}
                          />
                        ) : null}
                      </div>
                    </div>
                  );
                }

                // TEXT_SECTION
                if (t === "TEXT_SECTION") {
                  const cfg = normalizeConfig(t, section.config) as any;
                  const blocks = Array.isArray(cfg.blocks) ? cfg.blocks : [];
                  const fallbackText = String(cfg.text ?? "").trim();
                  const blockItems = blocks.length
                    ? blocks
                    : fallbackText
                      ? [{ mode: String(cfg.mode ?? "body"), text: fallbackText }]
                      : [];
                  if (!blockItems.length) return null;

                  const mode = String(cfg.mode ?? "body");
                  const align = String(cfg.align ?? "left");
                  const width = String(cfg.width ?? "normal");
                  const sectionThemeRaw = String(cfg.sectionTheme ?? "FOLLOW_NAVBAR").trim();
                  const sectionThemeResolved = resolveEffectiveTheme(sectionThemeRaw, navbarTheme);
                  const themeTokens = commerceThemeTokens(sectionThemeResolved);

                  const modeClass =
                    mode === "heading"
                      ? ui.textHeading
                      : mode === "subtitle"
                        ? ui.textSubtitle
                        : mode === "caption"
                          ? ui.textCaption
                          : ui.textBody;
                  const alignClass = align === "center" ? ui.textAlignCenter : ui.textAlignLeft;
                  const widthClass = width === "wide" ? ui.textWidthWide : ui.textWidthNormal;

                  return (
                    <section
                      key={section.id}
                      className={ui.textSection}
                      style={{
                        ["--ts-text" as any]: themeTokens.cardFg,
                        ["--ts-bg" as any]: themeTokens.bg,
                      }}
                    >
                      <div className={`${ui.textBlock} ${alignClass} ${widthClass}`}>
                        <div className={ui.textStack}>
                          {blockItems.map((b: any, idx: number) => {
                            const m = String(b?.mode ?? mode);
                            const text = String(b?.text ?? "").trim();
                            if (!text) return null;
                            const cls =
                              m === "heading"
                                ? ui.textHeading
                                : m === "subtitle"
                                  ? ui.textSubtitle
                                  : m === "caption"
                                    ? ui.textCaption
                                    : ui.textBody;
                            return (
                              <p key={idx} className={`${ui.textBase} ${cls}`}>
                                {text}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    </section>
                  );
                }

                // HERO
                if (t === "HERO") {
                  const cfg = normalizeConfig(t, section.config) as any;
                  const heroContent = ((cfg as any).heroContent ?? {}) as any;

                  let eyebrow = String(cfg.eyebrow ?? "").trim();
                  let headline = String(cfg.headline ?? "").trim();
                  let subheadline = String(cfg.subheadline ?? "").trim();
                  let ctaLabel = String(cfg.ctaLabel ?? "").trim();
                  let ctaHref = String(cfg.ctaHref ?? "").trim();

                  if (heroContent) {
                    if (!eyebrow) eyebrow = String(heroContent.eyebrow ?? "").trim();
                    if (!headline) headline = String(heroContent.headline ?? "").trim();
                    if (!subheadline) subheadline = String(heroContent.subheadline ?? "").trim();
                    if (!ctaLabel) ctaLabel = String(heroContent.ctaLabel ?? "").trim();
                    if (!ctaHref) ctaHref = String(heroContent.ctaHref ?? "").trim();
                  }

                  if (!eyebrow) eyebrow = "";

                  // Hide eyebrow if it looks like a generic theme name
                  if (/^(theme[\s_-]*\d+|untitled|draft)/i.test(eyebrow)) {
                    eyebrow = "";
                  }

                  if (!headline) headline = "";
                  if (!subheadline) subheadline = "";

                  const badges: string[] = Array.isArray(heroContent.badges)
                    ? heroContent.badges
                    : Array.isArray(cfg.badges)
                      ? cfg.badges
                      : [];
                  const highlights: string[] = Array.isArray(heroContent.highlights)
                    ? heroContent.highlights
                    : Array.isArray(cfg.highlights)
                      ? cfg.highlights
                      : [];
                  const trustChips: string[] = Array.isArray(heroContent.trustChips)
                    ? heroContent.trustChips
                    : Array.isArray(cfg.trustChips)
                      ? cfg.trustChips
                      : [];

                  const finalBadges =
                    badges.length > 0 ? badges.slice(0, 4) : [];

                  const finalHighlights =
                    highlights.length > 0
                      ? highlights.slice(0, 6)
                      : [];

                  const finalTrust = trustChips.length > 0 ? trustChips.slice(0, 6) : [];

                  const heroThemeClass = heroThemeClassFromConfig(
                    String(cfg.sectionTheme ?? cfg.heroTheme ?? "FOLLOW_NAVBAR"),
                    navbarTheme,
                  );

                  const imageId = Number(cfg.imageId);
                  const imgUrl = Number.isFinite(imageId) && imageId > 0 ? imageMap.get(imageId)?.url ?? null : null;

                  const miniRaw: { title: string; desc: string }[] = Array.isArray(heroContent.miniInfo)
                    ? heroContent.miniInfo
                    : Array.isArray(cfg.miniInfo)
                      ? cfg.miniInfo
                      : [];
                  const mini = miniRaw.length
                    ? miniRaw
                      .map((m) => ({
                        title: String(m?.title ?? "").trim(),
                        desc: String(m?.desc ?? "").trim(),
                      }))
                      .filter((m) => m.title || m.desc)
                      .slice(0, 3)
                    : [];
                  const lookbookTitle =
                    String(heroContent.floatLookbookTitle ?? cfg.floatLookbookTitle ?? "").trim();
                  const lookbookSubtitle =
                    String(heroContent.floatLookbookSubtitle ?? cfg.floatLookbookSubtitle ?? "").trim();
                  const promoTitle =
                    String(heroContent.floatPromoTitle ?? cfg.floatPromoTitle ?? "").trim();
                  const promoText =
                    String(heroContent.floatPromoText ?? cfg.floatPromoText ?? "").trim();

                  // Strict content check (matching app/page.tsx)
                  const hasContent = Boolean(imgUrl || eyebrow || headline || subheadline || finalBadges.length || finalHighlights.length || finalTrust.length || mini.length || lookbookTitle || promoTitle);
                  if (!hasContent) return null;

                  return (
                    <section key={section.id} className={`${homeStyles.hero} ${ui.hero} ${ui.heroV1} ${heroThemeClass}`}>
                      <div className={ui.heroInner}>
                        <div className={ui.heroText}>
                          <div className={ui.heroTopRow}>
                            {eyebrow ? <div className={ui.heroEyebrow}>{eyebrow}</div> : null}

                            <div className={ui.heroTopBadges}>
                              {finalBadges.map((b, idx) => (
                                <span key={idx} className={ui.heroBadge}>
                                  {b}
                                </span>
                              ))}
                            </div>
                          </div>

                          {headline ? <h1 className={ui.heroTitle}>{headline}</h1> : null}
                          {subheadline ? <p className={ui.heroDescription}>{subheadline}</p> : null}

                          {ctaLabel ? (
                            <div className={ui.heroActions}>
                              <a className={`${ui.heroCta} ${ui.heroCtaPrimary}`} href={ctaHref || "#"}>
                                {ctaLabel}
                              </a>
                            </div>
                          ) : null}

                          <ul className={ui.heroHighlights}>
                            {finalHighlights.map((text, idx) => (
                              <li key={idx} className={ui.heroHighlightItem}>
                                <span className={ui.heroHighlightIcon}>✓</span>
                                <span className={ui.heroHighlightText}>{text}</span>
                              </li>
                            ))}
                          </ul>

                          <div className={ui.heroTrustRow}>
                            {finalTrust.map((text, idx) => (
                              <span key={idx} className={ui.heroTrustChip}>
                                {text}
                              </span>
                            ))}
                          </div>

                          <div className={ui.heroMiniInfoRow}>
                            {mini.map((m, idx) => (
                              <div key={idx} className={ui.heroMiniInfoCard}>
                                <div className={ui.heroMiniInfoTitle}>{m.title}</div>
                                <div className={ui.heroMiniInfoDesc}>{m.desc}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className={ui.heroMedia}>
                          <div className={ui.heroMediaBg} aria-hidden="true" />
                          {imgUrl ? (
                            <SecureImage className={ui.heroImage} src={imgUrl} alt={headline || "Hero Image"} />
                          ) : (
                            <div className={ui.heroMediaPlaceholder} aria-hidden="true" />
                          )}

                          {/* Decorative floating cards (no extra CTA button) */}
                          <div className={ui.heroFloatingCards} aria-hidden="true">
                            <div className={`${ui.heroFloatCard} ${ui.heroFloatCardRight}`}>
                              <div className={ui.heroFloatLabel}>{lookbookTitle}</div>
                              <div className={ui.heroFloatMeta}>
                                <span className={ui.heroFloatDot} /> {lookbookSubtitle}
                              </div>
                            </div>

                            <div className={`${ui.heroFloatCard} ${ui.heroFloatCardWide}`}>
                              <div className={ui.heroFloatLabel}>{promoTitle}</div>
                              <div className={ui.heroFloatRow}>
                                <span className={ui.heroFloatDot} />
                                <span className={ui.heroFloatRowText}>{promoText}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                }
                // PRODUCT CAROUSEL
                if (t === "PRODUCT_CAROUSEL") {
                  const cfg = normalizeConfig(t, section.config) as any;
                  const desc = String(cfg.description ?? "").trim();
                  const showPrice = cfg.showPrice === undefined ? true : Boolean(cfg.showPrice);
                  const showCta = cfg.showCta === undefined ? true : Boolean(cfg.showCta);

                  // Align theme resolution with Frontend
                  const sectionThemeRaw = String((cfg as any).sectionTheme ?? (cfg as any).carouselTheme ?? (cfg as any).theme ?? "FOLLOW_NAVBAR").trim();
                  const sectionTheme = resolveEffectiveTheme(sectionThemeRaw, navbarTheme);
                  const themeTokens = getHeroThemeTokens(sectionTheme);

                  // Resolve Background & Text Palette
                  const bgThemeRaw = (cfg as any).sectionBgTheme;
                  const palette = resolveCustomPromoPalette(bgThemeRaw, navbarTheme);
                  const hasBgOverride = bgThemeRaw && bgThemeRaw !== "FOLLOW_NAVBAR";
                  const bgStyle = hasBgOverride ? { backgroundColor: palette.bg, color: palette.fg, ["--t-element" as any]: palette.fg } : {};

                  const ids = Array.isArray(cfg.productIds) ? cfg.productIds : [];
                  const products = ids.map((id: any) => produkMap.get(Number(id))).filter(Boolean) as any[];

                  return (
                    <section
                      key={section.id}
                      className={hasBgOverride ? ui.previewSectionFull : ui.previewSection}
                      style={
                        hasBgOverride
                          ? { ...bgStyle, padding: "32px 0", marginBottom: 28 }
                          : { ...bgStyle }
                      }
                    >
                      <div
                        className={hasBgOverride ? ui.previewSection : undefined}
                        style={
                          hasBgOverride
                            ? { margin: "0 auto", padding: "0 16px", background: "transparent", border: "none" }
                            : undefined
                        }
                      >
                        {section.title ? (
                          <h2 className={ui.sectionTitle}>{section.title}</h2>
                        ) : null}

                        {desc ? <div style={{ marginBottom: 10, fontSize: 13, opacity: 0.72, maxWidth: 820, color: themeTokens.cardFg }}>{desc}</div> : null}

                        {products.length ? (
                          <div className={ui.pcRow}>
                            {products.map((p: any) => {
                              const mainId = p.mainImageId ? Number(p.mainImageId) : null;
                              const gId = pickFirstGalleryImageId(p.galleryImageIds || []);
                              const pickedId = mainId || gId;
                              const imgUrl = pickedId ? imageMap.get(Number(pickedId))?.url ?? null : null;

                              const href = p.slug ? `/produk/${p.slug}` : "#";
                              const pr = computeHargaSetelahPromo(p);
                              const metaParts = [p.kategori, p.subkategori].filter(Boolean);
                              const priceNode = showPrice ? (
                                pr.isPromo ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                                      <span style={{ fontWeight: 800 }}>{formatRupiah(pr.hargaFinal)}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                                      <span style={{ textDecoration: "line-through", opacity: 0.6 }}>
                                        {formatRupiah(pr.hargaAsli)}
                                      </span>
                                      <span style={{ fontWeight: 800, color: themeTokens.element }}>{pr.promoLabel}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <>{formatRupiah(p.harga)}</>
                                )
                              ) : null;

                              return (
                                <article key={Number(p.id)} className={ui.pcCard} style={{ background: themeTokens.card, border: `1px solid ${themeTokens.cardBorder}`, color: themeTokens.cardFg }}>
                                  {imgUrl ? (
                                    <div className={ui.pcMedia}>
                                      <div className={ui.pcMediaBlur} style={{ backgroundImage: `url(${imgUrl})` }} />
                                      <SecureImage className={ui.pcMediaImg} src={imgUrl} alt={String(p.nama ?? "Produk")} />
                                    </div>
                                  ) : (
                                    <div className={ui.pcMediaPlaceholder} />
                                  )}

                                  <div className={ui.pcBody}>
                                    <div className={ui.pcTitle} style={{ color: themeTokens.cardFg }}>{String(p.nama ?? "Produk")}</div>

                                    {showPrice ? <div className={ui.pcPrice} style={{ color: themeTokens.cardFg }}>{priceNode}</div> : null}
                                    <div className={ui.pcMeta} style={{ color: themeTokens.cardFg, opacity: 0.7 }}>{metaParts.length ? metaParts.join(" • ") : ""}</div>

                                    <div className={ui.pcCtaWrap}>
                                      {showCta ? (
                                        <a className={ui.pcCta} href={href} style={{ background: themeTokens.ctaBg, color: themeTokens.ctaFg, border: `1px solid ${themeTokens.ctaBg}` }}>
                                          Lihat Produk
                                        </a>
                                      ) : (
                                        <div className={ui.pcCtaPlaceholder} />
                                      )}
                                    </div>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        ) : (
                          <div className={ui.notice}>Belum ada produk dipilih.</div>
                        )}
                      </div>
                    </section>
                  );
                }              // HIGHLIGHT COLLECTION
                // PRODUCT LISTING
                if (t === "PRODUCT_LISTING") {
                  const cfg = normalizeConfig(t, section.config) as any;
                  // Aligning theme fallback with frontend logic
                  const sectionThemeRaw = String((cfg as any).sectionTheme ?? (cfg as any).carouselTheme ?? (cfg as any).theme ?? "FOLLOW_NAVBAR").trim();
                  const sectionTheme = resolveEffectiveTheme(sectionThemeRaw, navbarTheme);
                  const themeTokens = getHeroThemeTokens(sectionTheme);

                  // Resolve Background & Text Palette
                  const bgThemeRaw = (cfg as any).sectionBgTheme;
                  const palette = resolveCustomPromoPalette(bgThemeRaw, navbarTheme);
                  const hasBgOverride = bgThemeRaw && bgThemeRaw !== "FOLLOW_NAVBAR";
                  const bgStyle = hasBgOverride ? { backgroundColor: palette.bg, color: palette.fg, ["--t-element" as any]: palette.fg } : {};

                  const productIds = Array.isArray(cfg.productIds) ? cfg.productIds : [];
                  let products: any[] = [];

                  if (productIds.length > 0) {
                    products = productIds.map((id: any) => produkMap.get(Number(id))).filter(Boolean) as any[];
                  } else {
                    products = Array.isArray(productListingItems) ? productListingItems : [];
                  }

                  const showMore = true;

                  if (!products.length) {
                    return (
                      <section key={section.id} className={ui.previewSection}>
                        {section.title ? <h2 className={ui.sectionTitle}>{section.title}</h2> : null}
                        <div className={ui.notice}>Belum ada produk tersedia.</div>
                      </section>
                    );
                  }

                  return (
                    <section
                      key={section.id}
                      className={hasBgOverride ? ui.previewSectionFull : ui.previewSection}
                      style={
                        hasBgOverride
                          ? { ...bgStyle, padding: "32px 0", marginBottom: 28 }
                          : { ...bgStyle }
                      }
                    >
                      <div
                        className={hasBgOverride ? ui.previewSection : undefined}
                        style={
                          hasBgOverride
                            ? { margin: "0 auto", padding: "0 16px", background: "transparent", border: "none" }
                            : undefined
                        }
                      >
                        {section.title ? <h2 className={ui.sectionTitle}>{section.title}</h2> : null}

                        <div className={ui.productListingGrid}>
                          {products.map((p: any) => {
                            const mainId = p.mainImageId ? Number(p.mainImageId) : null;
                            const gId = pickFirstGalleryImageId(p.galleryImageIds || []);
                            const pickedId = mainId || gId;
                            const imgUrl = pickedId ? imageMap.get(Number(pickedId))?.url ?? null : null;
                            const href = p.slug ? `/produk/${p.slug}` : "#";
                            const pr = computeHargaSetelahPromo(p);
                            const metaParts = [p.kategori, p.subkategori].filter(Boolean);

                            return (
                              <article key={Number(p.id)} className={ui.productListingItem}>
                                <Link href={href} className={ui.pcCard} style={{ background: themeTokens.card, border: `1px solid ${themeTokens.cardBorder}`, color: themeTokens.cardFg, textDecoration: "none", width: "100%", height: "100%" }}>
                                  {imgUrl ? (
                                    <div className={ui.pcMedia}>
                                      <div className={ui.pcMediaBlur} style={{ backgroundImage: `url(${imgUrl})` }} />
                                      <SecureImage className={ui.pcMediaImg} src={imgUrl} alt={String(p.nama ?? "Produk")} />
                                    </div>
                                  ) : (
                                    <div className={ui.pcMediaPlaceholder} />
                                  )}

                                  <div className={ui.pcBody}>
                                    <div className={ui.pcTitle} style={{ color: themeTokens.cardFg }}>{String(p.nama || "Nama Produk")}</div>

                                    <div className={ui.pcPrice} style={{ color: themeTokens.cardFg }}>
                                      {pr.isPromo ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                                            <span style={{ fontWeight: 800 }}>{formatRupiah(pr.hargaFinal)}</span>
                                          </div>
                                          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                                            <span style={{ textDecoration: "line-through", opacity: 0.6 }}>
                                              {formatRupiah(pr.hargaAsli)}
                                            </span>
                                            <span style={{ fontWeight: 800, color: themeTokens.element }}>{pr.promoLabel}</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <>{formatRupiah(p.harga)}</>
                                      )}
                                    </div>
                                    <div className={ui.pcMeta} style={{ color: themeTokens.cardFg, opacity: 0.7 }}>{metaParts.length ? metaParts.join(" · ") : ""}</div>
                                  </div>
                                </Link>
                              </article>
                            );
                          })}
                        </div>

                        {showMore ? (
                          <div className={ui.productListingFooter}>
                            <a className={ui.productListingMore} href="/produk" style={{ background: themeTokens.ctaBg, color: themeTokens.ctaFg, border: `1px solid ${themeTokens.ctaBg}` }}>
                              Tampilkan Semua
                            </a>
                          </div>
                        ) : null}
                      </div>
                    </section>
                  );
                }

                // HIGHLIGHT COLLECTION
                if (t === "HIGHLIGHT_COLLECTION") {
                  const cfg = normalizeConfig(t, section.config) as any;

                  const heroId = Number(cfg.heroImageId);
                  const heroUrl = Number.isFinite(heroId) && heroId > 0 ? imageMap.get(heroId)?.url ?? null : null;

                  const headline = String(cfg.headline ?? "").trim();
                  const description = String(cfg.description ?? "").trim();

                  const ctaText = String(cfg.ctaText ?? "").trim();
                  const ctaHref = String(cfg.ctaHref ?? "").trim();

                  const layout = String(cfg.layout ?? "FEATURED_LEFT");
                  const sectionThemeResolved = resolveEffectiveTheme(cfg.sectionTheme ?? "FOLLOW_NAVBAR", navbarTheme);

                  const productIds: number[] = Array.isArray(cfg.productIds) ? cfg.productIds : [];
                  const products = productIds.map((id) => produkMap.get(Number(id))).filter(Boolean) as any[];

                  const hasOverlayContent = Boolean(headline || description || (ctaText && ctaHref));
                  const useOverlay = Boolean(heroUrl) && hasOverlayContent;

                  return (
                    <section key={section.id} className={ui.previewSection}>
                      <article
                        className={ui.hcSection}
                        data-theme={sectionThemeResolved}
                        data-layout={layout}
                        data-hc-layout={layout}
                        data-hc-nohero={!heroUrl ? "1" : undefined}
                      >
                        <div className={ui.hcInner}>
                          {/* Keep header ONLY if we are not using the hero overlay */}
                          {!useOverlay ? (
                            <header className={ui.hcHeader}>
                              {headline ? <div className={ui.hcTitle}>{headline}</div> : null}
                              {description ? <div className={ui.hcDesc}>{description}</div> : null}

                              {ctaText && ctaHref ? (
                                <a className={ui.hcCta} href={ctaHref}>
                                  {ctaText}
                                </a>
                              ) : null}
                            </header>
                          ) : null}

                          <div className={ui.hcGrid}>
                            {heroUrl ? (
                              <div className={ui.hcHero}>
                                <div className={ui.hcHeroMedia}>
                                  <div className={ui.hcHeroMediaBlur} style={{ backgroundImage: `url(${heroUrl})` }} />
                                  <SecureImage className={ui.hcHeroMediaImg} src={heroUrl} alt={headline || "Highlight"} />

                                  {useOverlay ? (
                                    <div className={ui.hcHeroOverlay}>
                                      <div className={ui.hcHeroGlass}>
                                        {headline ? <div className={ui.hcHeroOverlayTitle}>{headline}</div> : null}
                                        {description ? <div className={ui.hcHeroOverlayDesc}>{description}</div> : null}

                                        {ctaText && ctaHref ? (
                                          <a className={ui.hcHeroOverlayCta} href={ctaHref}>
                                            {ctaText}
                                          </a>
                                        ) : null}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}

                            <div className={ui.hcItems}>
                              {products.length ? (
                                products.map((p: any) => {
                                  const mainId = p.mainImageId ? Number(p.mainImageId) : null;
                                  const gId = pickFirstGalleryImageId(p.galleryImageIds || []);
                                  const pickedId = mainId || gId;
                                  const imgUrl = pickedId ? imageMap.get(Number(pickedId))?.url ?? null : null;

                                  const href = p.slug ? `/produk/${p.slug}` : "#";
                                  const pr = computeHargaSetelahPromo(p);
                                  const priceNode = pr.isPromo ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                                        <span style={{ fontWeight: 800 }}>{formatRupiah(pr.hargaFinal)}</span>
                                      </div>
                                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                                        <span style={{ textDecoration: "line-through", opacity: 0.6 }}>
                                          {formatRupiah(pr.hargaAsli)}
                                        </span>
                                        <span style={{ fontWeight: 800 }}>{pr.promoLabel}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <>{formatRupiah(p.harga)}</>
                                  );

                                  return (
                                    <a key={Number(p.id)} href={href} className={ui.hcItem}>
                                      {imgUrl ? (
                                        <div className={ui.hcItemMedia}>
                                          <div className={ui.hcItemMediaBlur} style={{ backgroundImage: `url(${imgUrl})` }} />
                                          <SecureImage className={ui.hcItemMediaImg} src={imgUrl} alt={String(p.nama ?? "Produk")} />
                                        </div>
                                      ) : (
                                        <div className={ui.hcItemEmptyMedia} />
                                      )}

                                      <div className={ui.hcItemBody}>
                                        <div className={ui.hcItemTitle}>{String(p.nama ?? "Produk")}</div>
                                        {p.harga ? <div className={ui.hcItemPrice}>{priceNode}</div> : null}
                                      </div>
                                    </a>
                                  );
                                })
                              ) : (
                                <div className={ui.notice}>Belum ada produk dipilih.</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    </section>
                  );
                }


                // BRANCHES (Cabang Toko)
                if (t === "BRANCHES") {
                  const cfg = normalizeConfig(t, section.config) as any;
                  const sectionTitle = section.title || "";

                  // Layout options:
                  // - carousel: horizontal scroll (best when cards are many)
                  // - grid: responsive grid (best when cards are few)
                  // Rule in preview: if admin chooses carousel BUT branches <= 5, render as grid so it doesn't look "kosong".
                  const layoutRequested = String(cfg.layout ?? "carousel") === "grid" ? "grid" : "carousel";

                  // Card theme - controls the card appearance
                  const sectionThemeResolved = resolveEffectiveTheme(cfg.sectionTheme ?? "FOLLOW_NAVBAR", navbarTheme);
                  const cardThemeClass = sectionThemeResolved ? `theme-${String(sectionThemeResolved).toLowerCase()}` : "";
                  const colors = getHeroThemeTokens(sectionThemeResolved);

                  // Section background theme - separate from card theme
                  const sectionBgRaw = cfg.sectionBgTheme;
                  const sectionBg = parseCustomPromoBgTheme(sectionBgRaw);
                  const bgPalette = resolveCustomPromoPalette(sectionBg, navbarTheme);

                  const selectedIds: number[] = Array.isArray(cfg.branchIds) ? cfg.branchIds : [];
                  const branches = selectedIds
                    .map((id: any) => cabangMap.get(Number(id)))
                    .filter(Boolean)
                    .sort((a: any, b: any) => {
                      const au = a?.urutan == null ? 1e9 : Number(a.urutan);
                      const bu = b?.urutan == null ? 1e9 : Number(b.urutan);
                      if (au !== bu) return au - bu;
                      return Number(a.id) - Number(b.id);
                    });

                  const count = branches.length;
                  const isSingle = count === 1;
                  const layoutEffective = layoutRequested === "carousel" && count > 0 && count <= 5 ? "grid" : layoutRequested;

                  const gridStyle: any = {
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    width: "100%",
                  };

                  const cardStyleSingle: any = {
                    width: "100%",
                    maxWidth: "100%",
                  };

                  const cardStyleGrid: any = {
                    width: "100%",
                    maxWidth: "100%",
                  };

                  const cardStyleCarousel: any = {
                    width: "clamp(260px, 70vw, 420px)",
                  };

                  const renderCard = (b: any) => {
                    const name = String(b?.namaCabang ?? `Cabang #${b?.id ?? ""}`).trim();
                    const mapsUrl = String(b?.mapsUrl ?? "").trim();
                    const meta = mapsUrl ? "Google Maps" : "Link maps belum diisi";

                    // Pre-calculate URLs for both preview and button
                    const embedSrc = (() => {
                      if (!mapsUrl) return "";
                      if (mapsUrl.includes("<iframe")) {
                        const match = mapsUrl.match(/src=["']([^"']+)["']/i);
                        if (match && match[1]) return match[1];
                      }
                      try {
                        const u = new URL(mapsUrl);
                        const host = u.host.toLowerCase();
                        const isGoogle = host.includes("google.") || host.includes("maps.");
                        const isEmbedPath = u.pathname.includes("/maps/embed");
                        const pb = u.searchParams.get("pb");
                        const output = u.searchParams.get("output");

                        if (isEmbedPath && pb && pb.length > 20) return mapsUrl;
                        if (isEmbedPath && output === "embed") return mapsUrl;
                        if (output === "embed") return mapsUrl;

                        if (isGoogle) {
                          const q = u.searchParams.get("q") || u.searchParams.get("query") || u.searchParams.get("search") || "";
                          const query = q || name;
                          if (!query) return "";
                          return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                        }
                      } catch { /* ignore */ }
                      return "";
                    })();

                    const viewUrl = (() => {
                      // 1. If mapsUrl is a valid URL (not iframe), use it directly if it's not an embed path
                      if (mapsUrl && !mapsUrl.includes("<") && !mapsUrl.includes(">")) {
                        try {
                          const u = new URL(mapsUrl);
                          if (!u.pathname.includes("/maps/embed")) return mapsUrl;
                        } catch { /* ignore */ }
                      }

                      // 2. If it's an iframe or embed link, derive a Search API link (very reliable)
                      if (embedSrc) {
                        try {
                          const u = new URL(embedSrc);
                          // Extract 'q' if present
                          const q = u.searchParams.get("q") || u.searchParams.get("query");
                          if (q) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

                          // If it's a complex embed (/maps/embed), fallback to search by name
                          if (u.pathname.includes("/maps/embed")) {
                            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
                          }

                          // Fallback: clean the embedSrc
                          const cleanU = new URL(embedSrc);
                          cleanU.searchParams.delete("output");
                          return cleanU.toString();
                        } catch { /* fallback to search by name below */ }
                      }

                      // 3. Absolute fallback: Google Search by Name
                      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
                    })();

                    return (
                      <article
                        key={Number(b?.id)}
                        className={`${ui.pcCard} ${cardThemeClass}`}
                        style={{
                          ...(isSingle
                            ? cardStyleSingle
                            : layoutEffective === "carousel"
                              ? cardStyleCarousel
                              : cardStyleGrid),
                          backgroundColor: colors.card,
                          color: colors.cardFg,
                        }}
                      >
                        <div
                          className={ui.pcMediaPlaceholder}
                          style={{
                            position: "relative",
                            display: "block",
                            aspectRatio: "16 / 9",
                            maxHeight: isSingle ? 360 : 240,
                            borderBottom: "1px solid var(--t-card-border)",
                            background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(0,0,0,0.14))",
                          }}
                        >
                          {embedSrc ? (
                            <iframe
                              src={embedSrc}
                              title={`Map - ${name}`}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              style={{ border: 0, width: "100%", height: "100%" }}
                            />
                          ) : (
                            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                              <div style={{ display: "grid", gap: 6, placeItems: "center" }}>
                                <div style={{ fontSize: 32, lineHeight: 1 }}>📍</div>
                                <div style={{ fontSize: 12, opacity: 0.85, textAlign: "center", padding: "0 10px" }}>
                                  {mapsUrl ? "Preview peta butuh link Embed (bukan shortlink)." : "Link maps belum diisi"}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className={ui.pcBody}>
                          <div className={ui.pcTitle}>{name}</div>
                          <div className={ui.pcMeta}>{meta}</div>

                          <div className={ui.pcCtaWrap}>
                            {viewUrl ? (
                              <a
                                className={ui.pcCta}
                                href={viewUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ background: colors.ctaBg, color: colors.ctaFg, border: `1px solid ${colors.ctaBg}` }}
                              >
                                Buka Maps
                              </a>
                            ) : (
                              <div className={ui.pcCtaPlaceholder} />
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  };

                  return (
                    <section
                      key={section.id}
                      className={`${ui.previewSection} ${ui.previewSectionTheme}`}
                      data-theme={sectionThemeResolved}
                      style={{
                        backgroundColor: bgPalette ? bgPalette.bg : colors.bg,
                        color: bgPalette ? bgPalette.fg : colors.element,
                        ["--t-element" as any]: bgPalette ? bgPalette.fg : colors.element,
                      }}
                    >
                      {sectionTitle ? <h2 className={ui.sectionTitle}>{sectionTitle}</h2> : null}

                      {!branches.length ? (
                        <div className={ui.notice}>Belum ada cabang dipilih.</div>
                      ) : layoutEffective === "carousel" ? (
                        <div className={ui.pcRow}>{branches.map(renderCard)}</div>
                      ) : isSingle ? (
                        <div style={{ width: "100%" }}>{renderCard(branches[0])}</div>
                      ) : (
                        <div style={gridStyle}>{branches.map(renderCard)}</div>
                      )}
                    </section>
                  );
                }

                // SOCIAL (Media Sosial - icons)
                if (t === "SOCIAL") {
                  const cfg = normalizeConfig(t, section.config) as any;
                  const iconKeys: string[] = Array.isArray((cfg as any).iconKeys)
                    ? (cfg as any).iconKeys.map((v: any) => String(v ?? "").trim()).filter(Boolean)
                    : [];

                  const items = iconKeys
                    .map((k) => ({ k, row: (mediaSosialByKey as any)?.get?.(k) }))
                    .filter((it) => it.row && String(it.row?.url ?? "").trim().length > 0);

                  if (!items.length) {
                    return (
                      <div key={section.id} className={ui.previewSection}>
                        {section.title ? <div className={ui.sectionTitle}>{section.title}</div> : null}
                        <div className={ui.notice}>Belum ada media sosial dipilih.</div>
                      </div>
                    );
                  }
                  const sectionThemeResolved = resolveEffectiveTheme((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR", navbarTheme);
                  const pair = parseThemePair(sectionThemeResolved);
                  const accent = colorForToken(pair.b);

                  // Floating social dock (e-commerce style): minimal, clean, no extra section text.
                  const bgToken = pair.a;
                  const accentToken = pair.b;

                  const navyBg = "rgba(11, 29, 58, 0.94)";
                  const whiteBg = "rgba(255,255,255,0.94)";
                  const goldBg = "rgba(212, 175, 55, 0.92)";

                  // Button background follows the section theme background.
                  const btnBg = bgToken === "NAVY" ? navyBg : bgToken === "GOLD" ? goldBg : whiteBg;

                  // Icon color follows the accent/element token.
                  const iconColor =
                    accentToken === "WHITE"
                      ? "rgba(255,255,255,0.95)"
                      : accentToken === "NAVY"
                        ? "rgba(11, 29, 58, 0.92)"
                        : accent; // GOLD

                  const borderColor =
                    accentToken === "GOLD"
                      ? "rgba(212, 175, 55, 0.60)"
                      : accentToken === "WHITE"
                        ? "rgba(255,255,255,0.35)"
                        : "rgba(11, 29, 58, 0.18)";

                  const shadow = bgToken === "NAVY" ? "0 12px 28px rgba(0,0,0,0.35)" : "0 12px 26px rgba(0,0,0,0.18)";

                  return (
                    <div key={section.id}>
                      <div
                        style={{
                          position: "fixed",
                          right: 18,
                          bottom: 18,
                          zIndex: 60,
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                        aria-label="Media sosial"
                      >
                        {items.map(({ k, row }: any) => {
                          const url = normalizeExternalUrl(row?.url);
                          const title = String(row?.nama ?? k);
                          return (
                            <a
                              key={k}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={title}
                              aria-label={title}
                              style={{
                                width: 46,
                                height: 46,
                                borderRadius: 999,
                                display: "grid",
                                placeItems: "center",
                                textDecoration: "none",
                                background: btnBg,
                                border: `1px solid ${borderColor}`,
                                boxShadow: shadow,
                                backdropFilter: "blur(10px)",
                              }}
                            >
                              <span style={{ display: "grid", placeItems: "center", color: iconColor }}>
                                <SocialIcon iconKey={String(row?.iconKey ?? k)} />
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  );
                }



                // CUSTOM_PROMO (voucher gambar)
                if (t === "CUSTOM_PROMO") {
                  const cfg = normalizeConfig(t, section.config) as any;
                  const layoutRaw = String((cfg as any).layout ?? "carousel").toLowerCase();
                  const layout = layoutRaw === "grid" ? "grid" : layoutRaw === "hero" ? "hero" : "carousel";
                  const voucherIds = Array.isArray((cfg as any).voucherImageIds) ? (cfg as any).voucherImageIds : [];
                  const voucherLinks = (cfg as any)?.voucherLinks || {};

                  const items = voucherIds
                    .map((v: any) => {
                      const id = Number(v);
                      if (!Number.isFinite(id) || id <= 0) return null;
                      const row = imageMap.get(id);
                      const raw = (voucherLinks as any)?.[id];
                      let href = "";
                      if (typeof raw === "string") {
                        if (raw.startsWith("category:")) {
                          const catId = Number(raw.split(":")[1]);
                          const k = kategoriMap.get(catId);
                          if (k && k.slug) {
                            href = `/kategori/${k.slug}`;
                          } else if (Number.isFinite(catId) && catId > 0) {
                            href = `/cari?kategori=${catId}`;
                          }
                        } else {
                          href = raw.trim();
                        }
                      }
                      return { id, url: row ? String((row as any).url) : "", href };
                    })
                    .filter(Boolean)
                    .slice(0, MAX_CUSTOM_PROMO_VOUCHERS);
                  const gridColsDesktop = (() => {
                    const count = items.length;
                    if (count <= 2) return Math.max(count, 1);
                    const candidates = [4, 3, 5];
                    const pick = candidates.find((c) => count % c !== 1);
                    return pick ?? 3;
                  })();

                  const palette = resolveCustomPromoPalette((cfg as any).sectionBgTheme, navbarTheme);
                  const hasItems = items.length > 0;

                  return (
                    <section key={section.id} className={`${ui.previewSection} ${ui.previewSectionFull}`}>
                      {section.title ? <h2 className={ui.sectionTitle}>{section.title}</h2> : null}

                      <div
                        className={`${ui.promoStage} ${ui.promoStageFull}`}
                        data-layout={layout}
                        style={{
                          background: palette.bg,
                          color: palette.fg,
                          borderColor: palette.border,
                          ["--t-element" as any]: palette.fg,
                        }}
                      >
                        {hasItems ? (
                          layout === "grid" ? (
                            <div
                              className={ui.promoGrid}
                              style={{ ["--promoGridDesktopCols" as any]: String(gridColsDesktop) }}
                            >
                              {items.map((item: any) => (
                                item.href ? (
                                  <a
                                    key={item.id}
                                    href={item.href}
                                    className={`${ui.promoCard} ${ui.promoClickable}`}
                                    style={{ borderColor: palette.border }}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {item.url ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <SecureImage src={item.url} alt="" className={ui.promoImg} />
                                    ) : (
                                      <div className={ui.promoPlaceholder}>Voucher #{item.id} tidak ditemukan.</div>
                                    )}
                                  </a>
                                ) : (
                                  <article key={item.id} className={ui.promoCard} style={{ borderColor: palette.border }}>
                                    {item.url ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <SecureImage src={item.url} alt="" className={ui.promoImg} />
                                    ) : (
                                      <div className={ui.promoPlaceholder}>Voucher #{item.id} tidak ditemukan.</div>
                                    )}
                                  </article>
                                )
                              ))}
                            </div>
                          ) : layout === "hero" ? (
                            <div className={ui.promoHero}>
                              {items[0]?.href ? (
                                <a href={items[0].href} className={ui.promoLink} target="_blank" rel="noreferrer">
                                  {items[0]?.url ? (
                                    <SecureImage src={items[0].url} alt="" className={ui.promoHeroImg} />
                                  ) : (
                                    <div className={ui.promoPlaceholder}>Voucher #{items[0]?.id ?? ""} tidak ditemukan.</div>
                                  )}
                                </a>
                              ) : items[0]?.url ? (
                                <SecureImage src={items[0].url} alt="" className={ui.promoHeroImg} />
                              ) : (
                                <div className={ui.promoPlaceholder}>Voucher #{items[0]?.id ?? ""} tidak ditemukan.</div>
                              )}
                            </div>
                          ) : (
                            <div className={ui.promoCarousel} aria-label="Voucher carousel">
                              {items.map((item: any) => (
                                item.href ? (
                                  <a
                                    key={item.id}
                                    href={item.href}
                                    className={`${ui.promoCard} ${ui.promoClickable}`}
                                    style={{ borderColor: palette.border }}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {item.url ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <SecureImage src={item.url} alt="" className={ui.promoImg} />
                                    ) : (
                                      <div className={ui.promoPlaceholder}>Voucher #{item.id} tidak ditemukan.</div>
                                    )}
                                  </a>
                                ) : (
                                  <article key={item.id} className={ui.promoCard} style={{ borderColor: palette.border }}>
                                    {item.url ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <SecureImage src={item.url} alt="" className={ui.promoImg} />
                                    ) : (
                                      <div className={ui.promoPlaceholder}>Voucher #{item.id} tidak ditemukan.</div>
                                    )}
                                  </article>
                                )
                              ))}
                            </div>
                          )
                        ) : (
                          <div className={ui.notice}>Belum ada voucher ditambahkan.</div>
                        )}
                      </div>
                    </section>
                  );
                }



                // CONTACT (Hubungi Kami)
                if (t === "CONTACT") {
                  const cfg = normalizeConfig(t, section.config) as any;
                  const sectionThemeResolved = resolveEffectiveTheme((cfg as any).sectionTheme, navbarTheme);
                  const mode = "SPLIT_IMAGE_STACK";
                  const showImage = Boolean((cfg as any).showImage);
                  const imageId = (cfg as any).imageId ? Number((cfg as any).imageId) : null;
                  const imgUrl = imageId && imageMap.get(imageId) ? String((imageMap.get(imageId) as any).url) : "";

                  const headerText = String((cfg as any).headerText ?? "").trim();
                  const bodyText = String((cfg as any).bodyText ?? "").trim();

                  const selectedIds = Array.isArray((cfg as any).hubungiIds) ? (cfg as any).hubungiIds : [];
                  const selected = selectedIds
                    .map((v: any) => hubungiById.get(Number(v)))
                    .filter(Boolean) as any[];

                  const buttonLabels = isObject((cfg as any).buttonLabels) ? ((cfg as any).buttonLabels as any) : {};

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

                  const NoContacts = () => <div className={ui.notice}>Belum ada kontak dipilih.</div>;

                  const ChipsRow = ({ items }: { items: any[] }) =>
                    items.length ? (
                      <div className={ui.contactChipsRow}>
                        {items.map((h) => (
                          <a
                            key={String(h.id)}
                            className={`${ui.pcCta} ${ui.contactChip}`}
                            href={makeHref(h)}
                          >
                            {makeLabel(h)}
                          </a>
                        ))}
                      </div>
                    ) : null;

                  // ===== Mode: HERO_POSTER =====
                  const HeroPoster = () => {
                    const hasImg = Boolean(showImage && imgUrl);

                    const title = headerText || section.title || "";
                    const desc = bodyText;

                    return (
                      <article className={ui.contactHeroCard}>
                        <div className={ui.contactHeroMedia}>
                          {hasImg ? (
                            <img src={imgUrl} alt="Hubungi Kami" className={ui.contactCoverImg} />
                          ) : (
                            <div className={ui.contactHeroPlaceholder}>☎️</div>
                          )}
                        </div>

                        <div className={ui.contactHeroContent}>
                          <div className={ui.contactTextStack}>
                            {title ? <div className={ui.contactTitle}>{title}</div> : null}
                            {desc ? <div className={ui.contactDesc}>{desc}</div> : null}
                          </div>

                          {primary ? (
                            <a className={`${ui.pcCta} ${ui.contactPrimaryBtnWide}`} href={makeHref(primary)}>
                              Hubungi
                            </a>
                          ) : (
                            <NoContacts />
                          )}

                          {rest.length ? <ChipsRow items={rest} /> : null}
                        </div>
                      </article>
                    );
                  };

                  // ===== Mode: AGENT_GRID =====
                  const AgentGrid = () => {
                    if (!contacts.length) return <NoContacts />;
                    return (
                      <div>
                        {showImage && imgUrl ? (
                          <div className={ui.contactThumb16x9}>
                            <img src={imgUrl} alt="Hubungi Kami" className={ui.contactCoverImg} />
                          </div>
                        ) : null}

                        <div className={ui.contactGrid}>
                          {contacts.map((h) => (
                            <article
                              key={String(h.id)}
                              className={ui.contactAgentCard}
                            >
                              <div className={ui.contactSmallLabel}>{makeLabel(h)}</div>
                              <div className={ui.contactSmallMeta}>
                                {String(h?.jenis ?? "").trim() || (String(h?.email ?? "").trim() ? "Email" : "Kontak")}
                              </div>
                              <a className={`${ui.pcCta} ${ui.contactTopGap6}`} href={makeHref(h)}>
                                Buka
                              </a>
                            </article>
                          ))}
                        </div>
                      </div>
                    );
                  };

                  // ===== Mode: CAROUSEL_AGENTS =====
                  const CarouselAgents = () => {
                    if (!contacts.length) return <NoContacts />;

                    const Card = (h: any) => (
                      <article
                        key={String(h.id)}
                        className={ui.contactCarouselCard}
                      >
                        <div className={ui.contactSmallLabel}>{makeLabel(h)}</div>
                        <div className={ui.contactSmallMeta}>
                          {String(h?.jenis ?? "").trim() || (String(h?.email ?? "").trim() ? "Email" : "Kontak")}
                        </div>
                        <a className={ui.pcCta} href={makeHref(h)}>
                          Buka
                        </a>
                      </article>
                    );

                    // 1 item: make it full width (no "kanan kosong")
                    if (contacts.length === 1) {
                      return <div className={ui.wFull}>{Card(contacts[0])}</div>;
                    }

                    return (
                      <div className={ui.contactCarouselScroll}>
                        {contacts.map(Card)}
                      </div>
                    );
                  };

                  // ===== Mode: SPLIT_IMAGE_STACK =====
                  const SplitImageStack = () => {
                    const hasImg = Boolean(showImage && imgUrl);
                    const title = headerText || section.title || "";
                    const desc = bodyText;

                    return (
                      <article className={ui.contactSplit}>
                        <div className={ui.contactMediaCard}>
                          {hasImg ? (
                            <SecureImage src={imgUrl} alt="Hubungi Kami" className={ui.contactCoverImg} />
                          ) : (
                            <div className={ui.contactMediaPlaceholder}>
                              🖼️
                            </div>
                          )}
                        </div>

                        <div className={ui.contactSplitRight}>
                          <div className={ui.contactTextStack}>
                            {title ? <div className={ui.contactTitle}>{title}</div> : null}
                            {desc ? <div className={ui.contactDesc}>{desc}</div> : null}
                          </div>

                          {contacts.length ? (
                            <div style={{ display: "grid", gap: 10 }}>
                              {contacts.map((h: any) => (
                                <a
                                  key={String(h.id)}
                                  className={`${ui.pcCta} ${ui.contactBtn}`}
                                  href={makeHref(h)}
                                >
                                  {makeLabel(h)}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <NoContacts />
                          )}
                        </div>
                      </article>
                    );
                  };

                  // ===== Mode: MINIMAL_CTA =====
                  const MinimalCta = () => {
                    const hasThumb = Boolean(showImage && imgUrl);
                    const title = headerText || section.title || "";
                    const desc = bodyText;

                    return (
                      <article className={ui.contactMinimalCard}>
                        <div className={ui.contactMinimalRow}>
                          <div className={ui.contactAvatar}>
                            {hasThumb ? (
                              <SecureImage src={imgUrl} alt="Hubungi Kami" className={ui.contactCoverImg} />
                            ) : (
                              <div className={ui.contactAvatarPlaceholder}>
                                ☎️
                              </div>
                            )}
                          </div>

                          <div className={ui.contactInfoStack}>
                            {title ? <div className={ui.contactName}>{title}</div> : null}
                            {desc ? <div className={ui.contactMeta}>{desc}</div> : null}
                          </div>
                        </div>

                        {primary ? (
                          <>
                            <a className={`${ui.pcCta} ${ui.contactPrimaryBtnWide}`} href={makeHref(primary)}>
                              Hubungi
                            </a>
                            {rest.length ? <ChipsRow items={rest} /> : null}
                          </>
                        ) : (
                          <NoContacts />
                        )}
                      </article>
                    );
                  };

                  const body = <SplitImageStack />;

                  return (
                    <section key={section.id} className={`${ui.previewSection} ${ui.previewSectionTheme}`} data-theme={sectionThemeResolved}>
                      <div className={ui.contactStage}>
                        {section.title ? <h2 className={ui.sectionTitle}>{section.title}</h2> : null}
                        <div className={ui.contactStageBody}>{body}</div>
                      </div>
                    </section>
                  );
                }


                // ROOM CATEGORY (Kategori Ruangan)
                if (t === "ROOM_CATEGORY") {
                  const cfg = normalizeConfig(t, section.config) as any;
                  const cards = Array.isArray(cfg.cards) ? cfg.cards : [];
                  const sectionTitle = section.title || "";

                  // Tema khusus ROOM_CATEGORY (A + B): A dipakai sebagai background strip label (di dalam kartu),
                  // B dipakai sebagai border + warna teks label. Background luar section tidak diubah.
                  const roomThemeKey = resolveEffectiveTheme(String(cfg.sectionTheme ?? "FOLLOW_NAVBAR"), navbarTheme);
                  const { a: rcA, b: rcB } = parseThemePair(roomThemeKey);
                  const rcLabelBg = colorForToken(rcA);
                  const rcAccent = colorForToken(rcB);

                  return (
                    <section key={section.id} className={ui.previewSection}>
                      {sectionTitle ? <h2 className={ui.sectionTitle}>{sectionTitle}</h2> : null}

                      {cards.length ? (
                        <div className={ui.roomGrid} aria-label="Grid Kategori Ruangan">
                          {cards.map((card: any, idx: number) => {
                            const key = String(card?.key ?? idx);

                            const title = String(card?.title ?? "").trim();
                            const badge = typeof card?.badge === "string" ? String(card.badge).trim() : "";

                            // Rule: kalau tidak ada judul -> image-only (tanpa body putih, gambar tidak crop)
                            const isImageOnly = !title;

                            const kategoriId = Number(card?.kategoriId);
                            const kategori =
                              Number.isFinite(kategoriId) && kategoriId > 0 ? kategoriMap.get(kategoriId) : null;
                            const href = kategori?.slug ? `/kategori/${kategori.slug}` : "#";

                            const imageId = Number(card?.imageId);
                            const imgUrl =
                              Number.isFinite(imageId) && imageId > 0
                                ? imageMap.get(imageId)?.url ?? null
                                : Number.isFinite(kategoriId) && kategoriId > 0
                                  ? autoCoverUrlByKategori.get(kategoriId) ?? null
                                  : null;

                            // Optional crop vars (only applied when NOT image-only)
                            const cropY = Number(card?.cropY);
                            const zoom = Number(card?.zoom);

                            const styleVars: any = {};
                            if (imgUrl) {
                              // background layer for image-only cards (fills arch without cropping main image)
                              styleVars["--rc-bg" as any] = `url("${imgUrl}")`;
                            }
                            if (!isImageOnly) {
                              if (Number.isFinite(cropY)) {
                                styleVars["--rc-cropY"] = `${Math.max(0, Math.min(100, cropY))}%`;
                              }
                              if (Number.isFinite(zoom)) {
                                styleVars["--rc-zoom"] = String(Math.max(1, Math.min(3, zoom)));
                              }
                            }

                            return (
                              <Link key={key} href={href} className={ui.roomCardLink}>
                                <div
                                  className={`${ui.roomCard} ${isImageOnly ? ui.roomCardImageOnly : ""}`}
                                  style={{ ...(styleVars as any), borderColor: rcAccent }}
                                >
                                  <div className={ui.roomMedia}>
                                    {imgUrl ? (
                                      <SecureImage className={ui.roomImg} src={imgUrl} alt={title || "Kategori Ruangan"} />
                                    ) : (
                                      <div className={ui.roomMediaPlaceholder} aria-hidden="true" />
                                    )}
                                  </div>

                                  {!isImageOnly ? (
                                    <div className={ui.roomBody} style={{ background: rcLabelBg }}>
                                      <div className={ui.roomTopRow}>
                                        <div className={ui.roomTitle} style={{ color: rcAccent }}>{title}</div>
                                        {badge ? <span className={ui.roomBadge} style={{ borderColor: rcAccent, color: rcAccent }}>{badge}</span> : null}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={ui.notice}>Belum ada kartu kategori ruangan.</div>
                      )}
                    </section>
                  );
                }


                // FOOTER
                if (t === "FOOTER") {
                  const cfg = normalizeConfig(t, section.config) as any;

                  // Resolve Theme
                  const footerThemeKey = resolveEffectiveTheme(String(cfg.sectionTheme ?? "FOLLOW_NAVBAR"), navbarTheme);
                  const colors = getHeroThemeTokens(footerThemeKey);

                  return (
                    <section
                      id={`section-${section.id}`}
                      key={section.id}
                      className={ui.footerSection}
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.element,
                      }}
                    >
                      <div className={ui.footerLayout}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
                          {(() => {
                            const tags = Array.isArray((cfg as any).footerTags) ? (cfg as any).footerTags : [];
                            if (tags.length === 0) return <div style={{ opacity: 0.5 }}>No tags (preview)</div>;

                            const mid = Math.ceil(tags.length / 2);
                            const leftTags = tags.slice(0, mid);
                            const rightTags = tags.slice(mid);

                            return (
                              <>
                                <div className={ui.footerTagsGrid}>
                                  {leftTags.map((tag: any, idx: number) => (
                                    <span key={idx} style={{ color: "inherit", opacity: 0.6, fontSize: 12, fontWeight: "bold" }}>
                                      {tag.label}
                                    </span>
                                  ))}
                                </div>
                                {rightTags.length > 0 && (
                                  <div className={ui.footerTagsGrid}>
                                    {rightTags.map((tag: any, idx: number) => (
                                      <span key={idx} style={{ color: "inherit", opacity: 0.6, fontSize: 12, fontWeight: "bold" }}>
                                        {tag.label}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        {/* RIGHT: Info Stack (Split Height) */}
                        <div className={ui.footerRightStack}>

                          {/* 1. Address + Brand (Top) */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <img
                              src={getFooterIconPath("LOGO", colors.element)}
                              alt="Apix Interior"
                              style={{ height: 32, width: "auto", objectFit: "contain", alignSelf: "flex-start" }}
                            />
                            <div style={{ display: "flex", gap: 8 }}>
                              <img src={getFooterIconPath("LOC", colors.element)} alt="Loc" style={{ width: 14, height: 14, marginTop: 3, opacity: 0.8 }} />
                              <address style={{ fontStyle: "normal", lineHeight: 1.4, opacity: 0.8, whiteSpace: "pre-line", fontSize: 12 }}>
                                {(() => {
                                  const useGlobal = (cfg as any).useGlobalContact;
                                  const manualAddr = (cfg as any).address;
                                  if (useGlobal) {
                                    const firstBranch = cabangMap?.values().next().value;
                                    return firstBranch?.namaCabang || manualAddr || "Alamat belum diatur.";
                                  }
                                  return manualAddr || "Alamat belum diatur.";
                                })()}
                              </address>
                            </div>
                          </div>

                          {/* 2. Menu & Contact (Side-by-Side Bottom) */}
                          <div className={ui.footerMenuContactGrid}>
                            {/* Menu */}
                            {Array.isArray((cfg as any).menuLinks) && (cfg as any).menuLinks.length > 0 && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <h4 style={{ fontSize: 12, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.9 }}>Menu</h4>
                                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                                  {(cfg as any).menuLinks.map((link: any, idx: number) => (
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
                                  const waCfg = (cfg as any).whatsapp;
                                  const useGlobal = (cfg as any).useGlobalContact;
                                  let globalWa = "";
                                  if (useGlobal && hubungiById && hubungiById.size > 0) {
                                    for (const h of hubungiById.values()) {
                                      if (h.prioritas) { globalWa = h.nomor; break; }
                                    }
                                    if (!globalWa) globalWa = hubungiById.values().next().value?.nomor;
                                  }
                                  const waVal = useGlobal ? (globalWa || waCfg) : waCfg;
                                  if (!waVal) return null;

                                  const displayWa = waVal.startsWith("62") ? "+" + waVal : waVal;
                                  const linkWa = waVal.replace(/^\+/, "");

                                  return (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, opacity: 0.7 }}>
                                      <img src={getFooterIconPath("WA", colors.element)} alt="WA" style={{ width: 14, height: 14, opacity: 0.8 }} />
                                      <a href={`https://wa.me/${linkWa}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", fontWeight: 600 }}>
                                        {displayWa}
                                      </a>
                                    </div>
                                  );
                                })()}

                                {(cfg as any).email && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, opacity: 0.7, fontWeight: 500 }}>
                                    <span>✉</span>
                                    <span>{(cfg as any).email}</span>
                                  </div>
                                )}

                                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                                  {(() => {
                                    const useGlobal = (cfg as any).useGlobalSocial;
                                    const items = [];

                                    if (useGlobal) {
                                      // Render ALL global social media
                                      if (mediaSosialByKey) {
                                        for (const [key, val] of mediaSosialByKey.entries()) {
                                          items.push({ key, url: val.url, label: val.nama || key });
                                        }
                                      }
                                    } else {
                                      // Manual fallback (Legacy)
                                      const ig = (cfg as any).instagram;
                                      const fb = (cfg as any).facebook;
                                      if (ig) items.push({ key: "instagram", url: `https://instagram.com/${ig.replace("@", "")}`, label: "IG" });
                                      if (fb) items.push({ key: "facebook", url: "#", label: "FB" });
                                    }

                                    if (items.length === 0) return null;

                                    return items.map((it, idx) => {
                                      return (
                                        <a key={idx} href={it.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", transition: "opacity 0.2s" }} title={it.label}>
                                          <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <SocialIcon iconKey={it.key} />
                                          </div>
                                        </a>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ borderTop: `1px solid ${colors.divider}`, marginTop: 60, paddingTop: 24, textAlign: "center", fontSize: 13, opacity: 0.6 }}>
                        &copy; {new Date().getFullYear()} Apix Interior. All rights reserved.
                      </div>
                    </section>
                  );
                }


                // fallback
                return (
                  <section key={section.id} className={ui.previewSection}>
                    {section.title ? <h2 className={ui.sectionTitle}>{section.title}</h2> : null}
                    <pre style={{ fontSize: 12, opacity: 0.8, whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(section.config ?? {}, null, 2)}
                    </pre>
                  </section>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={ui.noticeWrap}>
            <div className={ui.notice}>Belum ada section aktif untuk theme ini.</div>
          </div>
        )}
      </main>
    </>
  );
}

async function fetchPreviewThemeOptimized(themeKey: string) {
  const allDrafts = await prisma.homepageSectionDraft.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  const draftSections: SectionRow[] = (allDrafts as any[])
    .filter((d) => !isThemeMetaRow(d))
    .filter((d) => getThemeKeyFromConfig(d?.config) === themeKey)
    .filter((d) => d.enabled === true)
    .map((d) => ({
      id: Number(d.id),
      type: String(d.type),
      title: d.title ?? null,
      slug: d.slug ?? null,
      enabled: Boolean(d.enabled),
      sortOrder: Number(d.sortOrder ?? 0),
      config: normalizeConfig(String(d.type), d.config),
    }));

  const kategoriIds: number[] = [];
  const autoCoverKategoriIds: number[] = [];
  const imageIds: number[] = [];
  const produkIds: number[] = [];
  const highlightProdukIds: number[] = [];
  const branchIds: number[] = [];
  const hubungiIds: number[] = [];
  const mediaIconKeys: string[] = [];
  let needsProductListing = false;
  let footerNeedsGlobalBranches = false;

  const categoryGridById = new Map<number, { items: CategoryGridItem[]; columns: number; maxItems?: number }>();
  const categoryCommerceById = new Map<number, { items: CategoryCommerceItem[]; columns: number; maxItems?: number }>();

  for (const s of draftSections) {
    if (s.type === "CATEGORY_GRID") {
      const cfg = s.config as any;
      const items: CategoryGridItem[] = Array.isArray(cfg.items) ? cfg.items : [];
      const layout = isObject(cfg.layout) ? cfg.layout : {};
      const columns = Number.isFinite(Number(layout.columns)) ? Math.max(2, Math.min(6, Number(layout.columns))) : 3;
      const maxItems = layout.maxItems ? Number(layout.maxItems) : undefined;
      for (const it of items) {
        if (it?.kategoriId) {
          kategoriIds.push(Number(it.kategoriId));
          if (it.coverImageId && Number.isFinite(it.coverImageId)) {
            imageIds.push(Number(it.coverImageId));
          } else {
            autoCoverKategoriIds.push(Number(it.kategoriId));
          }
        }
      }
      categoryGridById.set(s.id, { items, columns, ...(maxItems ? { maxItems } : {}) });
    }
    if (s.type === "CATEGORY_GRID_COMMERCE") {
      const cfg = s.config as any;
      const items: CategoryCommerceItem[] = Array.isArray(cfg.items) ? cfg.items : [];
      const layout = isObject(cfg.layout) ? cfg.layout : {};
      const columns = Number.isFinite(Number(layout.columns)) ? Math.max(2, Math.min(6, Number(layout.columns))) : 4;
      const maxItems = layout.maxItems ? Number(layout.maxItems) : undefined;
      for (const it of items) {
        if (it?.kategoriId) {
          kategoriIds.push(Number(it.kategoriId));
          if (it.imageId && Number.isFinite(it.imageId as number)) {
            imageIds.push(Number(it.imageId));
          }
        }
      }
      categoryCommerceById.set(s.id, { items, columns, ...(maxItems ? { maxItems } : {}) });
    }
    if (s.type === "HERO") {
      const imgId = Number((s.config as any).imageId);
      if (Number.isFinite(imgId) && imgId > 0) imageIds.push(imgId);
    }
    if (s.type === "PRODUCT_CAROUSEL") {
      const ids = Array.isArray((s.config as any).productIds) ? (s.config as any).productIds : [];
      for (const id of ids) {
        const n = Number(id);
        if (Number.isFinite(n) && n > 0) produkIds.push(n);
      }
    }
    if (s.type === "PRODUCT_LISTING") {
      const ids = Array.isArray((s.config as any).productIds) ? (s.config as any).productIds : [];
      for (const id of ids) {
        const n = Number(id);
        if (Number.isFinite(n) && n > 0) produkIds.push(n);
      }
      needsProductListing = true;
    }
    if (s.type === "HIGHLIGHT_COLLECTION") {
      const heroImageId = Number((s.config as any).heroImageId);
      if (Number.isFinite(heroImageId) && heroImageId > 0) imageIds.push(heroImageId);
      const ids = Array.isArray((s.config as any).productIds) ? (s.config as any).productIds : [];
      for (const id of ids) {
        const n = Number(id);
        if (Number.isFinite(n) && n > 0) {
          highlightProdukIds.push(n);
          produkIds.push(n);
        }
      }
    }
    if (s.type === "BRANCHES") {
      const ids = Array.isArray((s.config as any).branchIds) ? (s.config as any).branchIds : [];
      for (const id of ids) {
        const n = Number(id);
        if (Number.isFinite(n) && n > 0) branchIds.push(n);
      }
    }
    if (s.type === "SOCIAL") {
      const cfg = s.config as any;
      const keys: string[] = Array.isArray((cfg as any).iconKeys)
        ? (cfg as any).iconKeys.map((v: any) => String(v ?? "").trim()).filter(Boolean)
        : [];
      for (const k of keys) {
        if (k) mediaIconKeys.push(String(k));
      }
    }
    if (s.type === "CONTACT") {
      const cfg = s.config as any;
      const ids = Array.isArray((cfg as any).hubungiIds) ? (cfg as any).hubungiIds : [];
      for (const id of ids) {
        const n = Number(id);
        if (Number.isFinite(n) && n > 0) hubungiIds.push(n);
      }
      const showImage = Boolean((cfg as any).showImage);
      const imageId = Number((cfg as any).imageId);
      if (showImage && Number.isFinite(imageId) && imageId > 0) {
        imageIds.push(imageId);
      }
    }
    if (s.type === "CUSTOM_PROMO") {
      const cfg = normalizeConfig("CUSTOM_PROMO", s.config) as any;
      const vouchers = Array.isArray((cfg as any).voucherImageIds) ? (cfg as any).voucherImageIds : [];
      for (const id of vouchers) {
        const n = Number(id);
        if (Number.isFinite(n) && n > 0) imageIds.push(n);
      }
    }
    if (s.type === "FOOTER") {
      if ((s.config as any)?.useGlobalContact) {
        footerNeedsGlobalBranches = true;
      }
    }
    if (s.type === "ROOM_CATEGORY") {
      const cfg = s.config as any;
      const cards = Array.isArray(cfg.cards) ? cfg.cards : [];
      for (const c of cards) {
        const kId = Number(c?.kategoriId);
        if (Number.isFinite(kId) && kId > 0) kategoriIds.push(kId);
        const imgId = Number(c?.imageId);
        if (Number.isFinite(imgId) && imgId > 0) {
          imageIds.push(imgId);
        } else if (Number.isFinite(kId) && kId > 0) {
          autoCoverKategoriIds.push(kId);
        }
      }
    }
  }

  const uniqKategoriIds = Array.from(new Set(kategoriIds)).filter((n) => Number.isFinite(n));
  const uniqAutoCoverKategoriIds = Array.from(new Set(autoCoverKategoriIds)).filter((n) => Number.isFinite(n));
  const uniqProdukIds = Array.from(new Set(produkIds)).filter((n) => Number.isFinite(n));
  const uniqBranchIds = Array.from(new Set(branchIds)).filter((n) => Number.isFinite(n));
  const uniqHubungiIds = Array.from(new Set(hubungiIds)).filter((n) => Number.isFinite(n));
  const uniqMediaIconKeys = Array.from(new Set(mediaIconKeys)).map((s) => String(s ?? "").trim()).filter(Boolean);

  const [
    productListingItemsRaw,
    kategoris,
    produk,
    autoCoverItems,
    cabangs,
    hubungis,
    mediaSosialsRaw
  ] = await Promise.all([
    needsProductListing
      ? prisma.produk.findMany({
        orderBy: { id: "desc" },
        take: 60,
        select: {
          id: true, nama: true, slug: true, harga: true, promoAktif: true, promoTipe: true, promoValue: true,
          kategori: true, subkategori: true, mainImageId: true
        },
      })
      : Promise.resolve([]),

    uniqKategoriIds.length
      ? prisma.kategoriProduk.findMany({ where: { id: { in: uniqKategoriIds } }, select: { id: true, nama: true, slug: true } })
      : Promise.resolve([]),

    uniqProdukIds.length
      ? prisma.produk.findMany({
        where: { id: { in: uniqProdukIds } },
        select: {
          id: true, nama: true, slug: true, harga: true, promoAktif: true, promoTipe: true, promoValue: true,
          kategori: true, subkategori: true, mainImageId: true
        },
      })
      : Promise.resolve([]),

    uniqAutoCoverKategoriIds.length
      ? prisma.kategoriProdukItem.findMany({
        where: { kategoriId: { in: uniqAutoCoverKategoriIds } },
        orderBy: [{ kategoriId: "asc" }, { urutan: "asc" }, { id: "asc" }],
        select: { kategoriId: true, produkId: true },
      })
      : Promise.resolve([]),

    uniqBranchIds.length > 0
      ? prisma.cabangToko.findMany({ where: { id: { in: uniqBranchIds } }, select: { id: true, namaCabang: true, mapsUrl: true, urutan: true } })
      : prisma.cabangToko.findMany({ take: 1, select: { id: true, namaCabang: true, mapsUrl: true, urutan: true } }),

    uniqHubungiIds.length
      ? prisma.hubungi.findMany({ where: { id: { in: uniqHubungiIds } }, select: { id: true, nomor: true, prioritas: true } })
      : prisma.hubungi.findMany({ orderBy: { id: "asc" }, select: { id: true, nomor: true, prioritas: true } }),

    uniqMediaIconKeys.length
      ? prisma.mediaSosial.findMany({ where: { iconKey: { in: uniqMediaIconKeys } } })
      : prisma.mediaSosial.findMany({ orderBy: [{ prioritas: "desc" }, { id: "asc" }] }),
  ]);

  const productListingItems = productListingItemsRaw as any[];
  for (const p of productListingItems) {
    const mainId = p.mainImageId ? Number(p.mainImageId) : null;
    if (mainId) imageIds.push(mainId);
  }

  const kategoriMap = new Map<number, any>();
  for (const k of kategoris as any[]) kategoriMap.set(Number(k.id), k);

  const produkById = new Map<number, any>();
  for (const p of produk as any[]) {
    produkById.set(Number(p.id), p);
    const mainId = p.mainImageId ? Number(p.mainImageId) : null;
    if (mainId) imageIds.push(mainId);
  }

  const autoCoverImageIdByKategori = new Map<number, number>();
  const firstProdukIdByKategori = new Map<number, number>();
  for (const it of autoCoverItems as any[]) {
    const kId = Number(it.kategoriId);
    if (!firstProdukIdByKategori.has(kId) && it.produkId) {
      firstProdukIdByKategori.set(kId, Number(it.produkId));
    }
  }
  const produkIdsAuto = Array.from(new Set(Array.from(firstProdukIdByKategori.values()))).filter((n) => n > 0);

  let produkAuto: any[] = [];
  if (produkIdsAuto.length) {
    produkAuto = await prisma.produk.findMany({
      where: { id: { in: produkIdsAuto } },
      select: { id: true, mainImageId: true },
    });
  }

  const produkAutoById = new Map<number, any>();
  for (const p of produkAuto as any[]) produkAutoById.set(Number(p.id), p);

  for (const [kategoriId, produkId] of firstProdukIdByKategori.entries()) {
    const p = produkAutoById.get(Number(produkId));
    const mainId = p?.mainImageId ? Number(p.mainImageId) : null;
    if (mainId) {
      autoCoverImageIdByKategori.set(Number(kategoriId), Number(mainId));
      imageIds.push(Number(mainId));
    }
  }

  const imageMap = new Map<number, any>();
  const finalImageIds = Array.from(new Set(imageIds)).filter((n) => Number.isFinite(n) && n > 0);
  if (finalImageIds.length) {
    const imgs = await prisma.gambarUpload.findMany({
      where: { id: { in: finalImageIds } },
      select: { id: true, url: true },
    });
    for (const img of imgs as any[]) imageMap.set(Number(img.id), img);
  }

  const autoCoverUrlByKategori = new Map<number, string>();
  for (const [kategoriId, imgId] of autoCoverImageIdByKategori.entries()) {
    const url = imageMap.get(Number(imgId))?.url;
    if (url) autoCoverUrlByKategori.set(Number(kategoriId), String(url));
  }

  const cabangMap = new Map<number, any>();
  for (const b of cabangs as any[]) cabangMap.set(Number(b.id), b);

  const hubungiById = new Map<number, any>();
  for (const h of hubungis as any[]) hubungiById.set(Number(h.id), h);

  const mediaSosialByKey = new Map<string, any>();
  for (const r of mediaSosialsRaw as any[]) {
    const k = String((r as any).iconKey ?? "").trim();
    if (k) mediaSosialByKey.set(k, r);
  }

  const themeMetaRow = (allDrafts as any[]).find(
    (d) => String(d?.slug ?? "") === `${THEME_META_SLUG_PREFIX}${themeKey}`,
  );
  const themeMetaCfg = isObject((themeMetaRow as any)?.config) ? ((themeMetaRow as any).config as any) : {};
  const backgroundTheme =
    typeof themeMetaCfg?.backgroundTheme === "string" ? String(themeMetaCfg.backgroundTheme).trim() : "FOLLOW_NAVBAR";

  const navbarTheme =
    typeof themeMetaCfg?.navbarTheme === "string" ? String(themeMetaCfg.navbarTheme).trim() : "NAVY_GOLD";

  const themeName =
    typeof themeMetaCfg?.themeName === "string" ? String(themeMetaCfg.themeName).trim() : "";

  return { draftSections, categoryGridById, categoryCommerceById, kategoriMap, imageMap, autoCoverUrlByKategori, produkMap: produkById, productListingItems, cabangMap, hubungiById, mediaSosialByKey, backgroundTheme, themeName, navbarTheme };
}


