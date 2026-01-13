import React from "react";
import Image from "next/image";
import Link from "next/link";
import { SocialIcon } from "./social-icons";
import SwipeCarousel from "../SwipeCarousel";
import CategoryCommerceColumns from "./CategoryCommerceColumns.client";

function formatRupiah(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function clamp2Style(): React.CSSProperties {
  return {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };
}

export function SectionShell({
  title,
  description,
  children,
  theme,
}: {
  title?: string | null;
  description?: string | null;
  children: React.ReactNode;
  theme?: string | null;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8" data-theme={theme || undefined}>
      {title ? <h2 className="mb-4 text-xl font-semibold">{title}</h2> : null}
      {description ? <p className="mb-4 max-w-3xl text-sm opacity-75">{description}</p> : null}
      {children}
    </section>
  );
}

export function HeroSection({
  headline,
  subheadline,
  ctaLabel,
  ctaHref,
  imageUrl,
}: {
  headline?: string;
  subheadline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string | null;
}) {
  const title = headline || "Apix Interior";

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10">
      {/* Mobile / Tablet: image as background + content overlay, so it feels like one hero block */}
      <div className="relative overflow-hidden rounded-2xl border bg-white/10 sm:hidden">
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={title}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          </>
        ) : null}

        <div className="relative z-10 p-5">
          <h1 className="text-3xl font-bold leading-tight text-white">
            {title}
          </h1>

          {subheadline ? (
            <p className="mt-3 text-base text-white/85">
              {subheadline}
            </p>
          ) : null}

          {ctaHref && ctaLabel ? (
            <Link
              href={ctaHref}
              className="mt-5 inline-flex w-fit rounded-xl border border-white/30 bg-white/95 px-4 py-2 text-sm font-medium text-black shadow-sm"
            >
              {ctaLabel}
            </Link>
          ) : null}
        </div>

        {/* Keep a stable height so portrait photos don't dominate the screen */}
        <div className="pointer-events-none relative block h-[280px] w-full sm:h-[340px]" />
      </div>

      {/* Desktop: two-column layout like before */}
      <div className="hidden sm:grid sm:grid-cols-2 sm:gap-6 sm:rounded-2xl sm:border sm:p-6">
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-bold leading-tight">{title}</h1>
          {subheadline ? <p className="mt-3 text-base opacity-80">{subheadline}</p> : null}
          {ctaHref && ctaLabel ? (
            <Link href={ctaHref} className="mt-5 inline-flex w-fit rounded-xl border px-4 py-2 text-sm font-medium">
              {ctaLabel}
            </Link>
          ) : null}
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white/30">
          <div className="relative h-full min-h-[320px] w-full">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm opacity-60">Tidak ada gambar</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


