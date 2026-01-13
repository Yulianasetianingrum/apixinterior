import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  HomepageSectionType,
  SectionRow,
  createDraftSection,
  deleteDraftSection,
  getSections,
  reorderDraftSections,
  updateDraftSection,
  clearPublishedAndCopyDraft,
  normalizeConfig,
} from "@/lib/homepage-sections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApiAction =
  | "bootstrap"
  | "create"
  | "update"
  | "delete"
  | "reorder"
  | "publish";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function isObject(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

async function validateRefs(type: HomepageSectionType, rawConfig: unknown) {
  const cfg = normalizeConfig(type, rawConfig);

  // Collect ids
  const imageIds: number[] = [];
  const productIds: number[] = [];
  const kategoriIds: number[] = [];
  const hubungiIds: number[] = [];
  const branchIds: number[] = [];

  if (type === "HERO") {
    if (typeof cfg?.imageId === "number") imageIds.push(cfg.imageId);
  }

  if (type === "CUSTOM_PROMO") {
    if (typeof cfg?.imageId === "number") imageIds.push(cfg.imageId);
  }

  if (type === "CATEGORY_GRID") {
    const items = Array.isArray(cfg?.items) ? cfg.items : [];
    for (const it of items) {
      if (typeof it?.kategoriId === "number") kategoriIds.push(it.kategoriId);
      if (typeof it?.coverImageId === "number") imageIds.push(it.coverImageId);
    }
    const cols = Number(cfg?.layout?.columns ?? 3);
    if (cols < 2 || cols > 6) {
      return { ok: false, error: "CATEGORY_GRID.layout.columns harus 2-6." };
    }
  }

  if (type === "CATEGORY_GRID_COMMERCE") {
    const items = Array.isArray(cfg?.items) ? cfg.items : [];
    const kategoriSet = new Set<number>();
    const slugSet = new Set<string>();

    for (const it of items) {
      if (typeof it?.kategoriId === "number") {
        const id = Number(it.kategoriId);
        if (kategoriSet.has(id)) {
          return { ok: false, error: "CATEGORY_GRID_COMMERCE tidak boleh ada kategori duplikat." };
        }
        kategoriSet.add(id);
        kategoriIds.push(id);
      }

      const slug = String(it?.slug ?? "").trim();
      if (!slug) {
        return { ok: false, error: "CATEGORY_GRID_COMMERCE.slug wajib diisi untuk setiap item." };
      }
      if (slugSet.has(slug)) {
        return { ok: false, error: "CATEGORY_GRID_COMMERCE.slug harus unik." };
      }
      slugSet.add(slug);

      if (typeof it?.imageId === "number") imageIds.push(it.imageId);
    }

    if (items.length < 8) {
      return { ok: false, error: "CATEGORY_GRID_COMMERCE minimal 8 item." };
    }
    if (items.length > 16) {
      return { ok: false, error: "CATEGORY_GRID_COMMERCE maksimal 16 item." };
    }
  }

  if (type === "PRODUCT_CAROUSEL") {
    const ids = Array.isArray(cfg?.productIds) ? cfg.productIds : [];
    for (const id of ids) if (typeof id === "number") productIds.push(id);
  }

  if (type === "GALLERY") {
    const ids = Array.isArray(cfg?.imageIds) ? cfg.imageIds : [];
    for (const id of ids) if (typeof id === "number") imageIds.push(id);
  }

  if (type === "ROOM_CATEGORY") {
    const cards = Array.isArray(cfg?.cards) ? cfg.cards : [];
    if (cards.length !== 3) {
      return { ok: false, error: "ROOM_CATEGORY.cards harus selalu 3 item." };
    }
    for (const c of cards) {
      if (typeof c?.kategoriId === "number") kategoriIds.push(c.kategoriId);
      if (typeof c?.imageId === "number") imageIds.push(c.imageId);
    }
  }

  if (type === "HIGHLIGHT_COLLECTION") {
    if (cfg?.mode === "categories") {
      const ids = Array.isArray(cfg?.categoryIds) ? cfg.categoryIds : [];
      for (const id of ids) if (typeof id === "number") kategoriIds.push(id);
    } else {
      const ids = Array.isArray(cfg?.productIds) ? cfg.productIds : [];
      for (const id of ids) if (typeof id === "number") productIds.push(id);
    }
  }

  if (type === "CONTACT") {
    const ids = Array.isArray(cfg?.hubungiIds) ? cfg.hubungiIds : [];
    for (const id of ids) if (typeof id === "number") hubungiIds.push(id);
  }

  if (type === "BRANCHES") {
    const ids = Array.isArray(cfg?.branchIds) ? cfg.branchIds : [];
    for (const id of ids) if (typeof id === "number") branchIds.push(id);
  }

  if (type === "SOCIAL") {
    // Only validate iconKey existence against media_sosial (optional but useful)
    const selected = Array.isArray(cfg?.selected) ? cfg.selected : [];
    const keys = selected.map((s: any) => String(s?.iconKey ?? "").toLowerCase()).filter(Boolean);
    if (keys.length) {
      const rows = await prisma.mediaSosial.findMany({
        where: { iconKey: { in: keys } },
        select: { iconKey: true },
      });
      const exists = new Set(rows.map((r: any) => String(r.iconKey).toLowerCase()));
      const missing = keys.filter((k: any) => !exists.has(k));
      if (missing.length) {
        return { ok: false, error: `SOCIAL.selected ada iconKey yang tidak ditemukan di media_sosial: ${missing.join(", ")}` };
      }
    }
  }

  // Check DB existence for referenced IDs
  const errors: string[] = [];

  if (imageIds.length) {
    const rows = await prisma.gambarUpload.findMany({ where: { id: { in: imageIds } }, select: { id: true } });
    const exists = new Set(rows.map((r: any) => r.id));
    const missing = imageIds.filter((id) => !exists.has(id));
    if (missing.length) errors.push(`Gambar (gambar_upload) tidak ditemukan: ${missing.join(", ")}`);
  }

  if (productIds.length) {
    const rows = await prisma.produk.findMany({ where: { id: { in: productIds } }, select: { id: true } });
    const exists = new Set(rows.map((r: any) => r.id));
    const missing = productIds.filter((id) => !exists.has(id));
    if (missing.length) errors.push(`Produk tidak ditemukan: ${missing.join(", ")}`);
  }

  if (kategoriIds.length) {
    const rows = await prisma.kategoriProduk.findMany({ where: { id: { in: kategoriIds } }, select: { id: true } });
    const exists = new Set(rows.map((r: any) => r.id));
    const missing = kategoriIds.filter((id) => !exists.has(id));
    if (missing.length) errors.push(`Kategori tidak ditemukan: ${missing.join(", ")}`);
  }

  if (hubungiIds.length) {
    const rows = await prisma.hubungi.findMany({ where: { id: { in: hubungiIds } }, select: { id: true } });
    const exists = new Set(rows.map((r: any) => r.id));
    const missing = hubungiIds.filter((id) => !exists.has(id));
    if (missing.length) errors.push(`Hubungi tidak ditemukan: ${missing.join(", ")}`);
  }

  if (branchIds.length) {
    const rows = await prisma.cabangToko.findMany({ where: { id: { in: branchIds } }, select: { id: true } });
    const exists = new Set(rows.map((r: any) => r.id));
    const missing = branchIds.filter((id) => !exists.has(id));
    if (missing.length) errors.push(`Cabang toko tidak ditemukan: ${missing.join(", ")}`);
  }

  if (errors.length) return { ok: false, error: errors.join(" | ") };
  return { ok: true, config: cfg };
}

function defaultConfig(type: HomepageSectionType) {
  switch (type) {
    case "HERO":
      return { headline: "Apix Interior", subheadline: "", ctaLabel: "Lihat Katalog", ctaHref: "/kategori", imageId: 0 };
    case "CATEGORY_GRID":
      return { layout: { columns: 3, maxItems: 6 }, items: [] };
    case "CATEGORY_GRID_COMMERCE":
      return {
        layout: { columns: 4, tabletColumns: 3, mobileColumns: 2, maxItems: 16 },
        items: [],
      };
    case "PRODUCT_CAROUSEL":
      return { title: "Produk Pilihan", productIds: [], showPrice: true, showCta: true };
    case "CUSTOM_PROMO":
      return { title: "Promo", subtitle: "", buttonLabel: "", buttonHref: "", imageId: 0 };
    case "SOCIAL":
      return { selected: [], display: { iconsOnly: true } };
    case "BRANCHES":
      return { branchIds: [], layout: "carousel" };
    case "CONTACT":
      return { hubungiIds: [], primaryOnly: false };
    case "GALLERY":
      return { imageIds: [], layout: "grid" };
    case "ROOM_CATEGORY":
      return {
        cards: [
          { key: "ruang_keluarga_tamu", title: "Ruang Keluarga & Tamu", kategoriId: 0, imageId: 0 },
          { key: "ruang_makan_dapur", title: "Ruang Makan & Dapur", kategoriId: 0, imageId: 0 },
          { key: "kamar_tidur", title: "Kamar Tidur", kategoriId: 0, imageId: 0 },
        ],
      };
    case "HIGHLIGHT_COLLECTION":
      return { mode: "products", title: "Koleksi Pilihan", productIds: [] };
    default:
      return {};
  }
}

export async function GET() {
  try {
    const [draft, images, produk, kategori, hubungi, cabang, medsos] = await Promise.all([
      getSections("draft"),
      prisma.gambarUpload.findMany({ select: { id: true, url: true, title: true }, orderBy: { id: "desc" }, take: 200 }),
      prisma.produk.findMany({ select: { id: true, nama: true, slug: true, harga: true, promoAktif: true, promoTipe: true, promoValue: true }, orderBy: { id: "desc" }, take: 300 }),
      prisma.kategoriProduk.findMany({ select: { id: true, nama: true }, orderBy: { id: "desc" }, take: 300 }),
      prisma.hubungi.findMany({ select: { id: true, nomor: true, prioritas: true }, orderBy: { id: "desc" }, take: 200 }),
      prisma.cabangToko.findMany({ select: { id: true, namaCabang: true, mapsUrl: true }, orderBy: { id: "desc" }, take: 200 }),
      prisma.mediaSosial.findMany({ select: { id: true, nama: true, iconKey: true, url: true }, orderBy: { id: "desc" }, take: 200 }),
    ]);


    // ---- hitung harga final promo utk master produk (biar UI toko/detail bisa pakai harga terbaru) ----
    const produkWithPromo = produk.map((p: any) => {
      const hargaAsli = Math.round(Number(p.harga ?? 0) || 0);
      const aktif = !!p.promoAktif;
      const tipe = (p.promoTipe ?? null) as "persen" | "nominal" | null;
      const valueRaw = Math.round(Number(p.promoValue ?? 0) || 0);

      if (!aktif || !tipe || valueRaw <= 0 || hargaAsli <= 0) {
        return { ...p, hargaAsli, hargaFinal: hargaAsli, isPromo: false, promoLabel: "" };
      }

      let diskon = 0;
      if (tipe === "persen") {
        const pct = Math.max(0, Math.min(100, valueRaw));
        diskon = Math.round((pct / 100) * hargaAsli);
      } else {
        diskon = Math.max(0, Math.min(hargaAsli, valueRaw));
      }

      const hargaFinal = Math.max(0, hargaAsli - diskon);
      if (diskon <= 0 || hargaFinal >= hargaAsli) {
        return { ...p, hargaAsli, hargaFinal: hargaAsli, isPromo: false, promoLabel: "" };
      }

      const promoLabel =
        tipe === "persen" ? `-${Math.max(0, Math.min(100, valueRaw))}%` : `-Rp ${diskon.toLocaleString("id-ID")}`;

      return { ...p, hargaAsli, hargaFinal, isPromo: true, promoLabel };
    });

    return json({
      ok: true,
      draft,
      master: { images, produk: produkWithPromo, kategori, hubungi, cabang, medsos },
    });
  } catch (e: any) {
    return json({ ok: false, error: e?.message ?? "Gagal bootstrap." }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action: ApiAction = body?.action;

    if (!action) return json({ ok: false, error: "action wajib." }, 400);

    if (action === "create") {
      const type = body?.type as HomepageSectionType;
      if (!type) return json({ ok: false, error: "type wajib." }, 400);

      const draft = await getSections("draft");
      const nextSort = draft.length ? Math.max(...draft.map((s) => s.sortOrder)) + 1 : 1;

      const id = await createDraftSection({
        type,
        title: body?.title ?? null,
        slug: body?.slug ?? null,
        enabled: true,
        sortOrder: nextSort,
        config: defaultConfig(type),
      });

      const fresh = await getSections("draft");
      return json({ ok: true, id, draft: fresh });
    }

    if (action === "update") {
      const id = Number(body?.id);
      if (!id) return json({ ok: false, error: "id wajib." }, 400);

      const patch = body?.patch ?? {};
      if (!isObject(patch)) return json({ ok: false, error: "patch harus object." }, 400);

      // Validate config refs if config present
      if (patch.type || patch.config) {
        const current = (await getSections("draft")).find((s) => s.id === id);
        const type = (patch.type ?? current?.type) as HomepageSectionType;
        const cfgToValidate = patch.config ?? current?.config ?? {};
        const v = await validateRefs(type, cfgToValidate);
        if (!v.ok) return json({ ok: false, error: v.error }, 400);

        patch.config = v.config;
      }

      await updateDraftSection(id, patch);

      const fresh = await getSections("draft");
      return json({ ok: true, draft: fresh });
    }

    if (action === "delete") {
      const id = Number(body?.id);
      if (!id) return json({ ok: false, error: "id wajib." }, 400);
      await deleteDraftSection(id);
      const fresh = await getSections("draft");
      return json({ ok: true, draft: fresh });
    }

    if (action === "reorder") {
      const ids: number[] = Array.isArray(body?.ids) ? body.ids.map(Number).filter(Boolean) : [];
      if (!ids.length) return json({ ok: false, error: "ids wajib (array)." }, 400);
      await reorderDraftSections(ids);
      const fresh = await getSections("draft");
      return json({ ok: true, draft: fresh });
    }

    if (action === "publish") {
      await clearPublishedAndCopyDraft();
      return json({ ok: true });
    }

    return json({ ok: false, error: "action tidak dikenal." }, 400);
  } catch (e: any) {
    return json({ ok: false, error: e?.message ?? "Gagal memproses request." }, 500);
  }
}
