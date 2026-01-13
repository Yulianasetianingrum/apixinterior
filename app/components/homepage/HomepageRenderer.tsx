import React from "react";
import {
  getEnabledSections,
  getSections,
  normalizeConfig,
  SectionRow,
  SectionScope,
  HomepageSectionType,
} from "@/lib/homepage-sections";
import { prisma } from "@/lib/prisma";
import {
  BranchesSection,
  CategoryGridSection,
  CategoryCommerceGridSection,
  ContactSection,
  CustomPromoSection,
  GallerySection,
  HeroSection,
  HighlightCollectionSection,
  ProductCarouselSection,
  RoomCategorySection,
  SocialSection,
} from "./sections";

function normalizeThemeAttr(v: any): string {
  const s = String(v ?? "").trim();
  if (!s) return "";

  // Keep theme_1..theme_6 in lowercase because CSS selectors use that form.
  const m = s.match(/^theme[_-]?(\d+)$/i);
  if (m) return `theme_${Number(m[1])}`;

  // Normalize navbar combo tokens (NAVY_GOLD, etc), accept kebab-case input.
  // Normalize combos like "GOLD + NAVY" / "gold-navy" -> "GOLD_NAVY"
  return s.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

const ALLOWED_THEME_COMBOS = new Set([
  "theme_1",
  "theme_2",
  "theme_3",
  "theme_4",
  "theme_5",
  "theme_6",
  "NAVY_GOLD",
  "WHITE_GOLD",
  "NAVY_WHITE",
  "GOLD_NAVY",
  "GOLD_WHITE",
  "WHITE_NAVY",
]);

const FALLBACK_CATEGORY_IMAGE_URL = "/logo/logo_apixinterior_biru.png.png";

function parseSectionTheme(raw: any): string | null {
  const normalized = normalizeThemeAttr(raw);
  if (!normalized || normalized === "FOLLOW_NAVBAR") return null;
  return ALLOWED_THEME_COMBOS.has(normalized) ? normalized : null;
}

function resolveEffectiveTheme(raw: any, navbarTheme: string): string {
  const parsed = parseSectionTheme(raw);
  const navbar = normalizeThemeAttr(navbarTheme || "NAVY_GOLD") || "NAVY_GOLD";
  return parsed || navbar;
}

type RendererProps = {
  scope: SectionScope;
};

async function getImageMap(imageIds: number[]) {
  if (!imageIds.length) return new Map<number, { url: string; title: string | null }>();
  const rows = await prisma.gambarUpload.findMany({
    where: { id: { in: imageIds } },
    select: { id: true, url: true, title: true },
  });
  return new Map(rows.map((r) => [r.id, { url: r.url, title: r.title }]));
}

async function getBannerPromoFallback(bannerPromoId: number) {
  try {
    // Optional legacy fallback table
    const row = await prisma.bannerPromo.findUnique({
      where: { id: bannerPromoId },
      select: { id: true, title: true, subtitle: true, buttonLabel: true, buttonHref: true, imageId: true },
    });
    return row;
  } catch {
    return null;
  }
}

function collectReferencedIds(sections: SectionRow[]) {
  const imageIds: number[] = [];
  const productIds: number[] = [];
  const kategoriIds: number[] = [];
  const hubungiIds: number[] = [];
  const branchIds: number[] = [];
  const bannerPromoIds: number[] = [];

  for (const s of sections) {
    const cfg = normalizeConfig(s.type as HomepageSectionType, s.config);

    if (s.type === "HERO" || s.type === "CUSTOM_PROMO") {
      if (typeof cfg?.imageId === "number") imageIds.push(cfg.imageId);
      if (typeof cfg?.bannerPromoId === "number") bannerPromoIds.push(cfg.bannerPromoId);
    }

    if (s.type === "CATEGORY_GRID") {
      const items = Array.isArray(cfg?.items) ? cfg.items : [];
      for (const it of items) {
        if (typeof it?.kategoriId === "number") kategoriIds.push(it.kategoriId);
        if (typeof it?.coverImageId === "number") imageIds.push(it.coverImageId);
      }
    }

    if (s.type === "CATEGORY_GRID_COMMERCE") {
      const items = Array.isArray(cfg?.items) ? cfg.items : [];
      for (const it of items) {
        if (typeof it?.kategoriId === "number") kategoriIds.push(it.kategoriId);
        if (typeof it?.imageId === "number") imageIds.push(it.imageId);
      }
    }

    if (s.type === "PRODUCT_CAROUSEL") {
      if (Array.isArray(cfg?.productIds)) {
        for (const id of cfg.productIds) if (typeof id === "number") productIds.push(id);
      }
    }

    if (s.type === "GALLERY") {
      if (Array.isArray(cfg?.imageIds)) {
        for (const id of cfg.imageIds) if (typeof id === "number") imageIds.push(id);
      }
    }

    if (s.type === "ROOM_CATEGORY") {
      if (Array.isArray(cfg?.cards)) {
        for (const c of cfg.cards) {
          if (typeof c?.kategoriId === "number") kategoriIds.push(c.kategoriId);
          if (typeof c?.imageId === "number") imageIds.push(c.imageId);
        }
      }
    }

    if (s.type === "HIGHLIGHT_COLLECTION") {
      if (cfg?.mode === "products" && Array.isArray(cfg?.productIds)) {
        for (const id of cfg.productIds) if (typeof id === "number") productIds.push(id);
      }
      if (cfg?.mode === "categories" && Array.isArray(cfg?.categoryIds)) {
        for (const id of cfg.categoryIds) if (typeof id === "number") kategoriIds.push(id);
      }
    }

    if (s.type === "CONTACT") {
      if (Array.isArray(cfg?.hubungiIds)) {
        for (const id of cfg.hubungiIds) if (typeof id === "number") hubungiIds.push(id);
      }
    }

    if (s.type === "BRANCHES") {
      if (Array.isArray(cfg?.branchIds)) {
        for (const id of cfg.branchIds) if (typeof id === "number") branchIds.push(id);
      }
    }
  }

  return {
    imageIds: Array.from(new Set(imageIds)),
    productIds: Array.from(new Set(productIds)),
    kategoriIds: Array.from(new Set(kategoriIds)),
    hubungiIds: Array.from(new Set(hubungiIds)),
    branchIds: Array.from(new Set(branchIds)),
    bannerPromoIds: Array.from(new Set(bannerPromoIds)),
  };
}

export default async function HomepageRenderer({ scope }: RendererProps) {
  let sections = await getEnabledSections(scope);

  // Website utama: fallback to legacy if published empty (optional requirement).
  if (scope === "published" && sections.length === 0) {
    sections = await getEnabledSections("legacy");
  }

  // Navbar theme is the source-of-truth for FOLLOW_NAVBAR behavior.
  const navbarSetting = await prisma.navbarSetting.findFirst({ select: { theme: true } });
  const navbarTheme = normalizeThemeAttr((navbarSetting as any)?.theme || "NAVY_GOLD") || "NAVY_GOLD";

  const refs = collectReferencedIds(sections);

  const [imageMap, produkRows, kategoriRows, hubungiRows, cabangRows, mediaRows] = await Promise.all([
    getImageMap(refs.imageIds),
    refs.productIds.length
      ? prisma.produk.findMany({
        where: { id: { in: refs.productIds } },
        select: { id: true, nama: true, harga: true, mainImageId: true },
      })
      : Promise.resolve([]),
    refs.kategoriIds.length
      ? prisma.kategoriProduk.findMany({
        where: { id: { in: refs.kategoriIds } },
        select: { id: true, nama: true, slug: true },
      })
      : Promise.resolve([]),
    refs.hubungiIds.length
      ? prisma.hubungi.findMany({
        where: { id: { in: refs.hubungiIds } },
        select: { id: true, label: true, value: true },
      })
      : Promise.resolve([]),
    refs.branchIds.length
      ? prisma.cabangToko.findMany({
        where: { id: { in: refs.branchIds } },
        select: { id: true, nama: true, alamat: true },
      })
      : Promise.resolve([]),
    prisma.mediaSosial.findMany({
      select: { id: true, nama: true, iconKey: true, url: true },
    }),
  ]);

  const produkMap = new Map(produkRows.map((p) => [p.id, p]));
  const kategoriMap = new Map(kategoriRows.map((k) => [k.id, k]));
  const hubungiMap = new Map(hubungiRows.map((h) => [h.id, h]));
  const cabangMap = new Map(cabangRows.map((c) => [c.id, c]));
  const mediaMap = new Map(mediaRows.map((m) => [String(m.iconKey).toLowerCase(), m]));

  // Optional legacy banner_promo fallback for CUSTOM_PROMO if config.bannerPromoId exists.
  const bannerPromoMap = new Map<number, any>();
  if (refs.bannerPromoIds.length) {
    const banners = await Promise.all(refs.bannerPromoIds.map(getBannerPromoFallback));
    for (const b of banners) if (b?.id) bannerPromoMap.set(b.id, b);
  }

  return (
    <main className="min-h-screen">
      {sections.map((s) => {
        const cfg = normalizeConfig(s.type as HomepageSectionType, s.config);

        if (s.type === "HERO") {
          const imageUrl =
            typeof cfg?.imageId === "number" ? imageMap.get(cfg.imageId)?.url ?? null : null;

          return (
            <HeroSection
              key={s.id}
              headline={cfg?.headline}
              subheadline={cfg?.subheadline}
              ctaLabel={cfg?.ctaLabel}
              ctaHref={cfg?.ctaHref}
              imageUrl={imageUrl}
            />
          );
        }

        if (s.type === "CATEGORY_GRID") {
          const layout = cfg?.layout ?? {};
          const columns = typeof layout?.columns === "number" ? layout.columns : 3;
          const maxItems = typeof layout?.maxItems === "number" ? layout.maxItems : null;

          const items = (Array.isArray(cfg?.items) ? cfg.items : [])
            .filter((it: any) => typeof it?.kategoriId === "number")
            .map((it: any) => {
              const k = kategoriMap.get(it.kategoriId);
              const coverUrl =
                typeof it?.coverImageId === "number" ? imageMap.get(it.coverImageId)?.url ?? null : null;

              return {
                id: it.kategoriId,
                name: k?.nama ?? `Kategori #${it.kategoriId}`,
                href: "/kategori",
                coverUrl,
              };
            });

          return (
            <CategoryGridSection
              key={s.id}
              title={s.title}
              items={items}
              columns={columns}
              maxItems={maxItems}
            />
          );
        }

        if (s.type === "CATEGORY_GRID_COMMERCE") {
          const layout = cfg?.layout ?? {};
          const maxItems = typeof layout?.maxItems === "number" ? layout.maxItems : 16;
          const modeRaw = String((layout as any)?.mode ?? "clean").toLowerCase();
          const mode = modeRaw === "reverse" ? "reverse" : modeRaw === "commerce" ? "commerce" : "clean";
          const tabs = Array.isArray((cfg as any)?.tabs) ? (cfg as any).tabs : [];

          const items = (Array.isArray(cfg?.items) ? cfg.items : [])
            .map((it: any, idx: number) => {
              const type = String(it?.type ?? "category") === "custom" ? "custom" : "category";
              if (type === "custom") {
                const name = String(it?.label ?? "").trim() || `Item #${idx + 1}`;
                const href = String(it?.href ?? "").trim() || "/kategori";
                const imageUrl =
                  typeof it?.imageId === "number"
                    ? imageMap.get(it.imageId)?.url ?? null
                    : String(it?.imageUrl ?? "").trim() || null;
                return {
                  id: idx + 1,
                  name,
                  href,
                  imageUrl,
                  tabId: String(it?.tabId ?? ""),
                };
              }

              if (typeof it?.kategoriId !== "number") return null;
              const k = kategoriMap.get(it.kategoriId);
              const displayName = String(it?.label ?? "").trim();
              const slug = String(it?.slug ?? k?.slug ?? "").trim();
              const imageUrl =
                typeof it?.imageId === "number" ? imageMap.get(it.imageId)?.url ?? null : null;

              return {
                id: it.kategoriId,
                name: displayName || k?.nama || `Kategori #${it.kategoriId}`,
                href: slug ? `/kategori/${slug}` : "/kategori",
                imageUrl,
                tabId: String(it?.tabId ?? ""),
              };
            })
            .filter(Boolean)
            .slice(0, maxItems);

          if (items.length < 1) return null;

          return (
            <CategoryCommerceGridSection
              key={s.id}
              title={s.title}
              description={cfg?.description ?? null}
              items={items}
              fallbackUrl={FALLBACK_CATEGORY_IMAGE_URL}
              mode={mode}
              tabs={tabs}
            />
          );
        }

        if (s.type === "PRODUCT_CAROUSEL") {
          const title = cfg?.title ?? s.title ?? "Produk";
          const rawCfg: any = (s.config ?? {}) as any;
          const descriptionCandidate =
            typeof (cfg as any)?.description === "string"
              ? (cfg as any).description
              : typeof rawCfg.description === "string"
                ? rawCfg.description
                : typeof rawCfg.deskripsi === "string"
                  ? rawCfg.deskripsi
                  : typeof rawCfg.subtitle === "string"
                    ? rawCfg.subtitle
                    : null;
          const description =
            typeof descriptionCandidate === "string" && descriptionCandidate.trim() ? descriptionCandidate.trim() : null;
          const showPrice = cfg?.showPrice !== false;
          const showCta = cfg?.showCta !== false;

          // Resolve section theme: sectionTheme -> carouselTheme -> theme (fallback) -> FOLLOW_NAVBAR
          const sectionThemeRaw = String((cfg as any).sectionTheme ?? (cfg as any).carouselTheme ?? (cfg as any).theme ?? "FOLLOW_NAVBAR").trim();
          const sectionTheme = resolveEffectiveTheme(sectionThemeRaw, navbarTheme);

          const ids: number[] = Array.isArray(cfg?.productIds) ? cfg.productIds.filter((x: any) => typeof x === "number") : [];
          const products = ids.map((id) => {
            const p = produkMap.get(id);
            const imgUrl = p?.mainImageId ? imageMap.get(p.mainImageId)?.url ?? null : null;
            return {
              id,
              name: p?.nama ?? `Produk #${id}`,
              price: p?.harga ?? null,
              imageUrl: imgUrl,
            };
          });

          return (
            <ProductCarouselSection
              key={s.id}
              title={title}
              description={description}
              products={products}
              showPrice={showPrice}
              showCta={showCta}
              theme={sectionTheme}
            />
          );
        }

        if (s.type === "CUSTOM_PROMO") {
          let title = cfg?.title ?? s.title ?? "Promo";
          let subtitle = cfg?.subtitle ?? null;
          let buttonLabel = cfg?.buttonLabel ?? null;
          let buttonHref = cfg?.buttonHref ?? null;
          let imageUrl =
            typeof cfg?.imageId === "number" ? imageMap.get(cfg.imageId)?.url ?? null : null;

          if (!title && typeof cfg?.bannerPromoId === "number") {
            const b = bannerPromoMap.get(cfg.bannerPromoId);
            if (b) {
              title = b.title ?? title;
              subtitle = b.subtitle ?? subtitle;
              buttonLabel = b.buttonLabel ?? buttonLabel;
              buttonHref = b.buttonHref ?? buttonHref;
              if (!imageUrl && typeof b.imageId === "number") {
                imageUrl = imageMap.get(b.imageId)?.url ?? null;
              }
            }
          }

          return (
            <CustomPromoSection
              key={s.id}
              title={title}
              subtitle={subtitle}
              buttonLabel={buttonLabel}
              buttonHref={buttonHref}
              imageUrl={imageUrl}
            />
          );
        }

        if (s.type === "SOCIAL") {
          const selected = Array.isArray(cfg?.selected) ? cfg.selected : [];
          const links = selected
            .filter((x: any) => typeof x?.iconKey === "string")
            .map((x: any) => {
              const m = mediaMap.get(String(x.iconKey).toLowerCase());
              return { iconKey: String(x.iconKey), href: m?.url ?? "#" };
            })
            .filter((x: any) => x.href && x.href !== "#");

          return <SocialSection key={s.id} links={links} />;
        }

        if (s.type === "BRANCHES") {
          const ids: number[] = Array.isArray(cfg?.branchIds) ? cfg.branchIds.filter((x: any) => typeof x === "number") : [];
          const layout = cfg?.layout === "grid" ? "grid" : "carousel";
          const branches = ids
            .map((id) => cabangMap.get(id))
            .filter(Boolean)
            .map((b: any) => ({ id: b.id, name: b.nama, address: b.alamat }));

          return <BranchesSection key={s.id} branches={branches} layout={layout} />;
        }

        if (s.type === "CONTACT") {
          const ids: number[] = Array.isArray(cfg?.hubungiIds) ? cfg.hubungiIds.filter((x: any) => typeof x === "number") : [];
          const primaryOnly = Boolean(cfg?.primaryOnly);
          const contacts = ids
            .map((id) => hubungiMap.get(id))
            .filter(Boolean)
            .map((h: any) => ({ id: h.id, label: h.label, value: h.value }));

          return <ContactSection key={s.id} contacts={contacts} primaryOnly={primaryOnly} />;
        }

        if (s.type === "GALLERY") {
          const ids: number[] = Array.isArray(cfg?.imageIds) ? cfg.imageIds.filter((x: any) => typeof x === "number") : [];
          const layout = cfg?.layout === "masonry" ? "masonry" : "grid";
          const images = ids
            .map((id) => imageMap.get(id))
            .map((img, idx) => ({
              id: ids[idx],
              url: img?.url ?? "",
              title: img?.title ?? null,
            }))
            .filter((i) => Boolean(i.url));

          return <GallerySection key={s.id} images={images} layout={layout} />;
        }

        if (s.type === "ROOM_CATEGORY") {
          const cardsCfg = Array.isArray(cfg?.cards) ? cfg.cards : [];
          const cards = cardsCfg.slice(0, 3).map((c: any) => {
            const imageUrl = typeof c?.imageId === "number" ? imageMap.get(c.imageId)?.url ?? null : null;
            return {
              key: String(c?.key ?? ""),
              title: String(c?.title ?? ""),
              href: "/kategori",
              imageUrl,
            };
          });
          return <RoomCategorySection key={s.id} cards={cards} />;
        }

        if (s.type === "HIGHLIGHT_COLLECTION") {
          const mode = cfg?.mode === "categories" ? "categories" : "products";
          const title = cfg?.title ?? s.title ?? "Koleksi Pilihan";

          const items =
            mode === "products"
              ? (Array.isArray(cfg?.productIds) ? cfg.productIds : [])
                .filter((x: any) => typeof x === "number")
                .map((id: number) => {
                  const p = produkMap.get(id);
                  return { id, name: p?.nama ?? `Produk #${id}`, href: `/produk/${id}` };
                })
              : (Array.isArray(cfg?.categoryIds) ? cfg.categoryIds : [])
                .filter((x: any) => typeof x === "number")
                .map((id: number) => {
                  const k = kategoriMap.get(id);
                  return { id, name: k?.nama ?? `Kategori #${id}`, href: "/kategori" };
                });

          return (
            <HighlightCollectionSection
              key={s.id}
              title={title}
              mode={mode}
              items={items}
            />
          );
        }

        return null;
      })}
    </main>
  );
}
