// app/admin/admin_dashboard/admin_pengaturan/toko/page.tsx
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NavbarTheme } from "@/app/navbar/Navbar";
// Removed individual editors imports in favor of Wrapper
import FooterEditorWrapper from "./FooterEditorWrapper";




import { headers } from "next/headers";
import styles from "./toko.module.css";
import TokoClient from "./toko-client";

import ProductCarouselPicker from "./ProductCarouselPicker";
import VoucherLinkEditor from "./VoucherLinkEditor";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

import ImagePickerCaptcha from "./ImagePickerCaptcha";
import FloatingPreviewActions from "./FloatingPreviewActions.client";
import TextSectionBlocksEditor from "./TextSectionBlocksEditor.client";
import CategoryCommerceGridEditorNoSSR from "./CategoryCommerceGridEditorNoSSR.client";
import AdminNotice from "./AdminNotice.client";
import DeleteSectionButton from "./DeleteSectionButton.client";
import {
  isThemeMetaRow,
  getThemeKeyFromRow,
  normalizeThemeKey,
  themeMetaSlug,
  withThemeKey,
  getRefererUrl,
  getThemeKeyFromReferer,
  updateDraftConfigPreserveTheme,
  parseCustomPromoBgTheme,
  computeHargaSetelahPromo,
  safeDecode,
  isObject,
  safeDecodeURIComponent,
  normalizeThemeAttr,
  parseSectionTheme,
  parseBgThemeLocal,
  MAX_ROOM_CARDS,
  MAX_CUSTOM_PROMO_VOUCHERS,
  SECTION_DEFS,
  ADMIN_TOKO_PATH,
  THEME_META_SLUG_PREFIX,
  DEFAULT_THEME_KEY,
  defaultThemeName,
  normalizeRoomCards,
  normalizeVoucherImageIds,
  legacyToNewConfig,
  slugify,
  parseNum,
  parseNumArray,
  SECTION_ICON,
} from "./toko-utils";
import { SectionTypeId, ThemeKey } from "./types";
import { normalizePublicUrl } from "@/lib/product-utils";
import {
  publishDraftToWebsite,
  unpublishWebsite,
  updateBackgroundTheme,
  updateNavbarTheme,
  toggleDraft,
  deleteDraft,
  addRoomCategoryCard,
  duplicateDraft,
  createTheme,
  renameTheme,
  resetTheme,
  duplicateThemeSimple,
  duplicateTheme,
  deleteTheme,
  autoGenerateThemeContent,
  saveHeroConfig,
  saveTextSectionConfig,
  saveProductListingConfig,
  saveCustomPromoConfig,
  saveSocialConfig,
  saveFooterConfig,
  saveBranchesConfig,
  saveContactConfig,
  saveCategoryGridConfig,
  saveCategoryGridCommerceConfig,
  saveProductCarouselConfig,
  pickAllProductListingProducts,
  autoGenerateHighlightCollection,
  clearProductCarouselProducts,
  clearProductListingProducts,
  removeCustomPromoVoucher,
  moveCustomPromoVoucher,
  clearCustomPromoVouchers,
  clearHighlightCollectionProducts,
  saveHighlightCollectionConfig,
  clearHighlightCollectionHero,
  uploadImageToGallery,
  uploadImageToGalleryAndAttach,
  saveGalleryConfig,
  saveRoomCategoryConfig,
  removeRoomCategoryCard,
  moveRoomCategoryCard,
  clearRoomCategoryCardImage,
  autoGenerateContactCopy,
  createDraftSection,
  updateDraftMeta,
} from "./toko-actions";

// selalu ambil data terbaru
export const dynamic = "force-dynamic";


// REDUNDANT HELPERS REMOVED (Moved to toko-utils.ts)


// REDUNDANT SERVER ACTIONS AND HELPERS REMOVED (Moved to toko-actions.ts and toko-utils.ts)

// Inline helper: enforce voucher link/kategori mutual exclusivity on the client (no hydration needed)
const voucherLinkScript = `
(() => {
  const showNotice = (msg) => {
    const existing = document.getElementById('cp-notice-modal');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'cp-notice-modal';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(5, 8, 20, 0.6)';
    overlay.style.zIndex = '10000';
    overlay.style.display = 'grid';
    overlay.style.placeItems = 'center';
    overlay.style.padding = '16px';

    const card = document.createElement('div');
    card.style.width = 'min(520px, 94vw)';
    card.style.background = 'linear-gradient(180deg, #fff9e8 0%, #ffffff 100%)';
    card.style.border = '1px solid rgba(212,175,55,0.65)';
    card.style.borderRadius = '18px';
    card.style.padding = '18px';
    card.style.boxShadow = '0 22px 44px rgba(2,6,23,0.35)';
    card.style.color = '#111';
    card.style.position = 'relative';

    const title = document.createElement('div');
    title.textContent = 'Info';
    title.style.fontWeight = '900';
    title.style.fontSize = '17px';
    title.style.color = '#0b1c3f';

    const body = document.createElement('div');
    body.textContent = msg;
    body.style.marginTop = '10px';
    body.style.fontSize = '14px';
    body.style.lineHeight = '1.5';

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'flex-end';
    actions.style.marginTop = '14px';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'OK';
    btn.style.padding = '9px 16px';
    btn.style.borderRadius = '12px';
    btn.style.border = '1px solid #d4af37';
    btn.style.background = 'linear-gradient(180deg, #e8c763 0%, #caa136 100%)';
    btn.style.color = '#fff';
    btn.style.fontWeight = '800';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', () => overlay.remove());

    const badge = document.createElement('div');
    badge.textContent = 'INFO';
    badge.style.position = 'absolute';
    badge.style.top = '10px';
    badge.style.right = '10px';
    badge.style.background = '#0b1c3f';
    badge.style.color = '#fff';
    badge.style.fontSize = '10px';
    badge.style.letterSpacing = '0.08em';
    badge.style.padding = '6px 8px';
    badge.style.borderRadius = '999px';

    actions.appendChild(btn);
    card.appendChild(badge);
    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(actions);
    overlay.appendChild(card);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
    setTimeout(() => {
      try {
        overlay.remove();
      } catch {}
    }, 3000);
  };

  const forms = document.querySelectorAll('[data-cp-form]');
  forms.forEach((form) => {
    let autosaveTimer = null;
    const sectionId = form.getAttribute('data-cp-form') || '';
    const saveVoucherLink = async (id, mode, catVal, linkVal) => {
      if (!sectionId) return;
      try {
        await fetch('/api/admin/admin_dashboard/admin_pengaturan/toko/custom_promo_link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionId: Number(sectionId),
            voucherId: Number(id),
            mode,
            categoryId: catVal ? Number(catVal) : null,
            link: linkVal || '',
          }),
        });
      } catch (e) {
        console.error('Gagal simpan link voucher', e);
      }
    };

    const applyVoucherMode = (id, mode) => {
      const catSel = form.querySelector('[data-voucher-cat="' + id + '"]');
      const linkInp = form.querySelector('[data-voucher-link="' + id + '"]');
      if (!catSel && !linkInp) return;

      const enableCat = mode === 'category';
      const enableLink = mode === 'manual';

      if (catSel) {
        if (enableCat) catSel.removeAttribute('disabled');
        else catSel.setAttribute('disabled', 'true');
      }
      if (linkInp) {
        if (enableLink) linkInp.removeAttribute('disabled');
        else linkInp.setAttribute('disabled', 'true');
      }

      if (mode === 'category' && linkInp) linkInp.value = '';
      if (mode === 'manual' && catSel) catSel.value = '';
    };

    const syncVoucherModeState = () => {
      const seen = new Set();
      form.querySelectorAll('[data-voucher-cat]').forEach((sel) => {
        const id = sel.getAttribute('data-voucher-cat');
        if (!id || seen.has(id)) return;
        seen.add(id);
        const modeEl = form.querySelector('[data-voucher-mode="' + id + '"]:checked');
        const mode = modeEl ? modeEl.value : '';
        applyVoucherMode(id, mode);
      });
    };

    // auto-pick radio when user interacts
    form.querySelectorAll('[data-voucher-cat]').forEach((sel) => {
      const id = sel.getAttribute('data-voucher-cat');
      sel.addEventListener('change', () => {
        const r = form.querySelector('[data-voucher-mode="' + id + '"][value="category"]');
        if (r) r.checked = true;
        syncVoucherModeState();
        const catVal = sel.value ? String(sel.value).trim() : '';
        saveVoucherLink(id, 'category', catVal, '');
      });
    });
    form.querySelectorAll('[data-voucher-link]').forEach((inp) => {
      const id = inp.getAttribute('data-voucher-link');
      inp.addEventListener('input', () => {
        const r = form.querySelector('[data-voucher-mode="' + id + '"][value="manual"]');
        if (r) r.checked = true;
        syncVoucherModeState();
        if (autosaveTimer) clearTimeout(autosaveTimer);
        autosaveTimer = setTimeout(() => {
          const linkVal = inp.value ? String(inp.value).trim() : '';
          saveVoucherLink(id, 'manual', '', linkVal);
        }, 500);
      });
    });
    form.querySelectorAll('[data-voucher-mode]').forEach((radio) => {
      radio.addEventListener('change', () => {
        const r = radio;
        const id = r.getAttribute('data-voucher-mode');
        const mode = r.value;
        if (id) applyVoucherMode(id, mode);
        syncVoucherModeState();
      });
    });

    // validate before submit: no serakah, radio sesuai isian
    form.addEventListener('submit', (e) => {
      let hasError = false;
      const seen = new Set();
      form.querySelectorAll('[data-voucher-cat]').forEach((sel) => {
        const id = sel.getAttribute('data-voucher-cat');
        if (!id || seen.has(id)) return;
        seen.add(id);
        const inp = form.querySelector('[data-voucher-link="' + id + '"]');
        const modeEl = form.querySelector('[data-voucher-mode="' + id + '"]:checked');
        const mode = modeEl ? modeEl.value : '';
        const catVal = sel.value ? String(sel.value).trim() : '';
        const linkVal = inp && inp.value ? String(inp.value).trim() : '';
        const errEl = form.querySelector('[data-voucher-error="' + id + '"]');
        const msgs = [];

        if (mode === 'category' && !catVal) {
          msgs.push('Pilih kategori atau ganti ke link manual.');
        }
        if (mode === 'manual' && !linkVal) {
          msgs.push('Isi link atau ganti ke kategori.');
        }
        if (mode === '' && catVal && linkVal) {
          msgs.push('Pilih salah satu: kategori atau link manual (bukan keduanya).');
        }

        if (errEl) {
          errEl.textContent = msgs.join(' ');
          errEl.style.display = msgs.length ? 'block' : 'none';
        }
        // Hanya blok submit kalau user mengisi keduanya sekaligus.
        if (mode === '' && catVal && linkVal) {
          hasError = true;
        }
      });
      if (hasError) {
        e.preventDefault();
        showNotice('Periksa input voucher: kategori dan link tidak boleh terisi bersamaan.');
        return;
      }

      const submitter = e.submitter;
      if (submitter && submitter.matches && submitter.matches('[data-cp-save]')) {
        showNotice('Silahkan refresh atau klik Ctrl + F5 setelah Simpan.');
      }
    });

    // initial state
    syncVoucherModeState();
  });
})();
`;

const scrollRestoreScript = `
(() => {
  const scrollToSection = () => {
    const hash = window.location.hash ? window.location.hash.replace('#', '') : '';
    const params = new URLSearchParams(window.location.search);
    const sectionId = params.get('sectionId');
    const targetId = hash || (sectionId ? 'section-' + sectionId : '');
    if (targetId) {
      const el = document.getElementById(targetId);
      if (!el) return;
      el.scrollIntoView({ block: 'start', behavior: 'auto' });
      return;
    }

    try {
      const saved = window.sessionStorage.getItem('toko-scroll-y');
      if (saved) {
        window.sessionStorage.removeItem('toko-scroll-y');
        const y = Number(saved);
        if (Number.isFinite(y) && y >= 0) {
          window.scrollTo({ top: y, behavior: 'auto' });
        }
      }
    } catch {
      // ignore storage errors
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(scrollToSection, 60));
  } else {
    setTimeout(scrollToSection, 60);
  }
})();
`;

const formFocusScript = `
(() => {
  const storeFormId = (form) => {
    if (!form || !form.id) return;
    if (!form.getAttribute || form.getAttribute('data-section-form') !== '1') return;
    try {
      window.sessionStorage.setItem('toko-last-form-id', form.id);
    } catch {
      // ignore storage errors
    }
  };

  const onFocus = (e) => {
    const target = e.target;
    if (!target) return;
    const form = target.closest ? target.closest('form') : null;
    if (form) storeFormId(form);
  };

  document.addEventListener('focusin', onFocus);
  document.addEventListener('click', onFocus);
  document.addEventListener('change', onFocus);
  document.addEventListener('input', onFocus);
})();
`;



// (REDUNDANT SERVER ACTIONS AND HELPERS HAVE BEEN MOVED TO toko-actions.ts AND toko-utils.ts)

















// ========================
// PAGE
// ========================