export function CategoryGridSection({
  title,
  items,
  columns = 3,
  maxItems,
}: {
  title?: string | null;
  items: Array<{ id: number; name: string; href: string; coverUrl?: string | null }>;
  columns?: number;
  maxItems?: number | null;
}) {
  const show = typeof maxItems === "number" ? items.slice(0, maxItems) : items;
  const cols = Math.min(6, Math.max(2, columns));

  return (
    <SectionShell title={title || "Kategori"}>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {show.map((c) => (
          <Link key={c.id} href={c.href} className="group relative overflow-hidden rounded-2xl border">
            <div className="relative aspect-[4/3] bg-white/30">
              {c.coverUrl ? (
                <Image src={c.coverUrl} alt={c.name} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm opacity-60">{c.name}</div>
              )}
            </div>
            <div className="p-3 text-sm font-medium">{c.name}</div>
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}

export function CategoryCommerceGridSection({
  title,
  description,
  items,
  fallbackUrl,
  mode = "clean",
  tabs,
}: {
  title?: string | null;
  description?: string | null;
  items: Array<{ id: number; name: string; href: string; imageUrl?: string | null; tabId?: string | null }>;
  fallbackUrl?: string | null;
  mode?: "clean" | "commerce" | "reverse";
  tabs?: Array<{ id: string; label: string }>;
}) {
  return (
    <section className="apix-commerce-section">
      <div className="apix-commerce-container">
        {title ? <h2 className="apix-commerce-title">{title}</h2> : null}
        {description ? <p className="apix-commerce-desc">{description}</p> : null}

        <CategoryCommerceColumns
          items={items}
          fallbackUrl={fallbackUrl}
          mode={mode}
          tabs={tabs}
          viewAllHref={mode === "reverse" ? "/kategori" : null}
        />
      </div>

      <style>{`
        .apix-commerce-section {
          background: #ffffff;
          padding: 24px 0;
        }
        .apix-commerce-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .apix-commerce-title {
          font-size: 22px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #111827;
        }
        .apix-commerce-desc {
          margin: 0 0 16px 0;
          font-size: 14px;
          opacity: 0.75;
        }
      `}</style>
    </section>
  );
}

export function ProductCarouselSection({
  title,
  description,
  products,
  showPrice,
  showCta,
  theme,
}: {
  title?: string | null;
  description?: string | null;
  products: Array<{ id: number; name: string; price?: number | null; imageUrl?: string | null }>;
  showPrice: boolean;
  showCta: boolean;
  theme?: string | null;
}) {
  return (
    <SectionShell title={title || "Produk"} description={description} theme={theme}>
      <SwipeCarousel
        ariaLabel={title || "Produk"}
        className="flex gap-4 overflow-x-auto pb-2 pr-14"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >
        {products.map((p) => {
          const href = `/produk/${p.id}`;
          const priceText = formatRupiah(p.price ?? null);

          return (
            <div
              key={p.id}
              className="shrink-0 snap-start overflow-hidden rounded-2xl border bg-white/80 shadow-sm backdrop-blur-sm"
              style={{ width: 220 }}
            >
              <Link href={href} className="block">
                <div className="relative aspect-square bg-white">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      sizes="220px"
                      className="object-contain p-4"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm opacity-60">Tidak ada gambar</div>
                  )}
                </div>
              </Link>

              <div className="p-3">
                <Link href={href} className="block">
                  <div className="text-sm font-semibold" style={clamp2Style()}>
                    {p.name}
                  </div>
                </Link>

                {showPrice ? <div className="mt-1 text-sm font-medium opacity-80">{priceText}</div> : null}

                {showCta ? (
                  <Link
                    href={href}
                    className="mt-3 inline-flex w-full items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium"
                  >
                    Lihat Produk
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </SwipeCarousel>

      <style>{`
        [data-apix-carousel]::-webkit-scrollbar { display: none; }
      `}</style>
    </SectionShell>
  );
}

export function CustomPromoSection({
  title,
  subtitle,
  buttonLabel,
  buttonHref,
  imageUrl,
}: {
  title?: string | null;
  subtitle?: string | null;
  buttonLabel?: string | null;
  buttonHref?: string | null;
  imageUrl?: string | null;
}) {
  const heading = title || "Promo";

  return (
    <SectionShell>
      {/* Mobile: unified block with background image */}
      <div className="relative overflow-hidden rounded-2xl border bg-white/10 md:hidden">
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={heading}
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          </>
        ) : null}

        <div className="relative z-10 p-5">
          <h3 className="text-2xl font-bold text-white">{heading}</h3>
          {subtitle ? <p className="mt-2 text-sm text-white/85">{subtitle}</p> : null}
          {buttonHref && buttonLabel ? (
            <Link
              href={buttonHref}
              className="mt-4 inline-flex w-fit rounded-xl border border-white/30 bg-white/95 px-4 py-2 text-sm font-medium text-black shadow-sm"
            >
              {buttonLabel}
            </Link>
          ) : null}
        </div>

        <div className="pointer-events-none relative block h-[240px] w-full sm:h-[300px]" />
      </div>

      {/* Desktop: two-column layout */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-6 md:rounded-2xl md:border md:p-6">
        <div className="flex flex-col justify-center">
          <h3 className="text-2xl font-bold">{heading}</h3>
          {subtitle ? <p className="mt-2 text-sm opacity-80">{subtitle}</p> : null}
          {buttonHref && buttonLabel ? (
            <Link href={buttonHref} className="mt-4 inline-flex w-fit rounded-xl border px-4 py-2 text-sm font-medium">
              {buttonLabel}
            </Link>
          ) : null}
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white/30">
          <div className="relative h-full min-h-[320px] w-full">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={heading}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm opacity-60">Tidak ada gambar</div>
            )}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}


export function SocialSection({ links }: { links: Array<{ iconKey: string; href: string }> }) {
  return (
    <SectionShell title="Sosial">
      <div className="flex flex-wrap gap-3">
        {links.map((l) => (
          <Link
            key={`${l.iconKey}-${l.href}`}
            href={l.href}
            className="inline-flex items-center justify-center rounded-xl border p-2"
            aria-label={l.iconKey}
          >
            <SocialIcon iconKey={l.iconKey} />
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}

export function BranchesSection({
  branches,
  layout,
}: {
  branches: Array<{ id: number; name: string; address: string }>;
  layout: "carousel" | "grid";
}) {
  return (
    <SectionShell title="Cabang">
      <div className={layout === "carousel" ? "flex gap-4 overflow-x-auto pb-2" : "grid gap-4 md:grid-cols-2"}>
        {branches.map((b) => (
          <div key={b.id} className="min-w-[260px] rounded-2xl border p-4">
            <div className="text-sm font-semibold">{b.name}</div>
            <div className="mt-1 text-xs opacity-80">{b.address}</div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

export function ContactSection({
  contacts,
  primaryOnly,
}: {
  contacts: Array<{ id: number; label: string; value: string }>;
  primaryOnly: boolean;
}) {
  const show = primaryOnly ? contacts.slice(0, 1) : contacts;

  return (
    <SectionShell title="Kontak">
      <div className="grid gap-3">
        {show.map((c) => (
          <a
            key={c.id}
            href={c.value.startsWith("http") ? c.value : `tel:${c.value}`}
            className="rounded-2xl border p-4"
          >
            <div className="text-sm font-semibold">{c.label}</div>
            <div className="mt-1 text-xs opacity-80">{c.value}</div>
          </a>
        ))}
      </div>
    </SectionShell>
  );
}

export function GallerySection({
  images,
  layout,
}: {
  images: Array<{ id: number; url: string; title?: string | null }>;
  layout: "grid" | "masonry";
}) {
  const cls = layout === "masonry" ? "columns-2 gap-4 md:columns-3" : "grid gap-4 md:grid-cols-3";

  return (
    <SectionShell title="Galeri">
      <div className={cls}>
        {images.map((img) => (
          <div
            key={img.id}
            className={
              layout === "masonry"
                ? "mb-4 break-inside-avoid overflow-hidden rounded-2xl border"
                : "overflow-hidden rounded-2xl border"
            }
          >
            <div className="relative aspect-[4/3] bg-white/30">
              <Image src={img.url} alt={img.title || "Galeri"} fill className="object-cover" />
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

export function RoomCategorySection({
  cards,
}: {
  cards: Array<{ key: string; title: string; href: string; imageUrl?: string | null }>;
}) {
  return (
    <SectionShell title="Ruangan">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.key} href={c.href} className="overflow-hidden rounded-2xl border">
            <div className="relative aspect-[4/3] bg-white/30">
              {c.imageUrl ? (
                <Image src={c.imageUrl} alt={c.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm opacity-60">{c.title}</div>
              )}
            </div>
            <div className="p-3 text-sm font-medium">{c.title}</div>
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}

export function HighlightCollectionSection({
  title,
  mode,
  items,
}: {
  title?: string | null;
  mode: "products" | "categories";
  items: Array<{ id: number; name: string; href: string }>;
}) {
  return (
    <SectionShell title={title || "Koleksi Pilihan"}>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((it) => (
          <Link key={it.id} href={it.href} className="rounded-2xl border p-4">
            <div className="text-sm font-semibold">{it.name}</div>
            <div className="mt-1 text-xs opacity-70">{mode === "products" ? "Produk" : "Kategori"}</div>
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}