export default async function TokoPengaturanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const noticeRaw = typeof sp?.notice === "string" ? sp.notice : "";
  const errorRaw = typeof sp?.error === "string" ? sp.error : "";
  const notice = safeDecode(noticeRaw);
  const error = safeDecode(errorRaw);
  const requestedThemeKey = normalizeThemeKey(typeof sp?.theme === "string" ? sp.theme : "");

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
    return `/admin/admin_dashboard/admin_pengaturan/toko${qs ? `?${qs}` : ""}`;
  };
  const closeNoticeUrl = buildCloseUrl(["notice", "r"]);
  const closeErrorUrl = buildCloseUrl(["error", "r"]);



  const [
    navbarSetting,
    draftSectionsRaw,
    mediaSocialItemsRaw,
    categoryItemsRaw,
    hubungiItemsRaw,
    cabangItemsRaw,
    gambarItemsRaw,
    bannerPromoItemsRaw,
  ] = await Promise.all([
    prisma.navbarSetting.findUnique({ where: { id: 1 } }),
    prisma.homepageSectionDraft.findMany({ orderBy: { sortOrder: "asc" } }),

    prisma.mediaSosial.findMany({ orderBy: { id: "asc" } }),
    prisma.kategoriProduk.findMany({ orderBy: { id: "asc" } }),
    prisma.hubungi.findMany({ orderBy: { id: "asc" } }),
    prisma.cabangToko.findMany({ orderBy: { id: "asc" } }),
    prisma.gambarUpload.findMany({ orderBy: { id: "desc" }, take: 200 }),
    prisma.bannerPromo.findMany({ orderBy: { id: "desc" }, take: 50 }),
  ]);

  const draftSections = (draftSectionsRaw ?? []) as any[];
  const mediaSocialItems = (mediaSocialItemsRaw ?? []) as any[];
  const categoryItems = (categoryItemsRaw ?? []) as any[];
  const hubungiItems = (hubungiItemsRaw ?? []) as any[];
  const cabangItems = (cabangItemsRaw ?? []) as any[];
  const gambarItems = (gambarItemsRaw ?? []) as any[];
  const bannerPromoItems = (bannerPromoItemsRaw ?? []) as any[];

  // Collect used product IDs to ensure they are fetched
  const usedProductIds = new Set<number>();
  for (const row of draftSections) {
    const t = String((row as any).type ?? "").trim().toUpperCase();
    if (t === "PRODUCT_LISTING" || t === "PRODUCT_CAROUSEL" || t === "HIGHLIGHT_COLLECTION") {
      const cfg = (row as any).config ?? {};
      const ids = Array.isArray(cfg.productIds) ? cfg.productIds : [];
      ids.forEach((id: any) => {
        const n = Number(id);
        if (Number.isFinite(n) && n > 0) usedProductIds.add(n);
      });
    }
  }

  // Fetch products (latest 200 + used ones)
  const latestProducts = await prisma.produk.findMany({ orderBy: { id: "desc" }, take: 200 });
  const fetchedIds = new Set(latestProducts.map((p: any) => p.id));

  const missingIds = Array.from(usedProductIds).filter((id) => !fetchedIds.has(id));
  let extraProducts: any[] = [];
  if (missingIds.length > 0) {
    extraProducts = await prisma.produk.findMany({
      where: { id: { in: missingIds } },
    });
  }

  const productItems = [...latestProducts, ...extraProducts];

  // Map gambar_upload by id (dipakai untuk preview selection di HERO)
  const imageMap = new Map<number, { id: number; url: string; title: string; tags: string }>(
    (gambarItems as any[]).map((g: any) => [
      Number(g?.id),
      {
        id: Number(g?.id),
        url: String(g?.url ?? ""),
        title: String(g?.title ?? ""),
        tags: String(g?.tags ?? ""),
      },
    ])
  );

  // =========================
  // THEME list (hanya theme yang sudah dibuat via meta row)
  // =========================
  const themes = (() => {
    const seen = new Set<string>();
    const out: { key: ThemeKey; name: string; _id: number }[] = [];

    (draftSections as any[]).forEach((row) => {
      if (!isThemeMetaRow(row)) return;
      const key = getThemeKeyFromRow(row);
      if (!key || seen.has(key)) return;
      const nameRaw = (row?.config as any)?.themeName;
      const name = typeof nameRaw === "string" && nameRaw.trim() ? nameRaw.trim() : defaultThemeName(key);
      out.push({ key, name, _id: Number(row?.id ?? 0) });
      seen.add(key);
    });

    out.sort((a, b) => (a._id || 0) - (b._id || 0));
    return out.map(({ key, name }) => ({ key, name }));
  })();

  /* 
   * LOGIC UPDATE: Active Theme Key
   * Jangan paksa fallback ke existing `themes[0]` jika user meminta theme baru!
   * Ini menyebabkan "Theme Crosstalk" (edit theme A malah masuk ke theme B).
   * Kita izinkan requestedThemeKey apa saja, asalkan valid.
   */
  const activeThemeKey: ThemeKey = (() => {
    const req = normalizeThemeKey(requestedThemeKey);
    // Jika ada request spesifik di URL (misal ?theme=theme_baru), pakai itu.
    if (requestedThemeKey) {
      return req;
    }
    // Fallback: theme pertama yang ada, atau default.
    return themes.length > 0 ? themes[0].key : DEFAULT_THEME_KEY;
  })();

  const activeThemeName = activeThemeKey
    ? (themes.find((t) => t.key === activeThemeKey)?.name ?? defaultThemeName(activeThemeKey))
    : "";

  const draftSectionsForTheme = activeThemeKey
    ? draftSections.filter((d: any) => !isThemeMetaRow(d)).filter((d: any) => getThemeKeyFromRow(d) === activeThemeKey)
    : [];

  console.log(`🖼️ [Admin] ActiveTheme: ${activeThemeKey}, RenderCount: ${draftSectionsForTheme.length}`);

  // --- GHOST CLEANUP (Admin Side) ---
  // Ensure we don't display or keep "untitled" sections that might be ghosts.
  // We filter carefully to only delete rows that are definitely junk (no title, not system).
  // --- GHOST CLEANUP REMOVED ---
  // We now allow sections with empty titles to exist (as requested).
  const ghostsFound: any[] = [];

  // ----------------------------------

  draftSectionsForTheme.forEach(s => console.log(`   - ID: ${s.id}, Type: ${s.type}, Theme: ${getThemeKeyFromRow(s)}`));

  // Pastikan gambar yang direferensikan (mis: hero Highlight Collection) selalu bisa dipreview
  // walaupun tidak masuk list gambar terakhir (take: 200).
  const gambarById = new Map<number, any>(gambarItems.map((g: any) => [Number(g.id), g]));

  const highlightHeroIdsNeeded = new Set<number>();
  for (const row of draftSectionsForTheme) {
    const t = String((row as any).type ?? "").trim().toUpperCase();
    if (t !== "HIGHLIGHT_COLLECTION") continue;
    const heroId = Number((((row as any).config ?? {}) as any)?.heroImageId);
    if (Number.isFinite(heroId) && heroId > 0) highlightHeroIdsNeeded.add(heroId);
  }

  const missingHeroIds = Array.from(highlightHeroIdsNeeded).filter((id) => !gambarById.has(id));
  if (missingHeroIds.length) {
    const extra = await prisma.gambarUpload.findMany({
      where: { id: { in: missingHeroIds } },
      select: { id: true, url: true, title: true },
    });
    for (const g of extra as any[]) {
      gambarById.set(Number(g.id), g);
    }
  }

  // Pastikan image ROOM_CATEGORY juga bisa dipreview walau bukan "latest N"
  const roomImageIdsNeeded = new Set<number>();
  for (const row of draftSectionsForTheme) {
    const t = String((row as any).type ?? "").trim().toUpperCase();
    if (t !== "ROOM_CATEGORY") continue;

    const cfgRow = ((row as any).config ?? {}) as any;
    const cards = normalizeRoomCards(cfgRow.cards);
    for (const c of cards) {
      const id = Number((c as any)?.imageId);
      if (Number.isFinite(id) && id > 0) roomImageIdsNeeded.add(id);
    }
  }

  const missingRoomIds = Array.from(roomImageIdsNeeded).filter((id) => !gambarById.has(id));
  if (missingRoomIds.length) {
    const extra = await prisma.gambarUpload.findMany({
      where: { id: { in: missingRoomIds } },
      select: { id: true, url: true, title: true },
    });
    for (const g of extra as any[]) {
      gambarById.set(Number(g.id), g);
    }
  }



  // =========================
  // ROOM_CATEGORY - Auto cover (mode otomatis)
  // Ambil gambar dari produk pertama di kategori (kalau ada), supaya editor bisa menampilkan thumbnail walau imageId null.
  // Catatan: ini hanya untuk PREVIEW di admin editor; tidak mengubah config.
  // =========================
  const autoCoverImageIdByKategori = new Map<number, number>();
  const roomKategoriIdsNeeded = new Set<number>();

  for (const row of draftSectionsForTheme) {
    const t = String((row as any).type ?? "").trim().toUpperCase();
    if (t !== "ROOM_CATEGORY") continue;

    const cfgRow = ((row as any).config ?? {}) as any;
    const cards = normalizeRoomCards(cfgRow.cards);
    for (const c of cards) {
      const kid = Number((c as any)?.kategoriId);
      if (Number.isFinite(kid) && kid > 0) roomKategoriIdsNeeded.add(kid);
    }
  }

  if (roomKategoriIdsNeeded.size) {
    try {
      // menggunakan "as any" supaya tidak nge-break kalau model/schema berbeda
      const relItems = await (prisma as any).kategoriProdukItem.findMany({
        where: { kategoriId: { in: Array.from(roomKategoriIdsNeeded) } },
        orderBy: { id: "asc" },
        select: { id: true, kategoriId: true, produkId: true },
      });

      const firstProdukByKategori = new Map<number, number>();
      for (const it of (relItems as any[]) ?? []) {
        const kid = Number((it as any)?.kategoriId);
        const pid = Number((it as any)?.produkId);
        if (!Number.isFinite(kid) || kid <= 0) continue;
        if (!Number.isFinite(pid) || pid <= 0) continue;
        if (!firstProdukByKategori.has(kid)) firstProdukByKategori.set(kid, pid);
      }

      const produkIds = Array.from(firstProdukByKategori.values());
      if (produkIds.length) {
        const prods = await prisma.produk.findMany({
          where: { id: { in: produkIds } },
          select: { id: true, mainImageId: true, galeri: { select: { gambarId: true }, orderBy: { urutan: 'asc' } } },
        });

        const prodById = new Map<number, any>(prods.map((p: any) => [Number(p.id), p]));

        for (const [kid, pid] of firstProdukByKategori) {
          const p = prodById.get(pid);
          const mainId = Number((p as any)?.mainImageId);
          let imageId: number | null = Number.isFinite(mainId) && mainId > 0 ? mainId : null;

          if (!imageId) {
            const gal = (p as any)?.galeri ?? [];
            const firstGal = Number(gal[0]?.gambarId);
            if (Number.isFinite(firstGal) && firstGal > 0) imageId = firstGal;
          }

          if (imageId) autoCoverImageIdByKategori.set(kid, imageId);
        }

        // Pastikan image auto-cover juga tersedia di gambarById map
        const missingAutoIds = Array.from(new Set(Array.from(autoCoverImageIdByKategori.values()))).filter((id) => !gambarById.has(id));
        if (missingAutoIds.length) {
          const extra = await prisma.gambarUpload.findMany({
            where: { id: { in: missingAutoIds } },
            select: { id: true, url: true, title: true },
          });
          for (const g of extra as any[]) {
            gambarById.set(Number(g.id), g);
          }
        }
      }
    } catch {
      // ignore: kalau model / field berbeda, editor tetap jalan tanpa auto thumbnail
    }
  }
  /* 
   * LOGIC UPDATE: Read Navbar Theme from DRAFT META first.
   * If draft has no specific navbar theme, fallback to global setting or default.
   */
  // More robust finding: Check config key OR slug match
  const activeMetaRow = draftSections.find((r) => {
    if (isThemeMetaRow(r) && getThemeKeyFromRow(r) === activeThemeKey) return true;
    if (String(r.slug) === themeMetaSlug(activeThemeKey)) return true;
    return false;
  });
  const activeMetaConfig = (activeMetaRow?.config ?? {}) as any;
  const draftNavbarTheme = activeMetaConfig.navbarTheme; // "NAVY_GOLD", "WHITE_GOLD", etc.

  // Prioritize draft setting -> default (NAVY_GOLD).
  // REMOVE global setting fallback to prevent crosstalk (theme lain "ikut-ikutan").
  const currentTheme: NavbarTheme = (draftNavbarTheme as NavbarTheme) ?? "NAVY_GOLD";


  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Pengaturan Toko</h1>
      <p className={styles.subtitle}>
        Atur tampilan homepage versi <strong>Draft</strong>, preview, lalu publish ke website utama.
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>

      </div>

      <AdminNotice
        notice={notice}
        error={error}
        closeNoticeUrl={closeNoticeUrl}
        closeErrorUrl={closeErrorUrl}
      />

      {/* NAVBAR KHUSUS TOKO: 1) Urutkan 2) Organize */}
      {/* SIDEBAR NAV (style ikut Media Sosial) */}
      <input id="tokoSidebarToggle" type="checkbox" className={styles.sidebarToggle} />

      <header className={styles.pageTopbar}>
        <label htmlFor="tokoSidebarToggle" className={styles.hamburgerBtn} aria-label="Buka menu">
          :::
        </label>
        <div className={styles.pageTopbarTitle}>Pengaturan Toko</div>
        <Link
          href="/admin/admin_dashboard/admin_pengaturan"
          className={styles.secondaryButton}
          style={{ marginLeft: "auto", textDecoration: "none" }}
        >
          &lt;- Kembali
        </Link>
      </header>

      <label htmlFor="tokoSidebarToggle" className={styles.sidebarOverlay} aria-label="Tutup menu" />

      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarBrand}>
            <div className={styles.sidebarAvatar} aria-hidden="true">
              A
            </div>
            <div>
              <div className={styles.sidebarBrandTitle}>APIX INTERIOR</div>
              <div className={styles.sidebarBrandSub}>Admin Dashboard</div>
            </div>
          </div>

          <label htmlFor="tokoSidebarToggle" className={styles.sidebarClose} aria-label="Tutup menu">
            X
          </label>
        </div>

        <div style={{ padding: "0 16px 12px" }}>

        </div>

        <nav className={styles.sidebarNav}>
          <a href="/admin/admin_dashboard/admin_pengaturan" className={`${styles.sidebarLink} ${styles.sidebarLinkBack}`}>
            &lt;- Kembali ke Pengaturan
          </a>
          <a href="#preview-theme" className={`${styles.sidebarLink} ${styles.sidebarLinkPreview}`}>
            Preview &amp; Theme
          </a>
          <a href="#tema" className={`${styles.sidebarLink} ${styles.sidebarLinkTema}`}>
            Tema (Navbar &amp; Background)
          </a>
          <a href="#urutkan" className={`${styles.sidebarLink} ${styles.sidebarLinkUrutkan}`}>
            Urutkan Section
          </a>
          <a href="#tambah-section" className={`${styles.sidebarLink} ${styles.sidebarLinkTambah}`}>
            Tambah Section
          </a>
        </nav>
      </aside>

      {/* Aksi Preview & Publish */}
      <section id="preview-theme" className={styles.formCard}>
        <h2 className={styles.sectionHeading}>Preview & Publish</h2>
        <p className={styles.sectionSubheading}>
          Klik <strong>Preview Draft</strong> untuk melihat tampilan theme. Di halaman preview, kamu bisa klik <strong>Publish ke Website Utama</strong> untuk mempublikasikan theme ini, atau <strong>Hapus Publish</strong> untuk menghapus konten yang sudah dipublikasikan.
        </p>

        <div className={styles.sectionEditActions}>
          {activeThemeKey ? (
            <a
              href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${activeThemeKey}`}
              className={styles.primaryButton}
              style={{ textDecoration: "none" }}
            >
              Preview Draft → Publish
            </a>
          ) : (
            <span className={styles.secondaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
              Preview Draft
            </span>
          )}
        </div>
      </section>


      {/* ================= THEME ================= */}
      <section className={styles.formCard}>
        <h2 className={styles.sectionHeading}>Theme Draft</h2>
        <p className={styles.sectionSubheading}>
          Theme adalah paket susunan section draft. Mulai dari kosong, susun section, lalu simpan. Kamu bisa membuat{" "}
          <strong>theme sebanyak yang kamu mau</strong>.
        </p>

        <div className={styles.sectionEditActions} style={{ flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          {themes.map((t) => (
            <a
              key={t.key}
              href={`${ADMIN_TOKO_PATH}?theme=${t.key}`}
              className={t.key === activeThemeKey ? styles.primaryButton : styles.secondaryButton}
              style={{ textDecoration: "none" }}
              aria-current={t.key === activeThemeKey ? "page" : undefined}
            >
              {t.name}
            </a>
          ))}

          <form action={createTheme}>
            <button type="submit" className={styles.primaryButton} style={{ fontWeight: 800 }}>
              + Theme
            </button>
          </form>
        </div>

        {!themes.length ? (
          <div style={{ marginTop: 12, padding: 12, border: "1px dashed rgba(0,0,0,0.15)", borderRadius: 12 }}>
            Belum ada theme. Klik <strong>+ Theme</strong> untuk membuat theme baru (kosong), lalu susun section-nya.
          </div>
        ) : null}

        {activeThemeKey ? (
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 13, opacity: 0.9 }}>Rename theme</h3>
              <form action={renameTheme}>
                <input type="hidden" name="themeKey" value={activeThemeKey} />
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    className={styles.input}
                    name="themeName"
                    placeholder="Nama theme"
                    defaultValue={activeThemeName}
                    required
                  />
                  <button type="submit" className={styles.secondaryButton}>
                    Simpan
                  </button>
                </div>
              </form>
            </div>

            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 13, opacity: 0.9 }}>Reset theme jadi kosong</h3>
              <form action={resetTheme}>
                <input type="hidden" name="themeKey" value={activeThemeKey} />
                <button type="submit" className={styles.dangerButton}>
                  Reset Theme
                </button>
              </form>
            </div>

            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 13, opacity: 0.9 }}>Duplikat theme</h3>
              <form action={duplicateThemeSimple}>
                <input type="hidden" name="fromKey" value={activeThemeKey} />
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    className={styles.input}
                    name="newThemeName"
                    placeholder="Nama theme baru"
                    defaultValue={`Copy dari ${activeThemeName}`}
                    required
                  />
                  <button type="submit" className={styles.secondaryButton}>
                    Buat duplikat
                  </button>
                </div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                  Ini akan membuat theme baru dengan susunan & pengaturan section yang sama seperti theme aktif.
                </div>
              </form>

              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: "pointer", fontSize: 12, opacity: 0.85 }}>Opsi lanjut (overwrite)</summary>
                <div style={{ marginTop: 8 }}>
                  <form action={duplicateTheme}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <label style={{ fontSize: 12, opacity: 0.85 }}>Dari</label>
                      <select className={styles.select} name="fromKey" defaultValue={activeThemeKey}>
                        {themes.map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
                      <label style={{ fontSize: 12, opacity: 0.85 }}>Ke</label>
                      <select className={styles.select} name="toKey" defaultValue={"__new__"}>
                        {[
                          ...themes
                            .filter((t) => t.key !== (activeThemeKey || ""))
                            .map((t) => ({ key: t.key, label: `${t.name} (overwrite)` })),
                          { key: "__new__", label: "Theme baru (copy)" },
                        ].map((opt) => (
                          <option key={opt.key} value={opt.key}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button type="submit" className={styles.secondaryButton} style={{ marginTop: 8 }}>
                      Duplikat
                    </button>
                  </form>
                </div>
              </details>
            </div>

            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 13, opacity: 0.9 }}>Hapus theme</h3>
              <form action={deleteTheme}>
                <input type="hidden" name="themeKey" value={activeThemeKey} />
                <button type="submit" className={styles.dangerButton}>
                  Hapus Theme
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {activeThemeKey ? (
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            Theme aktif: <strong>{activeThemeName}</strong>. Sections yang kamu lihat &amp; edit di bawah hanya untuk theme ini.
          </div>
        ) : null}
      </section>


      {/* ================= 2. ORGANIZE (TEMA + SECTION) ================= */}

      {/* Tema Navbar (keep) */}
      <section id="tema" className={styles.formCard}>
        <h2 className={styles.sectionHeading}>Tema Navbar</h2>
        <p className={styles.sectionSubheading}>
          Pilih kombinasi warna navbar utama yang akan tampil di website pengunjung.
        </p>

        <div className={styles.currentThemeRow}>
          <span className={styles.currentThemeLabel}>Tema aktif sekarang:</span>
          <span className={styles.currentThemeBadge}>
            {currentTheme === "NAVY_GOLD" && "Navy + Gold"}
            {currentTheme === "WHITE_GOLD" && "White + Gold"}
            {currentTheme === "NAVY_WHITE" && "Navy + White"}
            {currentTheme === "GOLD_NAVY" && "Gold + Navy"}
            {currentTheme === "GOLD_WHITE" && "Gold + White"}
            {currentTheme === "WHITE_NAVY" && "White + Navy"}

          </span>
        </div>

        <form id="navbarThemeForm" data-section-form="1" action={updateNavbarTheme} className={styles.fieldGroup}>
          <label htmlFor="navbarTheme" className={styles.label}>
            Pilih tema warna navbar
          </label>
          <select id="navbarTheme" name="navbarTheme" defaultValue={currentTheme ?? ""} className={styles.select}>
            <option value="">Pilih tema navbar</option>
            <option value="NAVY_GOLD">Navy + Gold</option>
            <option value="WHITE_GOLD">White + Gold</option>
            <option value="NAVY_WHITE">Navy + White</option>
            <option value="GOLD_NAVY">Gold + Navy</option>
            <option value="GOLD_WHITE">Gold + White</option>
            <option value="WHITE_NAVY">White + Navy</option>
          </select>
          <p className={styles.helperText}>
            Tema aktif bisa kamu lihat di atas. Dropdown ini hanya untuk memilih tema baru.
          </p>

          <input type="hidden" name="themeKey" value={activeThemeKey ?? ""} />
          <button type="submit" className={styles.submitButton}>
            Simpan Tema Navbar
          </button>
        </form>
      </section>
      {/* Tambah Section Background Utama */}
      <section className={styles.formCard}>
        <h2 className={styles.sectionHeading}>Background Utama</h2>
        <p className={styles.sectionSubheading}>
          Pilih warna background utama untuk tampilan di <code>/preview</code>. Secara default, background mengikuti warna navbar.
        </p>


        <form id="backgroundThemeForm" data-section-form="1" action={updateBackgroundTheme} className={styles.newSectionForm}>
          <input type="hidden" name="themeKey" value={activeThemeKey ?? ""} />
          <div className={styles.newSectionGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Tema Background Utama</label>
              <select
                name="backgroundTheme"
                defaultValue={String(activeMetaConfig?.backgroundTheme ?? "FOLLOW_NAVBAR")}
                className={styles.select}
              >
                <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                <option value="NAVY_GOLD">Navy</option>
                <option value="WHITE_GOLD">White</option>
                <option value="GOLD_NAVY">Gold</option>
              </select>
              <p className={styles.helperText}>
                Kalau tidak diubah, background <code>/preview</code> akan otomatis mengikuti tema navbar yang aktif.
              </p>
            </div>
          </div>

          <button type="submit" className={styles.submitButton}>
            Simpan Background Utama
          </button>
        </form>

      </section>

      {/* ================= 1. URUTKAN (DRAG DROP) ================= */}
      <section id="urutkan" className={styles.formCard}>
        <div className={styles.sectionsHeader}>
          <div>
            <h2 className={styles.sectionHeading}>Urutkan Section Draft (Drag &amp; Drop)</h2>
            <p className={styles.sectionSubheading}>
              Tarik handle <span className={styles.dragHandle}></span> ke atas/bawah untuk mengubah urutan section di
              homepage draft. Setelah diurutkan, klik tombol &quot;Simpan Urutan&quot;.
            </p>
          </div>
          <button type="button" className={`${styles.smallButton} js-save-order`}>
            Simpan Urutan
          </button>
        </div>

        {(() => { console.log(`🖼️ [Admin] SECTION_DEFS count: ${SECTION_DEFS.length}, Draft count: ${draftSectionsForTheme.length} for theme: ${activeThemeKey}`); return null; })()}
        {draftSectionsForTheme.length === 0 ? (
          <p className={styles.emptyText}>
            Belum ada section draft. Tambahkan dulu minimal 1 section di tab Organize.
          </p>
        ) : (
          <div className={`${styles.sectionList} ${styles.sectionListDrag} js-section-list-drag`}>
            {(draftSectionsForTheme || []).filter((s: any) => s && typeof s === 'object' && s.type).map((section: any, index: number) => {
              const def = SECTION_DEFS.find((d) => d.type === section.type);
              const label = def?.label ?? section.type;

              return (
                <div
                  key={section.id}
                  className={`${styles.sectionItem} ${(styles as any)[`sectionItem_${section.type}`] ?? ""} ${styles.sectionRowDraggable} js-section-row`}
                  draggable
                  data-id={section.id.toString()}
                >
                  <div className={styles.sectionTopRow}>
                    <div className={styles.sectionTopLeft}>
                      <span className={styles.dragHandle}></span>
                      <span className={styles.sectionOrder}>#{index + 1}</span>
                      <span className={`${styles.sectionTypePill} ${(styles as any)[`pill_${section.type}`] ?? ""}`}>
                        <span className={styles.sectionTypeIcon} aria-hidden="true">{SECTION_ICON[section.type] ?? ""}</span>
                        {label}
                      </span>
                      <span className={styles.themeBadge} style={{ fontSize: '10px', opacity: 0.6, background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                        {getThemeKeyFromRow(section)}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className={section.enabled ? styles.statusBadgeActive : styles.statusBadgeInactive}>
                        {section.enabled ? "Aktif" : "Nonaktif"}
                      </span>
                      <DeleteSectionButton id={Number(section.id)} deleteAction={deleteDraft} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>





      {/* Tambah Section Draft */}
      <section id="tambah-section" className={styles.formCard}>
        <h2 className={styles.sectionHeading}>Tambah Section Draft</h2>
        <p className={styles.sectionSubheading}>Tambahkan section baru ke homepage versi Draft.</p>

        <form action={createDraftSection} className={styles.newSectionForm}>
          <div className={styles.newSectionGrid}>
            <div className={styles.fieldGroup}>
              <label htmlFor="newSectionType" className={styles.label}>
                Jenis section
              </label>
              <select id="newSectionType" name="type" defaultValue="" className={styles.select}>
                <option value="">Pilih jenis section</option>
                {SECTION_DEFS.map((def) => (
                  <option key={def.type} value={def.type}>
                    {def.label}
                  </option>
                ))}
              </select>
              <p className={styles.helperText}>Contoh: Hero, Grid Kategori Produk, Carousel Produk, dll.</p>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="newSectionTitle" className={styles.label}>
                Judul tampil di halaman
              </label>
              <input
                id="newSectionTitle"
                name="title"
                type="text"
                placeholder="Contoh: Produk Terbaru"
                className={styles.input}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="newSectionSlug" className={styles.label}>
                Slug (opsional)
              </label>
              <input
                id="newSectionSlug"
                name="slug"
                type="text"
                placeholder="otomatis kalau dikosongkan"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.newSectionActions}>
            <button type="submit" className={styles.primaryButton}>
              Tambah Section Draft
            </button>
          </div>
        </form>
      </section>



      {/* Daftar Section Draft (detail + config) */}
      <section className={styles.formCard}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2 className={styles.sectionHeading}>Section Draft</h2>
        </div>
        <p className={styles.sectionSubheading}>
          Edit judul, slug, konfigurasi per type, serta aktif/nonaktifkan section yang sudah ada di Draft.
        </p>

        <div className={styles.sectionList}>
          {draftSectionsForTheme.length === 0 ? (
            <p className={styles.emptyText}>Belum ada section draft. Tambahkan minimal 1 section di atas.</p>
          ) : (
            (draftSectionsForTheme || []).filter((s: any) => s && typeof s === 'object' && s.type).map((section: any, index: number) => {
              const def = SECTION_DEFS.find((d) => d.type === section.type);
              const label = def?.label ?? section.type;
              const description = def?.description;

              const cfg = legacyToNewConfig(section.type, section.config ?? {});
              const legacyBannerPromoId = cfg?._legacyBannerPromoId ?? null;

              // DEBUG: Check if productIds is being loaded for PRODUCT_LISTING
              if (section.type === "PRODUCT_LISTING") {
                console.log("[DEBUG PRODUCT_LISTING] Section ID:", section.id);
                console.log("[DEBUG PRODUCT_LISTING] Raw config:", section.config);
                console.log("[DEBUG PRODUCT_LISTING] Processed cfg:", cfg);
                console.log("[DEBUG PRODUCT_LISTING] cfg.productIds:", cfg?.productIds);
              }

              return (
                <article
                  key={section.id}
                  id={`section-${section.id}`}
                  className={`${styles.sectionItem} ${(styles as any)[`sectionItem_${section.type}`] ?? ""}`}
                >
                  <div className={styles.sectionTopRow}>
                    <div className={styles.sectionTopLeft}>
                      <span className={styles.sectionOrder}>#{index + 1}</span>
                      <span className={`${styles.sectionTypePill} ${(styles as any)[`pill_${section.type}`] ?? ""}`}>  <span className={styles.sectionTypeIcon} aria-hidden="true">    {SECTION_ICON[section.type] ?? ""}  </span>  {label}</span>
                      <span className={section.enabled ? styles.statusBadgeActive : styles.statusBadgeInactive}>
                        {section.enabled ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {description && <p className={styles.sectionDescription}>{description}</p>}
                      <form action={duplicateDraft} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={section.id.toString()} />
                        <button type="submit" className={styles.secondaryButton}>
                          Duplikat
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* === CONFIG FORMS (BY TYPE) === */}

                  {/* HERO */}
                  {section.type === "HERO" && (
                    <div className={styles.sectionEditForm}>
                      {(() => {
                        const heroContent = ((cfg as any).heroContent ?? {}) as any;
                        const badgesValue = Array.isArray((heroContent as any).badges)
                          ? (heroContent as any).badges
                          : Array.isArray((cfg as any).badges)
                            ? (cfg as any).badges
                            : [];
                        const highlightsValue = Array.isArray((heroContent as any).highlights)
                          ? (heroContent as any).highlights
                          : Array.isArray((cfg as any).highlights)
                            ? (cfg as any).highlights
                            : [];
                        const trustValue = Array.isArray((heroContent as any).trustChips)
                          ? (heroContent as any).trustChips
                          : Array.isArray((cfg as any).trustChips)
                            ? (cfg as any).trustChips
                            : [];
                        const miniValue = Array.isArray((heroContent as any).miniInfo)
                          ? (heroContent as any).miniInfo
                          : Array.isArray((cfg as any).miniInfo)
                            ? (cfg as any).miniInfo
                            : [];
                        const miniAt = (idx: number, key: "title" | "desc") =>
                          String(miniValue[idx]?.[key] ?? "").trim();
                        const lookbookTitle =
                          String((heroContent as any).floatLookbookTitle ?? (cfg as any).floatLookbookTitle ?? "").trim();
                        const lookbookSubtitle =
                          String((heroContent as any).floatLookbookSubtitle ?? (cfg as any).floatLookbookSubtitle ?? "").trim();
                        const promoTitle =
                          String((heroContent as any).floatPromoTitle ?? (cfg as any).floatPromoTitle ?? "").trim();
                        const promoText =
                          String((heroContent as any).floatPromoText ?? (cfg as any).floatPromoText ?? "").trim();

                        return (
                          <>
                            {/* Form utama HERO (konsep mengikuti HIGHLIGHT_COLLECTION): slug + config disimpan dari tombol utama */}
                            <form id={`heroForm-${section.id}`} action={saveHeroConfig} className={styles.sectionEditForm} data-section-form="1">
                              <input type="hidden" name="id" value={section.id.toString()} />
                              <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />

                              {/* Slug (opsional) */}
                              <div style={{ maxWidth: 520 }}>
                                <div className={styles.fieldGroup}>
                                  <label className={styles.label}>Slug (opsional)</label>
                                  <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                                  <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                                </div>
                              </div>

                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Eyebrow (chip atas)</label>
                                <input name="eyebrow" defaultValue={(heroContent as any).eyebrow ?? cfg.eyebrow ?? ""} className={styles.input} />
                                <p className={styles.helperText}>Contoh: Interior Essentials.</p>
                              </div>

                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Judul</label>
                                <input name="headline" defaultValue={cfg.headline ?? ""} className={styles.input} />
                              </div>

                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Deskripsi</label>
                                <input name="subheadline" defaultValue={cfg.subheadline ?? ""} className={styles.input} />
                              </div>

                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Tema Warna Hero</label>
                                <select
                                  name="sectionTheme"
                                  defaultValue={String((cfg as any).sectionTheme ?? (cfg as any).heroTheme ?? "FOLLOW_NAVBAR")}
                                  className={styles.select}
                                >
                                  <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                                  <option value="NAVY_GOLD">NAVY + GOLD</option>
                                  <option value="WHITE_GOLD">WHITE + GOLD</option>
                                  <option value="NAVY_WHITE">NAVY + WHITE</option>
                                  <option value="GOLD_NAVY">GOLD + NAVY</option>
                                  <option value="GOLD_WHITE">GOLD + WHITE</option>
                                  <option value="WHITE_NAVY">WHITE + NAVY</option>
                                </select>
                                <p className={styles.helperText}>
                                  Mengatur warna background, card, elemen (teks/garis/simbol/logo), dan CTA pada HERO.
                                  Jika Ikuti tema Navbar, warna hero otomatis mengikuti tema navbar yang aktif.
                                </p>
                              </div>

                              <div className={styles.sectionEditGrid}>
                                <div className={styles.fieldGroup}>
                                  <label className={styles.label}>CTA Label</label>
                                  <input name="ctaLabel" defaultValue={cfg.ctaLabel ?? ""} className={styles.input} />
                                </div>
                                <div className={styles.fieldGroup}>
                                  <label className={styles.label}>CTA Href</label>
                                  <input
                                    name="ctaHref"
                                    defaultValue={cfg.ctaHref ?? ""}
                                    placeholder="contoh: /cari atau https://wa.me/..."
                                    className={styles.input}
                                  />
                                  <p className={styles.helperText}>Jika kosong, tombol CTA tidak ditampilkan.</p>
                                </div>
                              </div>

                              <div className={styles.sectionEditActions}>
                                <button type="button" className={styles.secondaryButton + " js-hero-autofill"} data-hero-form-id={`heroForm-${section.id}`}>
                                  Auto-generate HERO
                                </button>
                                <p className={styles.helperText} style={{ margin: "6px 0 0" }}>
                                  Isi cepat dengan contoh teks (rating , produk , CS , pengiriman ).
                                </p>
                              </div>

                              <div className={styles.sectionEditGrid}>
                                <div className={styles.fieldGroup}>
                                  <label className={styles.label}>Badges (tiap baris 1 item, maks 6)</label>
                                  <textarea name="badges" defaultValue={badgesValue.join("\n")} rows={4} className={styles.input} />
                                  <p className={styles.helperText}>Contoh default: Ready Stock, Kurasi Interior, Material Premium.</p>
                                </div>
                                <div className={styles.fieldGroup}>
                                  <label className={styles.label}>Highlight bullets (maks 6)</label>
                                  <textarea name="highlights" defaultValue={highlightsValue.join("\n")} rows={4} className={styles.input} />
                                  <p className={styles.helperText}>Tiap baris = 1 bullet (contoh: Gratis konsultasi styling).</p>
                                </div>
                              </div>

                              <div className={styles.sectionEditGrid}>
                                <div className={styles.fieldGroup}>
                                  <label className={styles.label}>Trust chips (maks 8)</label>
                                  <textarea name="trustChips" defaultValue={trustValue.join("\n")} rows={3} className={styles.input} />
                                  <p className={styles.helperText}>Contoh: Pembayaran Aman, Garansi, Support CS.</p>
                                </div>
                                <div className={styles.fieldGroup}>
                                  <label className={styles.label}>Mini info cards</label>
                                  <div style={{ display: "grid", gap: 10 }}>
                                    {[1, 2, 3].map((idx) => (
                                      <div key={idx} style={{ display: "grid", gap: 6 }}>
                                        <input
                                          name={`miniTitle${idx}`}
                                          placeholder={`Judul ${idx}`}
                                          defaultValue={miniAt(idx - 1, "title")}
                                          className={styles.input}
                                        />
                                        <input
                                          name={`miniDesc${idx}`}
                                          placeholder={`Deskripsi ${idx}`}
                                          defaultValue={miniAt(idx - 1, "desc")}
                                          className={styles.input}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <p className={styles.helperText}>Kosongkan jika tidak perlu; maksimal 3 kartu kecil.</p>
                                </div>
                              </div>

                              <div className={styles.sectionEditGrid}>
                                <div className={styles.fieldGroup}>
                                  <label className={styles.label}>Floating card Lookbook</label>
                                  <input
                                    name="floatLookbookTitle"
                                    defaultValue={lookbookTitle}
                                    className={styles.input}
                                    placeholder="Lookbook Minggu Ini"
                                  />
                                  <input
                                    name="floatLookbookSubtitle"
                                    defaultValue={lookbookSubtitle}
                                    className={styles.input}
                                    placeholder="Inspirasi ruang & koleksi pilihan"
                                    style={{ marginTop: 6 }}
                                  />
                                </div>
                                <div className={styles.fieldGroup}>
                                  <label className={styles.label}>Floating card Promo</label>
                                  <input
                                    name="floatPromoTitle"
                                    defaultValue={promoTitle}
                                    className={styles.input}
                                    placeholder="Promo"
                                  />
                                  <input
                                    name="floatPromoText"
                                    defaultValue={promoText}
                                    className={styles.input}
                                    placeholder="Gratis ongkir* untuk area tertentu"
                                    style={{ marginTop: 6 }}
                                  />
                                </div>
                              </div>
                            </form>

                            {/* HERO MEDIA: hanya picker (hapus upload + dropdown gambar_upload) */}
                            <div className={styles.innerCard}>
                              <div style={{ fontWeight: 800, color: "rgba(17,17,17,0.9)" }}>
                                Pilih gambar dari galeri
                              </div>
                              <div style={{ color: "rgba(17,17,17,0.7)", fontSize: 12, marginTop: 6 }}>
                                Klik tombol untuk buka picker, cari (id/title/tags), lalu pilih thumbnail.
                              </div>

                              <div style={{ marginTop: 10 }}>
                                <ImagePickerCaptcha
                                  action={uploadImageToGalleryAndAttach}
                                  sectionId={section.id.toString()}
                                  attach="HERO:imageId"
                                  endpoint="/api/admin/admin_dashboard/admin_galeri/list_gambar"
                                  limit={40}
                                  buttonLabel="Buka Picker Gambar"
                                  currentImageId={Number((cfg as any)?.imageId ?? (cfg as any)?.heroImageId ?? 0) || undefined}
                                />

                                {/* Status terpasang: tetap tampil setelah sukses attach (biar tidak "hilang") */}
                                {(() => {
                                  const heroId = Number((cfg as any)?.imageId ?? (cfg as any)?.heroImageId ?? 0) || 0;
                                  if (!heroId) return null;
                                  return (
                                    <div style={{ marginTop: 10, padding: 12, background: "rgba(212, 175, 55, 0.1)", borderRadius: 12, border: "2px solid #D4AF37" }}>
                                      <div style={{ fontSize: 13, fontWeight: 900, color: "#D4AF37", marginBottom: 6 }}>
                                        ✓ HERO Image Terpasang
                                      </div>
                                      <div style={{ fontSize: 12, color: "rgba(17,17,17,0.85)" }}>
                                        Image ID: <b>#{heroId}</b>
                                      </div>
                                      <div style={{ fontSize: 11, color: "rgba(17,17,17,0.6)", marginTop: 4 }}>
                                        Klik "Buka Picker Gambar" untuk melihat atau mengganti
                                      </div>
                                    </div>
                                  );
                                })()}


                                {/* Hapus image: form terpisah (tidak nested) */}
                                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                                  <form action={saveHeroConfig}>
                                    <input type="hidden" name="id" value={section.id.toString()} />
                                    <input type="hidden" name="clearHero" value="1" />
                                    <button type="submit" className={styles.secondaryButton}>
                                      Hapus Hero Image
                                    </button>
                                  </form>
                                </div>
                              </div>
                            </div>

                            {/* Tombol aksi HERO: kanan bawah section */}
                            <div className={styles.highlightFooterActions}>
                              <button type="submit" form={`heroForm-${section.id}`} className={styles.secondaryButton}>
                                Simpan
                              </button>

                              {activeThemeKey ? (
                                <a
                                  className={styles.primaryButton}
                                  href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                                    activeThemeKey
                                  )}&focus=HERO&sectionId=${section.id}`}
                                >
                                  Preview
                                </a>
                              ) : (
                                <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                                  Preview
                                </span>
                              )}

                              <form action={toggleDraft} style={{ display: "inline" }}>
                                <input type="hidden" name="id" value={section.id.toString()} />
                                <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />
                                <button type="submit" className={styles.secondaryButton}>
                                  {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                                </button>
                              </form>

                              <form action={deleteDraft} style={{ display: "inline" }}>
                                <input type="hidden" name="id" value={section.id.toString()} />
                                <button type="submit" className={styles.dangerButton}>
                                  Hapus
                                </button>
                              </form>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* TEXT_SECTION */}
                  {section.type === "TEXT_SECTION" && (
                    <div className={styles.sectionEditForm}>
                      <form
                        id={`textSectionForm-${section.id}`}
                        action={saveTextSectionConfig}
                        className={styles.sectionEditForm}
                        data-section-form="1"
                      >
                        <input type="hidden" name="id" value={section.id.toString()} />
                        <input type="hidden" name="returnTo" value={`section-${section.id}`} />

                        <div className={styles.sectionEditGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Judul section (opsional)</label>
                            <input name="title" type="text" defaultValue={section.title ?? ""} className={styles.input} />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Slug section (opsional)</label>
                            <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                            <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Mode Teks</label>
                            <select name="mode" defaultValue={String(cfg.mode ?? "body")} className={styles.select}>
                              <option value="heading">Heading</option>
                              <option value="subtitle">Subtitle</option>
                              <option value="body">Body</option>
                              <option value="caption">Caption</option>
                            </select>
                            <p className={styles.helperText}>
                              Ukuran dan gaya mengikuti mode, tidak bisa diatur manual.
                            </p>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Alignment</label>
                            <select name="align" defaultValue={String(cfg.align ?? "left")} className={styles.select}>
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                            </select>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Lebar Teks</label>
                            <select name="width" defaultValue={String(cfg.width ?? "normal")} className={styles.select}>
                              <option value="normal">Normal (~65ch)</option>
                              <option value="wide">Wide (~80ch)</option>
                            </select>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tema Warna Section</label>
                            <select
                              name="sectionTheme"
                              defaultValue={String(cfg.sectionTheme ?? "FOLLOW_NAVBAR")}
                              className={styles.select}
                            >
                              <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                              <option value="NAVY_GOLD">NAVY + GOLD</option>
                              <option value="WHITE_GOLD">WHITE + GOLD</option>
                              <option value="NAVY_WHITE">NAVY + WHITE</option>
                              <option value="GOLD_NAVY">GOLD + NAVY</option>
                              <option value="GOLD_WHITE">GOLD + WHITE</option>
                              <option value="WHITE_NAVY">WHITE + NAVY</option>
                            </select>
                          </div>
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Konten</label>
                          <TextSectionBlocksEditor
                            initialBlocks={Array.isArray(cfg.blocks) ? cfg.blocks : []}
                            fallbackText={String(cfg.text ?? "")}
                            fallbackMode={String(cfg.mode ?? "body") as any}
                            formId={`textSectionForm-${section.id}`}
                          />
                          <div className={styles.sectionEditActions} style={{ marginTop: 10 }}>
                            <button
                              type="button"
                              className={styles.secondaryButton + " js-text-autofill"}
                              data-text-form-id={`textSectionForm-${section.id}`}
                            >
                              Auto-generate Text
                            </button>
                            <p className={styles.helperText} style={{ margin: "6px 0 0" }}>
                              Isi cepat: heading, subtitle, body, caption berbasis judul section.
                            </p>
                          </div>
                        </div>
                      </form>

                      <div className={styles.highlightFooterActions}>
                        <button type="submit" form={`textSectionForm-${section.id}`} className={styles.secondaryButton}>
                          Simpan
                        </button>

                        {activeThemeKey ? (
                          <a
                            className={styles.primaryButton}
                            href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                              activeThemeKey
                            )}&focus=TEXT_SECTION&sectionId=${section.id}`}
                          >
                            Preview
                          </a>
                        ) : (
                          <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                            Preview
                          </span>
                        )}

                        <form action={toggleDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />
                          <button type="submit" className={styles.secondaryButton}>
                            {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </form>

                        <form action={deleteDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <button type="submit" className={styles.dangerButton}>
                            Hapus
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* CATEGORY_GRID */}
                  {section.type === "CATEGORY_GRID" && (
                    <div className={styles.sectionEditForm}>
                      <form id={`categoryGridForm-${section.id}`} action={saveCategoryGridConfig} className={styles.sectionEditForm} data-section-form="1">
                        <input type="hidden" name="id" value={section.id.toString()} />

                        <div className={styles.sectionEditGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Judul tampil (opsional)</label>
                            <input name="title" type="text" defaultValue={section.title} className={styles.input} />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Slug (opsional)</label>
                            <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                            <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tema Warna Section</label>
                            <select
                              name="sectionTheme"
                              defaultValue={String((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR")}
                              className={styles.select}
                            >
                              <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                              <option value="NAVY_GOLD">NAVY + GOLD</option>
                              <option value="WHITE_GOLD">WHITE + GOLD</option>
                              <option value="NAVY_WHITE">NAVY + WHITE</option>
                              <option value="GOLD_NAVY">GOLD + NAVY</option>
                              <option value="GOLD_WHITE">GOLD + WHITE</option>
                              <option value="WHITE_NAVY">WHITE + NAVY</option>
                            </select>
                          </div>



                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Warna Teks Judul Grid (Luar Card)</label>
                            <select
                              name="titleTextColor"
                              defaultValue={String((cfg as any).titleTextColor ?? "")}
                              className={styles.select}
                            >
                              <option value="">Auto</option>
                              <option value="NAVY">NAVY</option>
                              <option value="GOLD">GOLD</option>
                              <option value="WHITE">WHITE</option>
                            </select>
                            <div className={styles.helperText}>
                              Opsional: kalau dipilih, ini akan memaksa warna judul section (teks di luar card) di preview.
                            </div>
                          </div>


                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Columns (26)</label>
                            <input
                              name="columns"
                              type="number"
                              min={2}
                              max={6}
                              defaultValue={String(cfg.layout?.columns ?? 3)}
                              className={styles.input}
                            />
                          </div>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Max items (opsional)</label>
                            <input
                              name="maxItems"
                              type="number"
                              min={1}
                              max={60}
                              defaultValue={cfg.layout?.maxItems ? String(cfg.layout.maxItems) : ""}
                              className={styles.input}
                              placeholder="contoh: 6"
                            />
                          </div>
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Pilih kategori + cover image (opsional)</label>

                        </div>

                        <div className={styles.fieldGroup}>
                          {categoryItems.length === 0 ? (
                            <p className={styles.helperText}>Belum ada kategori di database.</p>
                          ) : (
                            categoryItems.map((cat) => {
                              const idNum = Number(cat.id);
                              const items = Array.isArray(cfg.items) ? cfg.items : [];
                              const currentItem = items.find((it: any) => Number(it?.kategoriId) === idNum);
                              const checked = Boolean(currentItem);
                              const cover = currentItem?.coverImageId ?? null;
                              const labelText =
                                (cat.namaKategori as string) ||
                                (cat.nama as string) ||
                                (cat.slug as string) ||
                                `Kategori #${cat.id}`;

                              return (
                                <div key={cat.id} className={styles.checkboxRow} style={{ alignItems: "center" }}>
                                  <label style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, flexWrap: "wrap" }}>
                                    <input type="checkbox" name="kategoriIds" value={String(cat.id)} defaultChecked={checked} />
                                    <span>{labelText}</span>
                                  </label>
                                  <div style={{ maxWidth: 280, width: "100%", display: "flex", justifyContent: "flex-end" }}>
                                    <ImagePickerCaptcha
                                      action={uploadImageToGalleryAndAttach}
                                      sectionId={section.id.toString()}
                                      attach={`CATEGORY_GRID:cover:${idNum}`}
                                      endpoint="/api/admin/admin_dashboard/admin_galeri/list_gambar"
                                      limit={40}
                                      buttonLabel={cover ? `Cover: #${cover}` : "(Cover otomatis)"}
                                    />
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                      </form>

                      {/* Tombol aksi CATEGORY_GRID: kanan bawah section */}
                      <div className={styles.highlightFooterActions}>
                        <button type="submit" form={`categoryGridForm-${section.id}`} className={styles.secondaryButton}>
                          Simpan
                        </button>

                        {activeThemeKey ? (
                          <a
                            className={styles.primaryButton}
                            href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                              activeThemeKey
                            )}&focus=CATEGORY_GRID&sectionId=${section.id}`}
                          >
                            Preview
                          </a>
                        ) : (
                          <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                            Preview
                          </span>
                        )}

                        <form action={toggleDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />
                          <button type="submit" className={styles.secondaryButton}>
                            {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </form>

                        <form action={deleteDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <button type="submit" className={styles.dangerButton}>
                            Hapus
                          </button>
                        </form>
                      </div>



                    </div>
                  )}

                  {/* CATEGORY_GRID_COMMERCE */}
                  {section.type === "CATEGORY_GRID_COMMERCE" && (
                    <div className={styles.sectionEditForm}>
                      <form
                        id={`categoryGridCommerceForm-${section.id}`}
                        action={saveCategoryGridCommerceConfig}
                        className={styles.sectionEditForm}
                        data-section-form="1"
                      >
                        <input type="hidden" name="id" value={section.id.toString()} />
                        <input type="hidden" name="returnTo" value={`section-${section.id}`} />

                        <div className={styles.sectionEditGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Judul section (opsional)</label>
                            <input name="title" type="text" defaultValue={section.title ?? ""} className={styles.input} />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Subjudul (opsional)</label>
                            <input
                              name="description"
                              type="text"
                              defaultValue={section.description ?? ""}
                              className={styles.input}
                              placeholder="Contoh: Pilih kategori favoritmu"
                            />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Slug section (opsional)</label>
                            <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                            <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Mode Render</label>
                            <select
                              name="layoutMode"
                              defaultValue={String((cfg as any)?.layout?.mode ?? (cfg as any)?.mode ?? "clean")}
                              className={styles.select}
                            >
                              <option value="clean">Clean</option>
                              <option value="commerce">Commerce (garis)</option>
                              <option value="reverse">Reverse (teks kiri, gambar kanan)</option>
                            </select>
                            <p className={styles.helperText}>Clean tanpa garis, Commerce menampilkan garis grid.</p>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tema Warna Section</label>
                            <select
                              name="sectionTheme"
                              defaultValue={String((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR")}
                              className={styles.select}
                            >
                              <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                              <option value="NAVY_GOLD">NAVY + GOLD</option>
                              <option value="WHITE_GOLD">WHITE + GOLD</option>
                              <option value="NAVY_WHITE">NAVY + WHITE</option>
                              <option value="GOLD_NAVY">GOLD + NAVY</option>
                              <option value="GOLD_WHITE">GOLD + WHITE</option>
                              <option value="WHITE_NAVY">WHITE + NAVY</option>
                            </select>
                            <p className={styles.helperText}>
                              Mengatur warna background section, grid, dan hover/active. Jika ikuti Navbar,
                              warna mengikuti tema navbar yang aktif.
                            </p>
                          </div>


                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Grid Category Commerce</label>
                          <div className={styles.helperText}>
                            Layout: Desktop 4 kolom, Tablet 3 kolom, Mobile 2 kolom. Maksimal 16 item. Slug wajib unik.
                          </div>
                        </div>

                        <CategoryCommerceGridEditorNoSSR
                          categories={categoryItems}
                          images={(gambarItems as any[]).map((g: any) => ({
                            id: Number(g.id),
                            url: String(g.url ?? ""),
                            title: String(g.title ?? ""),
                            tags: String(g.tags ?? ""),
                          }))}
                          initialItems={Array.isArray(cfg.items) ? cfg.items : []}
                          initialTabs={Array.isArray((cfg as any)?.tabs) ? (cfg as any).tabs : []}
                          mode={String((cfg as any)?.layout?.mode ?? (cfg as any)?.mode ?? "clean") as any}
                          sectionId={section.id.toString()}
                          uploadAction={uploadImageToGalleryAndAttach}
                        />
                      </form>

                      {/* Tombol aksi CATEGORY_GRID_COMMERCE: kanan bawah section */}
                      <div className={styles.highlightFooterActions}>
                        <button type="submit" form={`categoryGridCommerceForm-${section.id}`} className={styles.secondaryButton}>
                          Simpan
                        </button>

                        {activeThemeKey ? (
                          <a
                            className={styles.primaryButton}
                            href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                              activeThemeKey
                            )}&focus=CATEGORY_GRID_COMMERCE&sectionId=${section.id}`}
                          >
                            Preview
                          </a>
                        ) : (
                          <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                            Preview
                          </span>
                        )}

                        <form action={toggleDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />
                          <button type="submit" className={styles.secondaryButton}>
                            {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </form>

                        <form action={deleteDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <button type="submit" className={styles.dangerButton}>
                            Hapus
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* PRODUCT_CAROUSEL */}
                  {section.type === "PRODUCT_CAROUSEL" && (
                    <div className={styles.sectionEditForm}>
                      <form id={`productCarouselForm-${section.id}`} action={saveProductCarouselConfig} className={styles.sectionEditForm} data-section-form="1">
                        <input type="hidden" name="id" value={section.id.toString()} />

                        <div className={styles.sectionEditGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Judul tampil (opsional)</label>
                            <input name="title" type="text" defaultValue={section.title} className={styles.input} />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Slug (opsional)</label>
                            <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                            <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                          </div>




                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tema Warna Section</label>
                            <select
                              name="sectionTheme"
                              defaultValue={String((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR")}
                              className={styles.select}
                            >
                              <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                              <option value="NAVY_GOLD">NAVY + GOLD</option>
                              <option value="WHITE_GOLD">WHITE + GOLD</option>
                              <option value="NAVY_WHITE">NAVY + WHITE</option>
                              <option value="GOLD_NAVY">GOLD + NAVY</option>
                              <option value="GOLD_WHITE">GOLD + WHITE</option>
                              <option value="WHITE_NAVY">WHITE + NAVY</option>
                            </select>
                          </div>



                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tampilkan harga?</label>
                            <select name="showPrice" defaultValue={String(cfg.showPrice ?? true)} className={styles.select}>
                              <option value="true">Ya</option>
                              <option value="false">Tidak</option>
                            </select>
                          </div>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tampilkan CTA?</label>
                            <select name="showCta" defaultValue={String(cfg.showCta ?? true)} className={styles.select}>
                              <option value="true">Ya</option>
                              <option value="false">Tidak</option>
                            </select>
                          </div>
                        </div>


                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Kelola produk carousel</label>
                          <p className={styles.helperText}>
                            Pilih produk dengan checklist (tampil thumbnail), lalu drag &amp; drop untuk mengatur urutan tampil di carousel.
                          </p>

                          <ProductCarouselPicker
                            products={(productItems as any[]).map((p: any) => {
                              const hargaAsliNum =
                                typeof p.harga === "number" ? p.harga : Number(p.harga) || 0;

                              const pr = computeHargaSetelahPromo({
                                harga: hargaAsliNum,
                                promoAktif: (p.promoAktif as any) ?? null,
                                promoTipe: (p.promoTipe as any) ?? null,
                                promoValue: typeof p.promoValue === "number" ? p.promoValue : Number(p.promoValue) || null,
                              });

                              return {
                                id: Number(p.id),
                                nama:
                                  (p.nama as string) ||
                                  (p.namaProduk as string) ||
                                  (p.slug as string) ||
                                  `Produk #${String(p.id)}`,

                                // NOTE: harga yang dikirim ke picker kita set ke hargaFinal supaya yang tampil "harga sekarang"
                                harga: pr.hargaFinal,

                                // extra fields (kalau komponen picker mau nampilin coret & label)
                                hargaAsli: pr.hargaAsli,
                                isPromo: pr.isPromo,
                                promoLabel: pr.promoLabel,

                                promoAktif: (p.promoAktif as any) ?? null,
                                promoTipe: (p.promoTipe as any) ?? null,
                                promoValue: (p.promoValue as any) ?? null,

                                kategori: (p.kategori as string) || undefined,
                                subkategori: (p.subkategori as string) || undefined,
                                mainImageId: p.mainImageId ?? null,
                                galleryImageIds: Array.isArray(p.galleryImageIds)
                                  ? (p.galleryImageIds as any[])
                                    .map((v: any) => Number(v))
                                    .filter((n: any) => Number.isFinite(n))
                                  : [],
                              };
                            })}
                            images={(gambarItems as any[]).map((g: any) => ({
                              id: Number(g.id),
                              url: String(g.url),
                              title: (g.title as string) || (g.nama as string) || undefined,
                            }))}
                            initialIds={(
                              Array.isArray(cfg.productIds) ? cfg.productIds : []
                            )
                              .map((v: any) => Number(v))
                              .filter((n: any) => Number.isFinite(n))}
                            inputName="productIds"
                            showPrice={String(cfg.showPrice ?? "true") === "true"}
                            showCta={String(cfg.showCta ?? "true") === "true"}
                          />

                          <div className={styles.pickerExtraActions}>
                            <button
                              type="submit"
                              formAction={clearProductCarouselProducts}
                              className={styles.dangerButton}
                              disabled={!Array.isArray(cfg.productIds) || cfg.productIds.length === 0}
                              title={
                                !Array.isArray(cfg.productIds) || cfg.productIds.length === 0
                                  ? "Belum ada produk dipilih."
                                  : "Hapus semua produk yang dipilih."
                              }
                            >
                              Drop Produk
                            </button>
                          </div>
                        </div>

                      </form>

                      {/* Tombol aksi PRODUCT_CAROUSEL: kanan bawah section */}
                      <div className={styles.highlightFooterActions}>
                        <button type="submit" form={`productCarouselForm-${section.id}`} className={styles.secondaryButton}>
                          Simpan
                        </button>

                        {activeThemeKey ? (
                          <a
                            className={styles.primaryButton}
                            href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                              activeThemeKey
                            )}&focus=PRODUCT_CAROUSEL&sectionId=${section.id}`}
                          >
                            Preview
                          </a>
                        ) : (
                          <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                            Preview
                          </span>
                        )}

                        <form action={toggleDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />
                          <button type="submit" className={styles.secondaryButton}>
                            {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </form>

                        <form action={deleteDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <button type="submit" className={styles.dangerButton}>
                            Hapus
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* PRODUCT_LISTING */}
                  {section.type === "PRODUCT_LISTING" && (
                    <div className={styles.sectionEditForm}>
                      <form
                        id={`productListingForm-${section.id}`}
                        action={saveProductListingConfig}
                        className={styles.sectionEditForm}
                        data-section-form="1"
                      >
                        <input type="hidden" name="id" value={section.id.toString()} />
                        <input type="hidden" name="returnTo" value={`section-${section.id}`} />

                        <div className={styles.sectionEditGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Judul tampil (opsional)</label>
                            <input name="title" type="text" defaultValue={section.title} className={styles.input} />
                            <p className={styles.helperText}>Kosongkan bila tidak ingin judul tampil.</p>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Slug (opsional)</label>
                            <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                            <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tema Warna Section</label>
                            <select
                              name="sectionTheme"
                              defaultValue={String((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR")}
                              className={styles.select}
                            >
                              <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                              <option value="NAVY_GOLD">NAVY + GOLD</option>
                              <option value="WHITE_GOLD">WHITE + GOLD</option>
                              <option value="NAVY_WHITE">NAVY + WHITE</option>
                              <option value="GOLD_NAVY">GOLD + NAVY</option>
                              <option value="GOLD_WHITE">GOLD + WHITE</option>
                              <option value="WHITE_NAVY">WHITE + NAVY</option>
                            </select>
                          </div>


                        </div>


                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Aturan Product Listing</label>
                          <div className={styles.helperText}>
                            Desktop: 6 kolom per baris, tampil maksimal 30. Tablet: 3 kolom, tampil maksimal 18. Mobile: 2 kolom, tampil maksimal 10.
                            Jika lebih, tombol "Tampilkan Semua" menuju /produk.
                          </div>

                          <div style={{ marginTop: 16 }}>
                            <div className={styles.pickerExtraActions} style={{ marginBottom: 12 }}>
                              <button
                                type="submit"
                                formAction={pickAllProductListingProducts}
                                className={styles.secondaryButton}
                                title="Pilih otomatis 300 produk terbaru"
                              >
                                Pick All (Auto 300 Latest)
                              </button>
                            </div>

                            <ProductCarouselPicker
                              products={(productItems as any[]).map((p: any) => {
                                const hargaAsliNum =
                                  typeof p.harga === "number" ? p.harga : Number(p.harga) || 0;

                                const pr = computeHargaSetelahPromo({
                                  harga: hargaAsliNum,
                                  promoAktif: (p.promoAktif as any) ?? null,
                                  promoTipe: (p.promoTipe as any) ?? null,
                                  promoValue: typeof p.promoValue === "number" ? p.promoValue : Number(p.promoValue) || null,
                                });

                                return {
                                  id: Number(p.id),
                                  nama:
                                    (p.nama as string) ||
                                    (p.namaProduk as string) ||
                                    (p.slug as string) ||
                                    `Produk #${String(p.id)}`,

                                  harga: pr.hargaFinal,
                                  hargaAsli: pr.hargaAsli,
                                  isPromo: pr.isPromo,
                                  promoLabel: pr.promoLabel,

                                  kategori: (p.kategori as string) || undefined,
                                  subkategori: (p.subkategori as string) || undefined,
                                  mainImageId: p.mainImageId ?? null,
                                  galleryImageIds: Array.isArray(p.galleryImageIds)
                                    ? (p.galleryImageIds as any[])
                                      .map((v: any) => Number(v))
                                      .filter((n: any) => Number.isFinite(n))
                                    : [],
                                };
                              })}
                              images={(gambarItems as any[]).map((g: any) => ({
                                id: Number(g.id),
                                url: String(g.url),
                                title: (g.title as string) || (g.nama as string) || undefined,
                              }))}
                              initialIds={(Array.isArray(cfg.productIds) ? cfg.productIds : [])
                                .map((v: any) => Number(v))
                                .filter((n: any) => Number.isFinite(n))}
                              inputName="productIds"
                              showPrice={true}
                              buttonLabel="Pilih Produk Listing"
                            />
                            <div className={styles.pickerExtraActions} style={{ marginTop: 8 }}>
                              <button
                                type="submit"
                                formAction={clearProductListingProducts}
                                className={styles.dangerButton}
                                title="Hapus semua produk yang dipilih"
                                disabled={!Array.isArray(cfg.productIds) || cfg.productIds.length === 0}
                              >
                                Drop All Produk
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>

                      <div className={styles.highlightFooterActions}>
                        <button type="submit" form={`productListingForm-${section.id}`} className={styles.secondaryButton}>
                          Simpan
                        </button>

                        {activeThemeKey ? (
                          <a
                            className={styles.primaryButton}
                            href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                              activeThemeKey
                            )}&focus=PRODUCT_LISTING&sectionId=${section.id}`}
                          >
                            Preview
                          </a>
                        ) : (
                          <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                            Preview
                          </span>
                        )}

                        <form action={toggleDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />
                          <button type="submit" className={styles.secondaryButton}>
                            {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </form>

                        <form action={deleteDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <button type="submit" className={styles.dangerButton}>
                            Hapus
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* CUSTOM_PROMO */}
                  {/* CUSTOM_PROMO */}
                  {section.type === "CUSTOM_PROMO" && (
                    <div className={styles.sectionEditForm}>
                      <form action={saveCustomPromoConfig} className={styles.sectionEditForm} data-cp-form={section.id} data-section-form="1">
                        <input type="hidden" name="id" value={section.id.toString()} />
                        <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />
                        <input type="hidden" name="cpAutosave" defaultValue="" />

                        <div className={styles.sectionEditGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Judul tampil (opsional)</label>
                            <input name="title" type="text" defaultValue={section.title} className={styles.input} />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Slug (opsional)</label>
                            <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                            <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                          </div>
                        </div>

                        {legacyBannerPromoId ? (
                          <div className={styles.warningBox}>
                            Config lama terdeteksi: <code>bannerPromoId</code> = {String(legacyBannerPromoId)}. Saat kamu{" "}
                            klik &quot;Simpan&quot;, config akan otomatis dimigrasi ke format baru (voucher gambar saja).
                            (banner_promo hanya fallback read-only)
                          </div>
                        ) : null}

                        <div className={styles.sectionEditGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Mode Custom Promo</label>
                            <select
                              id={`cp-layout-${section.id}`}
                              name="layout"
                              defaultValue={String((cfg as any).layout ?? "carousel")}
                              className={styles.select}
                              data-cp-select="true"
                              data-clear-btn-id={`cp-clear-${section.id}`}
                            >
                              <option value="carousel">Carousel voucher (slide horizontal)</option>
                              <option value="grid">Grid voucher (kartu rapat)</option>
                              <option value="hero">Hero banner (1 gambar lebar)</option>
                            </select>
                            <p className={styles.helperText}>
                              Hero wajib 3000x1000 (rasio 3:1). Carousel/Grid lebar 2300-4000 dan tinggi 1000-1500. Maksimal {MAX_CUSTOM_PROMO_VOUCHERS} voucher.
                            </p>
                          </div>


                        </div>

                        <div className={styles.sectionEditGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tema Background (Baru)</label>
                            <select
                              name="sectionBgTheme"
                              defaultValue={String((cfg as any).sectionBgTheme ?? "FOLLOW_NAVBAR")}
                              className={styles.select}
                            >
                              <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (Default)</option>
                              <option value="WHITE">WHITE (Putih)</option>
                              <option value="NAVY">NAVY (Biru Gelap)</option>
                              <option value="GOLD">GOLD (Emas)</option>
                            </select>
                            <p className={styles.helperText}>
                              Mengganti warna background blok ini supaya kontras dengan gambar promo.
                            </p>
                          </div>
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Voucher (gambar)</label>
                          <p className={styles.helperText}>
                            Tambahkan voucher lewat picker/upload. Urutan mengikuti daftar di bawah (atas ke bawah).
                          </p>
                          <div className={styles.infoBox}>
                            <div style={{ fontWeight: 700, marginBottom: 6, color: "crimson" }}>Rules per mode:</div>
                            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4, fontSize: 13, color: "crimson" }}>
                              <li><strong>Carousel / Grid:</strong> wajib lebar 2300-4000 dan tinggi 1000-1500.</li>
                              <li><strong>Hero:</strong> wajib 3000x1000 (rasio 3:1).</li>
                              <li>Format JPG/PNG sumber, nanti dikompres ke WebP; jangan pakai screenshot kecil.</li>
                              <li>Jaga safe area 32px dari tepi untuk teks/logo supaya tidak terpotong.</li>
                            </ul>
                          </div>
                          {(() => {
                            const voucherImageIds = normalizeVoucherImageIds((cfg as any).voucherImageIds ?? []);
                            return (
                              <div style={{ display: "grid", gap: 12 }}>
                                {voucherImageIds.length ? (
                                  <div
                                    style={{
                                      display: "grid",
                                      gap: 12,
                                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                    }}
                                  >
                                    {voucherImageIds.map((imgId: number, idx: number) => {
                                      const img = gambarItems.find((g) => Number(g.id) === Number(imgId));
                                      const url = img ? String(img.url) : "";
                                      return (
                                        <div
                                          key={`${imgId}-${idx}`}
                                          style={{
                                            border: "1px solid rgba(0,0,0,0.08)",
                                            borderRadius: 12,
                                            overflow: "hidden",
                                            background: "rgba(0,0,0,0.02)",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 8,
                                          }}
                                        >
                                          <div style={{ padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div style={{ fontWeight: 700, fontSize: 13 }}>#{imgId}</div>
                                            <div style={{ fontSize: 12, opacity: 0.75 }}>Voucher {idx + 1}</div>
                                          </div>
                                          <div style={{ padding: "0 10px 10px" }}>
                                            {url ? (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img
                                                src={url}
                                                alt={`Voucher ${imgId}`}
                                                onError={(e) => {
                                                  // Fallback to proxy if static file fails
                                                  const target = e.currentTarget;
                                                  if (!target.src.includes("/api/img_proxy")) {
                                                    const filename = url.split("/").pop();
                                                    if (filename) {
                                                      target.src = `/api/img_proxy?file=${filename}&t=${Date.now()}`;
                                                    }
                                                  }
                                                }}
                                                style={{
                                                  width: "100%",
                                                  height: 140,
                                                  objectFit: "cover",
                                                  borderRadius: 10,
                                                  border: "1px solid rgba(0,0,0,0.06)",
                                                }}
                                              />
                                            ) : (
                                              <div
                                                style={{
                                                  height: 140,
                                                  borderRadius: 10,
                                                  border: "1px dashed rgba(0,0,0,0.15)",
                                                  display: "grid",
                                                  placeItems: "center",
                                                  color: "rgba(0,0,0,0.45)",
                                                  fontSize: 12,
                                                }}
                                              >
                                                Gambar #{imgId} tidak ada di 200 data terbaru
                                              </div>
                                            )}
                                          </div>
                                          <div style={{ padding: "0 10px 10px", display: "grid", gap: 8 }}>
                                            {(() => {
                                              const linkRaw = (cfg as any)?.voucherLinks?.[imgId];
                                              const isCategory =
                                                typeof linkRaw === "string" && linkRaw.startsWith("category:");
                                              const categoryId = isCategory ? Number(linkRaw.split(":")[1]) : null;
                                              const manualLink = !isCategory && typeof linkRaw === "string" ? linkRaw : "";
                                              const mode =
                                                typeof categoryId === "number" && Number.isFinite(categoryId) && categoryId > 0
                                                  ? "category"
                                                  : manualLink
                                                    ? "manual"
                                                    : "";
                                              return (
                                                <VoucherLinkEditor
                                                  imgId={imgId}
                                                  initialMode={mode as any}
                                                  initialCategoryId={categoryId}
                                                  initialManualLink={manualLink}
                                                  categories={categoryItems.map((c) => ({
                                                    id: Number(c.id),
                                                    name: String(c.nama ?? c.title ?? c.slug ?? `Kategori #${c.id}`),
                                                  }))}
                                                />
                                              );
                                            })()}
                                          </div>
                                          <div style={{ padding: "0 10px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                                            <button
                                              type="submit"
                                              formAction={moveCustomPromoVoucher.bind(null, `${imgId}:up`)}
                                              className={styles.smallButton}
                                              disabled={idx === 0}
                                              aria-disabled={idx === 0}
                                              title="Geser ke atas"
                                            >
                                              Naik
                                            </button>
                                            <button
                                              type="submit"
                                              formAction={moveCustomPromoVoucher.bind(null, `${imgId}:down`)}
                                              className={styles.smallButton}
                                              disabled={idx === voucherImageIds.length - 1}
                                              aria-disabled={idx === voucherImageIds.length - 1}
                                              title="Geser ke bawah"
                                            >
                                              Turun
                                            </button>
                                            <button
                                              type="submit"
                                              formAction={removeCustomPromoVoucher.bind(null, imgId)}
                                              className={styles.dangerButton}
                                            >
                                              Hapus
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className={styles.helperText}>Belum ada voucher. Tambahkan lewat picker di bawah.</div>
                                )}

                                {voucherImageIds.map((imgId: number) => (
                                  <input key={`voucher-hidden-${imgId}`} type="hidden" name="voucherImageIds" value={String(imgId)} />
                                ))}

                                <div className={styles.pickerExtraActions}>
                                  <button
                                    type="submit"
                                    formAction={clearCustomPromoVouchers}
                                    className={styles.dangerButton}
                                    disabled={voucherImageIds.length === 0}
                                    aria-disabled={voucherImageIds.length === 0}
                                    title="Hapus semua voucher"
                                    data-clear-vouchers-btn={`cp-clear-${section.id}`}
                                  >
                                    Drop semua voucher
                                  </button>
                                  {String((cfg as any).layout ?? "carousel") === "hero" ? (
                                    <div className={styles.helperText}>
                                      Mode Hero: maksimal 1 gambar. Tambah gambar baru akan menolak jika belum dihapus.
                                    </div>
                                  ) : (
                                    <div className={styles.helperText}>
                                      Mode Carousel/Grid: bisa lebih dari 1 gambar (maks {MAX_CUSTOM_PROMO_VOUCHERS}).
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <div className={styles.highlightFooterActions}>
                          <button
                            type="submit"
                            className={styles.secondaryButton}
                            data-cp-save="true"
                          >
                            Simpan
                          </button>

                          {activeThemeKey ? (
                            <a
                              className={styles.primaryButton}
                              href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                                activeThemeKey
                              )}&focus=CUSTOM_PROMO&sectionId=${section.id}`}
                            >
                              Preview
                            </a>
                          ) : (
                            <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                              Preview
                            </span>
                          )}

                          <button type="submit" formAction={toggleDraft} className={styles.secondaryButton}>
                            {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                          </button>

                          <button type="submit" formAction={deleteDraft} className={styles.dangerButton}>
                            Hapus
                          </button>
                        </div>
                      </form>

                      <div className={styles.innerCard}>
                        <h3 className={styles.sectionHeading} style={{ marginTop: 0 }}>
                          Tambah voucher (pilih / upload)
                        </h3>
                        <p className={styles.helperText}>
                          Pilih gambar dari galeri atau upload baru. Otomatis ditambahkan ke daftar voucher (maks. {MAX_CUSTOM_PROMO_VOUCHERS}).
                        </p>

                        <ImagePickerCaptcha
                          action={uploadImageToGalleryAndAttach}
                          sectionId={section.id.toString()}
                          attach="CUSTOM_PROMO:append"
                          endpoint="/api/admin/admin_dashboard/admin_galeri/list_gambar"
                          limit={40}
                          buttonLabel="Pilih / Upload Voucher"
                        />
                      </div>
                    </div>
                  )}

                  {/* SOCIAL */}
                  {section.type === "SOCIAL" && (
                    <form action={saveSocialConfig} className={styles.sectionEditForm} data-section-form="1">
                      <input type="hidden" name="id" value={section.id.toString()} />
                      <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />

                      <div className={styles.sectionEditGrid}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Judul tampil (opsional)</label>
                          <input name="title" type="text" defaultValue={section.title} className={styles.input} />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Slug (opsional)</label>
                          <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                          <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                        </div>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Tema Section</label>
                        <select name="sectionTheme" defaultValue={String((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR")} className={styles.select}>
                          <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                          <option value="NAVY_GOLD">NAVY + GOLD</option>
                          <option value="WHITE_GOLD">WHITE + GOLD</option>
                          <option value="NAVY_WHITE">NAVY + WHITE</option>
                          <option value="GOLD_NAVY">GOLD + NAVY</option>
                          <option value="GOLD_WHITE">GOLD + WHITE</option>
                          <option value="WHITE_NAVY">WHITE + NAVY</option>
                        </select>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Pilih media sosial (yang tampil hanya ikon)</label>
                      </div>

                      <div className={styles.fieldGroup}>
                        {mediaSocialItems.length === 0 ? (
                          <p className={styles.helperText}>Belum ada data media_sosial.</p>
                        ) : (
                          mediaSocialItems.map((m) => {
                            const iconKey = (m.iconKey as string) || "";
                            const nama = (m.nama as string) || iconKey;
                            const selectedArr = Array.isArray(cfg.selected) ? cfg.selected : [];
                            const checked = selectedArr.some((x: any) => x?.iconKey === iconKey);

                            return (
                              <label key={m.id} className={styles.checkboxRow}>
                                <input type="checkbox" name="iconKeys" value={iconKey} defaultChecked={checked} />
                                <span>
                                  {nama}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>

                      <div className={styles.highlightFooterActions}>
                        <button type="submit" className={styles.secondaryButton}>
                          Simpan
                        </button>

                        {activeThemeKey ? (
                          <a
                            className={styles.primaryButton}
                            href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                              activeThemeKey
                            )}&focus=SOCIAL&sectionId=${section.id}`}
                          >
                            Preview
                          </a>
                        ) : (
                          <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                            Preview
                          </span>
                        )}

                        <button type="submit" formAction={toggleDraft} className={styles.secondaryButton}>
                          {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                        </button>

                        <button type="submit" formAction={deleteDraft} className={styles.dangerButton}>
                          Hapus
                        </button>
                      </div>
                    </form>
                  )}

                  {/* BRANCHES */}
                  {section.type === "BRANCHES" && (
                    <form action={saveBranchesConfig} className={styles.sectionEditForm} data-section-form="1">
                      <input type="hidden" name="id" value={section.id.toString()} />
                      <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />

                      <div className={styles.sectionEditGrid}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Judul tampil (opsional)</label>
                          <input name="title" type="text" defaultValue={section.title} className={styles.input} />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Slug (opsional)</label>
                          <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                          <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                        </div>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Background Section</label>
                        <select name="sectionBgTheme" defaultValue={String((cfg as any).sectionBgTheme ?? "NAVY")} className={styles.select}>
                          <option value="NAVY">NAVY</option>
                          <option value="GOLD">GOLD</option>
                          <option value="WHITE">WHITE</option>
                        </select>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Tema Card</label>
                        <select name="sectionTheme" defaultValue={String((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR")} className={styles.select}>
                          <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                          <option value="NAVY_GOLD">NAVY + GOLD</option>
                          <option value="WHITE_GOLD">WHITE + GOLD</option>
                          <option value="NAVY_WHITE">NAVY + WHITE</option>
                          <option value="GOLD_NAVY">GOLD + NAVY</option>
                          <option value="GOLD_WHITE">GOLD + WHITE</option>
                          <option value="WHITE_NAVY">WHITE + NAVY</option>
                        </select>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Layout</label>
                        <select name="layout" defaultValue={String(cfg.layout ?? "carousel")} className={styles.select}>
                          <option value="carousel">Carousel</option>
                          <option value="grid">Grid</option>
                        </select>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Pilih cabang yang tampil</label>
                        {cabangItems.length === 0 ? (
                          <p className={styles.helperText}>Belum ada cabang di database.</p>
                        ) : (
                          cabangItems.map((b) => {
                            const checked = Array.isArray(cfg.branchIds)
                              ? cfg.branchIds.map((v: any) => Number(v)).includes(Number(b.id))
                              : false;
                            const labelText = (b.namaCabang as string) || (b.alamat as string) || `Cabang #${b.id}`;
                            return (
                              <label key={b.id} className={styles.checkboxRow}>
                                <input type="checkbox" name="branchIds" value={String(b.id)} defaultChecked={checked} />
                                <span>{labelText}</span>
                              </label>
                            );
                          })
                        )}
                      </div>

                      <div className={styles.highlightFooterActions}>
                        <button type="submit" className={styles.secondaryButton}>
                          Simpan
                        </button>

                        {activeThemeKey ? (
                          <a
                            className={styles.primaryButton}
                            href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                              activeThemeKey
                            )}&focus=BRANCHES&sectionId=${section.id}`}
                          >
                            Preview
                          </a>
                        ) : (
                          <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                            Preview
                          </span>
                        )}

                        <button type="submit" formAction={toggleDraft} className={styles.secondaryButton}>
                          {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                        </button>

                        <button type="submit" formAction={deleteDraft} className={styles.dangerButton}>
                          Hapus
                        </button>
                      </div>
                    </form>
                  )}


                  {/* CONTACT */}
                  {section.type === "CONTACT" && (() => {
                    const cfgAny = cfg as any;

                    // Mode "Hubungi Kami" fixed: Split Image + Button Stack
                    const mode = "SPLIT_IMAGE_STACK";
                    const imageMandatory = true;
                    const showImage = true;

                    const imageIdNum = Number(cfgAny.imageId);
                    const imageId = Number.isFinite(imageIdNum) && imageIdNum > 0 ? imageIdNum : null;
                    const img = imageId ? imageMap.get(imageId) : null;

                    const headerText = String(cfgAny.headerText ?? "");
                    const bodyText = String(cfgAny.bodyText ?? "");

                    const buttonLabels =
                      cfgAny.buttonLabels && typeof cfgAny.buttonLabels === "object" && !Array.isArray(cfgAny.buttonLabels)
                        ? (cfgAny.buttonLabels as any)
                        : {};

                    return (
                      <form action={saveContactConfig} className={styles.sectionEditForm} id={`contactForm-${section.id}`} data-section-form="1">
                        <input type="hidden" name="id" value={section.id.toString()} />
                        <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />

                        <div className={styles.sectionEditGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Judul tampil (opsional)</label>
                            <input name="title" type="text" defaultValue={section.title} className={styles.input} />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Slug (opsional)</label>
                            <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                            <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                          </div>
                        </div>

                        <div className={styles.sectionEditGrid}>

                          <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                              <button type="submit" formAction={autoGenerateContactCopy} className={styles.secondaryButton}>
                                Auto-generate Judul & Deskripsi
                              </button>
                              <span className={styles.helperText} style={{ margin: 0 }}>
                                Mengisi otomatis teks yang SEO-friendly berdasarkan brand apixinterior dari database.
                              </span>
                            </div>
                          </div>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tema Section</label>
                            <select
                              name="sectionTheme"
                              defaultValue={String((cfgAny as any).sectionTheme ?? "FOLLOW_NAVBAR")}
                              className={styles.select}
                            >
                              <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                              <option value="NAVY_GOLD">NAVY + GOLD</option>
                              <option value="WHITE_GOLD">WHITE + GOLD</option>
                              <option value="NAVY_WHITE">NAVY + WHITE</option>
                              <option value="GOLD_NAVY">GOLD + NAVY</option>
                              <option value="GOLD_WHITE">GOLD + WHITE</option>
                              <option value="WHITE_NAVY">WHITE + NAVY</option>
                            </select>
                          </div>

                          {/* Header + Teks (paling kepake untuk SPLIT_IMAGE_STACK) */}
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Header (opsional)</label>
                            <input
                              name="headerText"
                              className={styles.input}
                              placeholder="Contoh: Konsultasi Gratis"
                              defaultValue={headerText}
                            />
                            <p className={styles.helperText}>Dipakai terutama untuk mode Split Image.</p>
                          </div>

                          <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                            <label className={styles.label}>Teks (opsional)</label>
                            <textarea
                              name="bodyText"
                              className={styles.textarea}
                              placeholder="Contoh: Kirim ukuran ruangan & referensi. Tim kami respon cepat."
                              defaultValue={bodyText}
                              rows={3}
                            />
                          </div>

                          {/* Gambar: wajib untuk HERO_POSTER & SPLIT_IMAGE_STACK, opsional untuk yang lain */}
                          {imageMandatory ? (
                            <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                              <label className={styles.label}>Gambar</label>
                              <p className={styles.helperText}>Wajib untuk mode ini.</p>

                              <ImagePickerCaptcha
                                action={uploadImageToGalleryAndAttach}
                                sectionId={section.id.toString()}
                                attach="CONTACT:imageId"
                                endpoint="/api/admin/admin_dashboard/admin_galeri/list_gambar"
                                limit={40}
                                buttonLabel={imageId ? "Ganti gambar" : "Pilih gambar"}
                              />

                              <div style={{ marginTop: 10 }}>
                                {img?.url ? (
                                  <img
                                    src={img.url}
                                    alt={img.title || "Preview"}
                                    style={{ width: "100%", maxWidth: 520, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)" }}
                                  />
                                ) : (
                                  <p className={styles.helperText}>Belum ada gambar terpasang.</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                              <details open={showImage} style={{ border: "1px dashed rgba(0,0,0,0.18)", borderRadius: 12, padding: 12 }}>
                                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                                  <label style={{ display: "inline-flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
                                    <input type="checkbox" name="showImage" defaultChecked={showImage} />
                                    Pakai gambar (opsional)
                                  </label>
                                </summary>

                                <div style={{ marginTop: 12 }}>
                                  <ImagePickerCaptcha
                                    action={uploadImageToGalleryAndAttach}
                                    sectionId={section.id.toString()}
                                    attach="CONTACT:imageId"
                                    endpoint="/api/admin/admin_dashboard/admin_galeri/list_gambar"
                                    limit={40}
                                    buttonLabel={imageId ? "Ganti gambar" : "Pilih gambar"}
                                  />

                                  <div style={{ marginTop: 10 }}>
                                    {img?.url ? (
                                      <img
                                        src={img.url}
                                        alt={img.title || "Preview"}
                                        style={{ width: "100%", maxWidth: 520, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)" }}
                                      />
                                    ) : (
                                      <p className={styles.helperText}>Belum ada gambar terpasang.</p>
                                    )}
                                  </div>
                                </div>
                              </details>
                            </div>
                          )}

                          <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                            <label className={styles.label}>Pilih nomor / kontak yang tampil</label>
                            {hubungiItems.length === 0 ? (
                              <p className={styles.helperText}>Belum ada data di tabel hubungi.</p>
                            ) : (
                              hubungiItems.map((h: any) => {
                                const checked = Array.isArray(cfgAny.hubungiIds)
                                  ? cfgAny.hubungiIds.map((v: any) => Number(v)).includes(Number(h.id))
                                  : false;

                                return (
                                  <div key={h.id} className={styles.checkboxRow} style={{ alignItems: "center" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, flexWrap: "wrap" }}>
                                      <input className={styles.hubungiCheck} type="checkbox" name="hubungiIds" value={String(h.id)} defaultChecked={checked} />
                                      <span>
                                        <strong>#{h.id}</strong>  {String(h.nomor ?? "")}
                                        {typeof h.prioritas === "number" ? (
                                          <span style={{ marginLeft: 8, opacity: 0.7 }}>(prioritas {h.prioritas})</span>
                                        ) : null}
                                      </span>

                                      <input
                                        className={styles.hubungiLabelInput}
                                        type="text"
                                        name={`hubungiLabel_${String(h.id)}`}
                                        defaultValue={String(buttonLabels?.[String(h.id)] ?? buttonLabels?.[h.id] ?? "").trim()}
                                        placeholder="Teks tombol (contoh: Hubungi Admin)"
                                      />
                                    </label>
                                  </div>
                                );
                              })
                            )}
                            <p className={styles.helperText}>Boleh pilih lebih dari satu.</p>
                          </div>
                        </div>

                        <div className={styles.highlightFooterActions}>
                          <button type="submit" className={styles.secondaryButton}>
                            Simpan
                          </button>

                          {activeThemeKey ? (
                            <a
                              className={styles.primaryButton}
                              href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                                activeThemeKey
                              )}&focus=CONTACT&sectionId=${section.id}`}
                            >
                              Preview
                            </a>
                          ) : (
                            <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                              Preview
                            </span>
                          )}

                          <button type="submit" formAction={toggleDraft} className={styles.secondaryButton}>
                            {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                          </button>

                          <button type="submit" formAction={deleteDraft} className={styles.dangerButton}>
                            Hapus
                          </button>
                        </div>
                      </form>
                    );
                  })()}

                  {/* FOOTER */}
                  {section.type === "FOOTER" && (
                    <form action={saveFooterConfig} className={styles.sectionEditForm} data-section-form="1">
                      <input type="hidden" name="id" value={section.id.toString()} />
                      <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />

                      <div className={styles.sectionEditGrid}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Judul Section (Admin) (opsional)</label>
                          <input name="title" type="text" defaultValue={section.title} className={styles.input} />
                          <p className={styles.helperText}>Judul hanya untuk identifikasi di list admin.</p>
                        </div>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Slug (opsional)</label>
                          <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                        </div>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Tema Warna</label>
                        <select
                          name="sectionTheme"
                          defaultValue={String((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR")}
                          className={styles.select}
                        >
                          <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                          <option value="NAVY_GOLD">NAVY + GOLD</option>
                          <option value="WHITE_GOLD">WHITE + GOLD</option>
                          <option value="NAVY_WHITE">NAVY + WHITE</option>
                          <option value="GOLD_NAVY">GOLD + NAVY</option>
                          <option value="GOLD_WHITE">GOLD + WHITE</option>
                          <option value="WHITE_NAVY">WHITE + NAVY</option>
                        </select>
                        <p className={styles.helperText}>
                          Menentukan warna background dan elemen (teks/ikon).
                        </p>
                      </div>

                      {/* Use Wrapper for all footer config (handles Auto Gen + State) */}
                      <FooterEditorWrapper config={cfg} />



                      <div className={styles.highlightFooterActions}>
                        <button type="submit" className={styles.secondaryButton}>
                          Simpan
                        </button>

                        {activeThemeKey ? (
                          <a
                            className={styles.primaryButton}
                            href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                              activeThemeKey
                            )}&focus=FOOTER&sectionId=${section.id}`}
                          >
                            Preview
                          </a>
                        ) : (
                          <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                            Preview
                          </span>
                        )}

                        <button type="submit" formAction={toggleDraft} className={styles.secondaryButton}>
                          {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                        </button>

                        <button type="submit" formAction={deleteDraft} className={styles.dangerButton}>
                          Hapus
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ROOM_CATEGORY */}
                  {section.type === "ROOM_CATEGORY" && (
                    <div className={styles.sectionEditForm}>
                      {(() => {
                        const roomCards = normalizeRoomCards(cfg?.cards);
                        const canAdd = roomCards.length < MAX_ROOM_CARDS;

                        return (
                          <form action={saveRoomCategoryConfig} className={styles.sectionEditForm} data-section-form="1">
                            <input type="hidden" name="id" value={section.id.toString()} />
                            <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />

                            <div className={styles.sectionEditGrid}>
                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Judul tampil (opsional)</label>
                                <input name="title" type="text" defaultValue={section.title} className={styles.input} />
                              </div>

                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Slug (opsional)</label>
                                <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                                <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                              </div>


                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Tema Section (opsional)</label>
                                <select
                                  name="sectionTheme"
                                  defaultValue={String((cfg as any)?.sectionTheme ?? "FOLLOW_NAVBAR")}
                                  className={styles.select}
                                >
                                  <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                                  <option value="NAVY_GOLD">Navy + Gold</option>
                                  <option value="WHITE_GOLD">White + Gold</option>
                                  <option value="NAVY_WHITE">Navy + White</option>
                                  <option value="GOLD_NAVY">Gold + Navy</option>
                                  <option value="GOLD_WHITE">Gold + White</option>
                                  <option value="WHITE_NAVY">White + Navy</option>
                                </select>
                                <p className={styles.helperText}>
                                  Atur warna <strong>background + elemen</strong> untuk section ini. Kalau tidak diubah, otomatis mengikuti tema navbar.
                                </p>
                              </div>

                            </div>




                            <div className={styles.fieldGroup}>
                              <label className={styles.label}>Kartu Ruangan</label>
                              <p className={styles.helperText}>
                                Maksimal <strong>{MAX_ROOM_CARDS}</strong> kartu. Jika gambar tidak dipilih, renderer akan pakai{' '}
                                <strong>gambar pertama</strong> dari kategori yang dipilih (mode otomatis).
                              </p>
                            </div>

                            {roomCards.map((card, idx) => {
                              const img = card.imageId ? gambarById.get(card.imageId) : null;
                              const autoImageId =
                                !card.imageId && card.kategoriId ? autoCoverImageIdByKategori.get(card.kategoriId) ?? null : null;
                              const autoImg = autoImageId ? gambarById.get(autoImageId) : null;
                              const effectiveImg = (img as any)?.url ? img : (autoImg as any)?.url ? autoImg : null;
                              const isAuto = !card.imageId && Boolean((autoImg as any)?.url);
                              const effectiveUrl = normalizePublicUrl((effectiveImg as any)?.url);


                              return (
                                <div key={card.key} className={styles.innerCard} style={{ marginTop: 10 }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      gap: 10,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <div className={styles.sectionHeading} style={{ fontSize: 14, margin: 0 }}>
                                      Kartu #{idx + 1}
                                    </div>

                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                      <button
                                        type="submit"
                                        formAction={moveRoomCategoryCard.bind(null, `${card.key}:up`)}
                                        className={styles.secondaryButton}
                                        disabled={idx === 0}
                                        aria-disabled={idx === 0}
                                      >

                                      </button>
                                      <button
                                        type="submit"
                                        formAction={moveRoomCategoryCard.bind(null, `${card.key}:down`)}
                                        className={styles.secondaryButton}
                                        disabled={idx === roomCards.length - 1}
                                        aria-disabled={idx === roomCards.length - 1}
                                      >

                                      </button>
                                      <button
                                        type="submit"
                                        formAction={removeRoomCategoryCard.bind(null, card.key)}
                                        className={styles.dangerButton}
                                        disabled={roomCards.length <= 1}
                                        aria-disabled={roomCards.length <= 1}
                                      >
                                        Hapus
                                      </button>
                                    </div>
                                  </div>

                                  <div className={styles.sectionEditGrid}>
                                    <div className={styles.fieldGroup}>
                                      <label className={styles.label}>Judul kartu</label>
                                      <input
                                        name={`title_${card.key}`}
                                        className={styles.input}
                                        placeholder="Contoh: Ruang Tamu"
                                        defaultValue={card.title ?? ""}
                                      />
                                    </div>

                                    <div className={styles.fieldGroup}>
                                      <label className={styles.label}>Badge (opsional)</label>
                                      <input
                                        name={`badge_${card.key}`}
                                        className={styles.input}
                                        placeholder="Contoh: Populer"
                                        defaultValue={card.badge ?? ""}
                                      />
                                    </div>

                                    <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                                      <label className={styles.label}>Deskripsi (opsional)</label>
                                      <input
                                        name={`description_${card.key}`}
                                        className={styles.input}
                                        placeholder="Contoh: Sofa  Meja  Dekor"
                                        defaultValue={card.description ?? ""}
                                      />
                                    </div>

                                    <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                                      <label className={styles.label}>Kategori Produk</label>
                                      <select
                                        name={`kategoriId_${card.key}`}
                                        defaultValue={String(card.kategoriId ?? "")}
                                        className={styles.select}
                                      >
                                        <option value="">(Pilih kategori)</option>
                                        {categoryItems.map((c) => (
                                          <option key={c.id} value={String(c.id)}>
                                            #{c.id}  {(c.namaKategori as string) || (c.nama as string) || (c.slug as string)}
                                          </option>
                                        ))}
                                      </select>
                                      <p className={styles.helperText}>
                                        Kategori ini nanti yang dipakai untuk link/filternya kartu ruangan.
                                      </p>
                                    </div>

                                    <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                                      <label className={styles.label}>Gambar kartu</label>

                                      {effectiveUrl ? (
                                        <div className={styles.roomArchSimRow}>
                                          <div className={styles.roomArchSimCard}>
                                            <div
                                              className={styles.roomArchSimMedia}
                                              style={{ ["--rc-bg" as any]: `url(${String(effectiveUrl)})` }}
                                            >
                                              <img
                                                src={String(effectiveUrl)}
                                                alt={String(((effectiveImg as any).title as string) || (isAuto ? "auto" : "room"))}
                                                className={`${styles.roomArchSimImg} ${styles.roomArchFitCover}`}
                                              />
                                            </div>
                                          </div>

                                          <div className={styles.roomArchControls}>
                                            {card.imageId && !(img as any)?.url ? (
                                              <div
                                                style={{
                                                  padding: 12,
                                                  borderRadius: 12,
                                                  border: "1px dashed rgba(0,0,0,0.25)",
                                                  color: "rgba(17,17,17,0.7)",
                                                  fontSize: 12,
                                                }}
                                              >
                                                imageId #{String(card.imageId)} (tidak ada di list 200 gambar terbaru)
                                              </div>
                                            ) : null}

                                            {!card.imageId ? (
                                              <div
                                                style={{
                                                  padding: "10px 12px",
                                                  borderRadius: 12,
                                                  border: "1px dashed rgba(0,0,0,0.25)",
                                                  color: "rgba(17,17,17,0.7)",
                                                  fontSize: 12,
                                                }}
                                              >
                                                Mode otomatis: pakai gambar pertama dari kategori (kalau ada).
                                              </div>
                                            ) : null}

                                            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                              <ImagePickerCaptcha
                                                action={uploadImageToGalleryAndAttach}
                                                sectionId={section.id.toString()}
                                                attach={`ROOM_CATEGORY:${card.key}`}
                                                endpoint="/api/admin/admin_dashboard/admin_galeri/list_gambar"
                                                limit={40}
                                                buttonLabel={card.imageId ? "Ganti / Upload Gambar" : "Pilih / Upload Gambar"}
                                              />
                                              {card.imageId ? (
                                                <button
                                                  type="submit"
                                                  formAction={clearRoomCategoryCardImage.bind(null, card.key)}
                                                  className={styles.secondaryButton}
                                                >
                                                  Reset ke Otomatis
                                                </button>
                                              ) : null}
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className={styles.roomArchSimRow}>
                                          <div className={styles.roomArchSimCard}>
                                            <div className={styles.roomArchSimMedia} />
                                          </div>

                                          <div className={styles.roomArchControls}>
                                            {card.imageId ? (
                                              <div
                                                style={{
                                                  padding: 12,
                                                  borderRadius: 12,
                                                  border: "1px dashed rgba(0,0,0,0.25)",
                                                  color: "rgba(17,17,17,0.7)",
                                                  fontSize: 12,
                                                }}
                                              >
                                                imageId #{String(card.imageId)} (tidak ada di list 200 gambar terbaru)
                                              </div>
                                            ) : (
                                              <div
                                                style={{
                                                  padding: "10px 12px",
                                                  borderRadius: 12,
                                                  border: "1px dashed rgba(0,0,0,0.25)",
                                                  color: "rgba(17,17,17,0.7)",
                                                  fontSize: 12,
                                                }}
                                              >
                                                Mode otomatis: pakai gambar pertama dari kategori (kalau ada).
                                              </div>
                                            )}

                                            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                              <ImagePickerCaptcha
                                                action={uploadImageToGalleryAndAttach}
                                                sectionId={section.id.toString()}
                                                attach={`ROOM_CATEGORY:${card.key}`}
                                                endpoint="/api/admin/admin_dashboard/admin_galeri/list_gambar"
                                                limit={40}
                                                buttonLabel={card.imageId ? "Ganti / Upload Gambar" : "Pilih / Upload Gambar"}
                                              />
                                              {card.imageId ? (
                                                <button
                                                  type="submit"
                                                  formAction={clearRoomCategoryCardImage.bind(null, card.key)}
                                                  className={styles.secondaryButton}
                                                >
                                                  Reset ke Otomatis
                                                </button>
                                              ) : null}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            <div className={styles.sectionEditActions}>
                              <button
                                type="submit"
                                formAction={addRoomCategoryCard}
                                className={styles.secondaryButton}
                                disabled={!canAdd}
                                aria-disabled={!canAdd}
                              >
                                + Tambah Kartu
                              </button>
                              <span style={{ fontSize: 12, opacity: 0.75 }}>
                                {roomCards.length}/{MAX_ROOM_CARDS}
                              </span>
                            </div>

                            <div className={styles.highlightFooterActions}>
                              <button type="submit" className={styles.secondaryButton}>
                                Simpan
                              </button>

                              {activeThemeKey ? (
                                <a
                                  href={`${ADMIN_TOKO_PATH}/preview?theme=${encodeURIComponent(
                                    activeThemeKey
                                  )}&focus=ROOM_CATEGORY&sectionId=${section.id}`}
                                  className={styles.primaryButton}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Preview
                                </a>
                              ) : (
                                <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                                  Preview
                                </span>
                              )}

                              <button type="submit" formAction={toggleDraft} className={styles.secondaryButton}>
                                {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                              </button>

                              <button type="submit" formAction={deleteDraft} className={styles.dangerButton}>
                                Hapus
                              </button>
                            </div>

                          </form>
                        );
                      })()}
                    </div>
                  )}

                  {/* HIGHLIGHT_COLLECTION */}
                  {section.type === "HIGHLIGHT_COLLECTION" && (
                    <div className={styles.sectionEditForm}>
                      <form id={`highlightForm-${section.id}`} action={saveHighlightCollectionConfig} className={styles.sectionEditForm} data-section-form="1">
                        <input type="hidden" name="id" value={section.id.toString()} />

                        {/* Mode diset fixed ke products (backward compatible) */}
                        <input type="hidden" name="mode" value="products" />

                        <input type="hidden" name="theme" value={activeThemeKey} />

                        <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />

                        <div className={styles.highlightMetaRow}>
                          <div className={styles.fieldGroup} style={{ flex: 1, minWidth: 220 }}>
                            <label className={styles.label}>Slug (opsional)</label>
                            <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                            <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                          </div>

                        </div>


                        <div className={styles.sectionEditGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Layout</label>
                            <select
                              name="layout"
                              defaultValue={String(cfg.layout ?? "FEATURED_LEFT")}
                              className={styles.select}
                            >
                              <option value="FEATURED_LEFT">Featured Left (Desktop)  Stack (Mobile)</option>
                              <option value="FEATURED_TOP">Featured Top</option>
                              <option value="GRID">Grid</option>
                              <option value="CARDS">Cards (Scroll)</option>
                            </select>
                            <p className={styles.helperText}>
                              Desktop akan tampil Featured Left. Tablet/HP otomatis stack: header  hero  items.
                            </p>
                          </div>


                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tema Section</label>
                            <select
                              name="sectionTheme"
                              defaultValue={String((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR")}
                              className={styles.select}
                            >
                              <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                              <option value="NAVY_GOLD">NAVY + GOLD</option>
                              <option value="WHITE_GOLD">WHITE + GOLD</option>
                              <option value="NAVY_WHITE">NAVY + WHITE</option>
                              <option value="GOLD_NAVY">GOLD + NAVY</option>
                              <option value="GOLD_WHITE">GOLD + WHITE</option>
                              <option value="WHITE_NAVY">WHITE + NAVY</option>
                            </select>
                            <p className={styles.helperText}>
                              Mengatur warna background + elemen + card + CTA untuk section ini. Default ikut tema Navbar.
                            </p>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Judul tampil (opsional)</label>
                            <input
                              name="headline"
                              defaultValue={cfg.headline ?? ""}
                              className={styles.input}
                              placeholder="Mis. Koleksi Pilihan"
                            />
                            <p className={styles.helperText}>Boleh dikosongkan (judul tidak tampil di website).</p>
                          </div>

                          <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <label className={styles.label}>Deskripsi (opsional)</label>
                              <button
                                formAction={autoGenerateHighlightCollection}
                                className={styles.secondaryButton}
                                style={{ fontSize: 11, padding: "4px 8px", height: "auto" }}
                                title="Klik untuk isi otomatis judul, deskripsi, dan CTA"
                              >
                                Auto Generate Text
                              </button>
                            </div>
                            <textarea name="description" defaultValue={cfg.description ?? ""} className={styles.input} rows={3} />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>CTA Text (opsional)</label>
                            <input name="ctaText" defaultValue={cfg.ctaText ?? ""} className={styles.input} />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>CTA Link (opsional)</label>
                            <input name="ctaHref" defaultValue={cfg.ctaHref ?? ""} className={styles.input} placeholder="/cari" />
                          </div>

                          <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                            <label className={styles.label}>Hero Media (opsional)</label>
                            <div style={{ marginTop: 10 }}>
                              {/* Preview gambar terpilih */}
                              {(() => {
                                const heroUrl =
                                  (gambarById.get(Number(cfg.heroImageId)) as any)?.url ?? null;
                                // eslint-disable-next-line @next/next/no-img-element
                                return (
                                  <>
                                    {heroUrl ? (
                                      <img
                                        id={`img-preview-highlight-${section.id}`}
                                        src={String(heroUrl)}
                                        alt="Preview"
                                        style={{
                                          width: "100%",
                                          maxWidth: 420,
                                          height: 220,
                                          objectFit: "cover",
                                          borderRadius: 12,
                                          border: "1px solid rgba(0,0,0,0.08)",
                                          display: "block",
                                        }}
                                      />
                                    ) : (cfg.heroImageId ? (
                                      <div
                                        style={{
                                          width: "100%",
                                          maxWidth: 420,
                                          padding: 12,
                                          borderRadius: 12,
                                          border: "1px dashed rgba(0,0,0,0.25)",
                                          color: "rgba(17,17,17,0.7)",
                                          fontSize: 12,
                                        }}
                                      >
                                        Hero imageId #{String(cfg.heroImageId)} (tidak ada di list 200 gambar terbaru)
                                      </div>
                                    ) : null)}


                                    <div style={{ marginTop: 10 }}>
                                      <div style={{ fontWeight: 800, color: "rgba(17,17,17,0.9)" }}>
                                        Pilih gambar dari galeri
                                      </div>
                                      <div style={{ color: "rgba(17,17,17,0.7)", fontSize: 12, marginTop: 6 }}>
                                        Klik tombol untuk buka picker, cari (id/title/tags), lalu pilih thumbnail.
                                      </div>
                                      <div style={{ marginTop: 10 }}>
                                        <ImagePickerCaptcha
                                          action={uploadImageToGalleryAndAttach}
                                          sectionId={section.id.toString()}
                                          attach="HIGHLIGHT_COLLECTION:heroImageId"
                                          endpoint="/api/admin/admin_dashboard/admin_galeri/list_gambar"
                                          limit={40}
                                          buttonLabel="Buka Picker Gambar"
                                        />
                                        <div className={styles.highlightHeroClearRow}>
                                          <button type="submit" formAction={clearHighlightCollectionHero} className={styles.secondaryButton}>
                                            Hapus Hero Image
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Item kurasi (produk)</label>
                          <p className={styles.helperText}>
                            Pilih produk lalu drag &amp; drop untuk urutan tampil. (Versi awal: item hanya produk; nanti bisa diperluas
                            jadi campuran product/category/custom tanpa mengubah data lama.)
                          </p>

                          <ProductCarouselPicker
                            products={(productItems as any[]).map((p: any) => ({
                              id: Number(p.id),
                              nama:
                                (p.nama as string) ||
                                (p.namaProduk as string) ||
                                (p.slug as string) ||
                                `Produk #${String(p.id)}`,
                              harga: typeof p.harga === "number" ? p.harga : Number(p.harga) || undefined,
                              kategori: (p.kategori as string) || undefined,
                              subkategori: (p.subkategori as string) || undefined,
                              mainImageId: p.mainImageId ?? null,
                              galleryImageIds: Array.isArray(p.galleryImageIds)
                                ? (p.galleryImageIds as any[]).map((v: any) => Number(v)).filter((n: any) => Number.isFinite(n))
                                : [],
                            }))}
                            images={(gambarItems as any[]).map((g: any) => ({
                              id: Number(g.id),
                              url: String(g.url),
                              title: (g.title as string) || "",
                              tags: (g.tags as string) || "",
                            }))}
                            initialIds={
                              Array.isArray(cfg.productIds)
                                ? cfg.productIds.map((v: any) => Number(v)).filter((n: any) => Number.isFinite(n))
                                : []
                            }

                            inputName="productIds"
                          />

                          <div className={styles.pickerExtraActions}>
                            <button
                              type="submit"
                              formAction={clearHighlightCollectionProducts}
                              className={styles.dangerButton}
                              disabled={!Array.isArray(cfg.productIds) || cfg.productIds.length === 0}
                              title={
                                !Array.isArray(cfg.productIds) || cfg.productIds.length === 0
                                  ? "Belum ada produk dipilih."
                                  : "Hapus semua produk yang dipilih."
                              }
                            >
                              Drop Produk
                            </button>
                          </div>

                        </div>

                        <div className={styles.highlightFooterActions}>
                          <button type="submit" className={styles.secondaryButton}>Simpan</button>
                          <a
                            className={styles.primaryButton}
                            href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(activeThemeKey)}&focus=HIGHLIGHT_COLLECTION&sectionId=${section.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Preview
                          </a>
                          <button type="submit" formAction={toggleDraft} className={styles.secondaryButton}>
                            {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                          <button type="submit" formAction={deleteDraft} className={styles.dangerButton}>Hapus</button>
                        </div>

                      </form>
                    </div>
                  )}
                  {/* Legacy banner_promo list (read-only info) */}
                  {section.type === "CUSTOM_PROMO" && legacyBannerPromoId ? (
                    <div className={styles.helperText} style={{ marginTop: 8 }}>
                      Info legacy: <code>banner_promo</code> #{String(legacyBannerPromoId)}{" "}
                      {bannerPromoItems.find((b: any) => Number(b.id) === Number(legacyBannerPromoId))
                        ? "(ditemukan)"
                        : "(tidak ditemukan)"}
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>

      {activeThemeKey ? (
        <FloatingPreviewActions
          themeKey={activeThemeKey}
          previewHref={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(activeThemeKey)}`}
          resetAction={resetTheme}
          autoGenerateAction={autoGenerateThemeContent}
          previewClassName={styles.secondaryButton}
          saveClassName={styles.primaryButton}
          dangerClassName={styles.dangerButton}
          autoGenerateClassName={styles.secondaryButton}
        />
      ) : null}

      {/* Script drag & drop urutan section + ordered picker (vanilla JS) */}
      <TokoClient />
      <script dangerouslySetInnerHTML={{ __html: voucherLinkScript }} />
      <script dangerouslySetInnerHTML={{ __html: scrollRestoreScript }} />
      <script dangerouslySetInnerHTML={{ __html: formFocusScript }} />
    </div>
  );
}





