import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const UPLOAD_SUBDIR = "uploads";
const UPLOAD_DIR = path.join(process.cwd(), "public", UPLOAD_SUBDIR);

// --- upload safety guards ---
const MAX_UPLOAD_MB = 10;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
// Sharp guard: batasi input pixels biar file super besar nggak bikin server ngos-ngosan
const MAX_INPUT_PIXELS = 40_000_000; // 40 MP


async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

function isImageFile(file: File) {
  return file && typeof file.type === "string" && file.type.startsWith("image/");
}

function httpError(status: number, message: string) {
  const e: any = new Error(message);
  e.status = status;
  return e;
}

function validateImageUpload(file: File, label = "Gambar") {
  if (!file || typeof (file as any).size !== "number") {
    throw httpError(400, `${label}: file tidak valid.`);
  }
  if (!isImageFile(file)) {
    throw httpError(400, `${label} harus berupa gambar.`);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw httpError(400, `${label} terlalu besar. Maks ${MAX_UPLOAD_MB}MB.`);
  }
}

/**
 * Admin boleh upload JPG/JPEG/PNG/apa pun → kita paksa simpan sebagai WebP (lebih ringan).
 * Output: relative path tanpa leading slash, contoh: "uploads/xxxx.webp"
 */
async function saveOptimizedWebpToUploads(file: File) {
  // Guard 1: size + mime basic (mime bisa dipalsuin, tapi tetap berguna buat UX)
  validateImageUpload(file, "Gambar");

  await ensureUploadDir();

  const arrayBuffer = await file.arrayBuffer();
  const input = Buffer.from(arrayBuffer);

  const key = randomUUID();
  const base = safeBaseName(file.name || "image") || "image";
  const filename = `${base}-${key}-1600.webp`;
  const outPath = path.join(UPLOAD_DIR, filename);

  // === Target ukuran file (KB) ===
  const TARGET_KB = 450;
  const targetBytes = TARGET_KB * 1024;

  try {
    const baseProc = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOnError: true })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true });

    const qualitySteps = [82, 80, 78, 76, 74, 72, 70];
    let outBuf: Buffer | null = null;

    for (const q of qualitySteps) {
      const buf = await baseProc
        .clone()
        .webp({ quality: q, effort: 6, smartSubsample: true })
        .toBuffer();

      outBuf = buf;
      if (buf.length <= targetBytes) break;
    }

    if (!outBuf) {
      outBuf = await baseProc
        .webp({ quality: 80, effort: 6, smartSubsample: true })
        .toBuffer();
    }

    await fs.writeFile(outPath, outBuf);
  } catch (err) {
    console.error("[saveOptimizedWebp] sharp error:", err);
    throw httpError(400, "Gambar tidak valid / terlalu besar untuk diproses.");
  }

  // Use the same format as tambah_produk/route.ts
  return `/api/img?f=${filename}`;
}

function safeBaseName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}


function normalizeFiles(list: unknown[]) {
  return list
    .filter((f): f is File => f instanceof File && (f as File).size > 0)
    .filter(isImageFile);
}


async function generateUniqueSlugForUpdate(
  baseText: string,
  currentId: number,
  currentSlug: string
) {
  const base = slugify(baseText || "") || currentSlug || "produk";
  // kalau sama persis dengan slug existing, biarin
  if (base === currentSlug) return currentSlug;

  let slug = base;
  let counter = 1;

  while (true) {
    const exists = await prisma.produk.findFirst({
      where: {
        slug,
        NOT: { id: currentId },
      },
      select: { id: true },
    });

    if (!exists) return slug;
    slug = `${base}-${counter++}`;
  }
}

async function findOrCreateCategoryAndSub(
  kategoriName: string | null,
  subkategoriName: string | null
) {
  let category: any = null;
  let subcategory: any = null;

  if (kategoriName && kategoriName.trim() !== "") {
    category = await prisma.category.findUnique({
      where: { name: kategoriName.trim() },
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: kategoriName.trim() },
      });
    }
  }

  if (subkategoriName && subkategoriName.trim() !== "") {
    if (!category) {
      // fallback kalau kategori kosong tapi subkategori ada
      category = await prisma.category.create({
        data: { name: "Furniture Rumah" },
      });
    }

    subcategory = await prisma.subcategory.findFirst({
      where: {
        name: subkategoriName.trim(),
        categoryId: category.id,
      },
    });

    if (!subcategory) {
      subcategory = await prisma.subcategory.create({
        data: {
          name: subkategoriName.trim(),
          categoryId: category.id,
        },
      });
    }
  }

  return {
    categoryId: category?.id ?? null,
    subcategoryId: subcategory?.id ?? null,
  };
}

function parseBool(v: FormDataEntryValue | null) {
  return v === "1" || v === "true" || v === "on";
}

function parseNumber(v: FormDataEntryValue | null, fallback = 0) {
  const n = Math.round(Number(v ?? fallback));
  return Number.isFinite(n) ? n : fallback;
}

function toIntOrNull(v: any): number | null {
  const n = Number(String(v ?? "").replace(/[^\d\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function normalizePromoState(p: any) {
  // Terima bentuk { active,type,value } atau { promoAktif,promoTipe,promoValue }.
  const rawActive = p?.active ?? p?.promoAktif;
  const rawType = p?.type ?? p?.promoTipe;
  const rawValue = p?.value ?? p?.promoValue;

  const t = typeof rawType === "string" ? rawType.toLowerCase() : null;
  const tipe =
    t === "nominal"
      ? "nominal"
      : t === "persen" || t === "percent"
        ? "persen"
        : null;
  const val = toIntOrNull(rawValue);

  const hasValue = val !== null && val > 0;
  const isActive = !!rawActive || (hasValue && !!tipe);

  return {
    promoAktif: isActive,
    promoTipe: isActive ? tipe : null,
    promoValue: isActive ? val : null,
  };
}

type VariasiState = {
  id?: string;
  label?: string;
  price?: string | number | null;
  unitOverride?: string | null;
  promo?: any;
  image?: { kolaseId?: number | string | null };
  gallery?: Array<{ id?: number }>;
  combos?: {
    lv1?: Array<{
      id?: string;
      label?: string;
      addPrice?: string | number | null;
      promo?: any;
      lv2?: Array<{
        id?: string;
        label?: string;
        addPrice?: string | number | null;
        promo?: any;
        lv3?: Array<{
          id?: string;
          label?: string;
          addPrice?: string | number | null;
          promo?: any;
        }>;
      }>;
    }>;
  };
};

type VariasiPayload = {
  enabled?: boolean;
  titles?: { lv1Title?: string; lv2Title?: string; lv3Title?: string };
  variations?: VariasiState[];
};

async function upsertVariasi(
  tx: typeof prisma,
  produkId: number,
  payload: VariasiPayload | null,
  clearExisting: boolean,
  baseHarga: number
) {
  if (clearExisting) {
    await tx.variasiProduk.deleteMany({ where: { produkId } });
  }
  if (!payload?.enabled) return;

  const vars = Array.isArray(payload.variations) ? payload.variations : [];
  if (!vars.length) return;

  const lv1Title = payload.titles?.lv1Title?.trim() || "Level 1";
  const lv2Title = payload.titles?.lv2Title?.trim() || "Level 2";
  const lv3Title = payload.titles?.lv3Title?.trim() || "Level 3";

  const collectedImageIds = new Set<number>();
  const imageExistCache = new Map<number, boolean>();
  const usedNamesByLevel: Record<number, Set<string>> = {
    1: new Set(),
    2: new Set(),
    3: new Set(),
  };
  const uniqueName = (level: number, base: string) => {
    const set = usedNamesByLevel[level] || new Set<string>();
    const clean = (base || "").trim() || `Lv${level}`;
    let name = clean;
    let i = 1;
    while (set.has(name)) {
      name = `${clean}__dedup${++i}`;
    }
    set.add(name);
    usedNamesByLevel[level] = set;
    return name;
  };
  const ensureImageId = async (rawId: number | null) => {
    if (!rawId || rawId <= 0) return null;
    if (imageExistCache.has(rawId)) {
      return imageExistCache.get(rawId) ? rawId : null;
    }
    const exists = await tx.gambarUpload.findUnique({
      where: { id: rawId },
      select: { id: true },
    });
    const ok = !!exists;
    imageExistCache.set(rawId, ok);
    return ok ? rawId : null;
  };

  for (let idx = 0; idx < vars.length; idx++) {
    const v = vars[idx] || {};
    const harga = toIntOrNull(v.price);
    const promo = normalizePromoState(v.promo);
    const imageIdRaw = toIntOrNull(v?.image?.kolaseId);
    const galeriIdsRaw =
      Array.isArray(v.gallery) && v.gallery.length
        ? v.gallery
          .map((g: any) => toIntOrNull(g?.id))
          .filter((n): n is number => Number.isFinite(n as number))
        : [];
    const imageId = await ensureImageId(imageIdRaw);
    const galeriIds: number[] = [];
    for (const gid of galeriIdsRaw) {
      const safe = await ensureImageId(gid);
      if (safe) {
        galeriIds.push(safe);
        collectedImageIds.add(safe);
      }
    }

    if (imageId) collectedImageIds.add(imageId);

    const createdVar = await tx.variasiProduk.create({
      data: {
        produk: { connect: { id: produkId } },
        nama: v.label || `Variasi ${idx + 1}`,
        harga: harga ?? baseHarga,
        priceMode: "UNIT",
        promoAktif: !!promo.promoAktif,
        promoTipe: promo.promoTipe,
        promoValue: promo.promoValue,
        mainImage: imageId ? { connect: { id: imageId } } : undefined,
        urutan: idx,
        options: {
          label: v.label || `Variasi ${idx + 1}`,
          price: v.price ?? "",
          unitOverride: v.unitOverride ?? "",
          promo: v.promo ?? {},
          image: v.image ?? {},
          gallery: v.gallery ?? [],
          combos: v.combos ?? {},
          titles: payload.titles ?? {},
        },
      },
    });

    if (galeriIds.length) {
      await tx.variasiGaleri.createMany({
        data: galeriIds.map((gid, i) => ({
          variasiProdukId: createdVar.id,
          gambarId: gid,
          urutan: i,
        })),
      });
    }

    const lv1List = Array.isArray(v.combos?.lv1) ? v.combos?.lv1 : [];
    for (let i1 = 0; i1 < lv1List.length; i1++) {
      const l1 = lv1List[i1];
      const add1 = toIntOrNull(l1?.addPrice);
      const promo1 = normalizePromoState((l1 as any)?.promo);
      const promo1On = !!promo1.promoAktif;
      const promo1Type = promo1On ? promo1.promoTipe : null;
      const promo1Val = promo1On ? promo1.promoValue : null;
      const img1 = await ensureImageId(
        toIntOrNull((l1 as any)?.image?.kolaseId ?? (l1 as any)?.imageId)
      );
      if (img1) collectedImageIds.add(img1);
      const nama1 = uniqueName(1, l1?.label || `Lv1-${i1 + 1}`);
      const c1 = await tx.variasiKombinasi.create({
        data: {
          variasiProduk: { connect: { id: createdVar.id } },
          level: 1,
          nama: nama1,
          nilai: l1?.label || `Lv1-${i1 + 1}`,
          tambahHarga: add1,
          promoAktif: promo1On,
          promoTipe: promo1Type,
          promoValue: promo1Val,
          image: img1 ? { connect: { id: img1 } } : undefined,
          urutan: i1,
        },
      });

      const lv2List = Array.isArray(l1?.lv2) ? l1.lv2 : [];
      for (let i2 = 0; i2 < lv2List.length; i2++) {
        const l2 = lv2List[i2];
        const add2 = toIntOrNull(l2?.addPrice);
        const promo2 = normalizePromoState((l2 as any)?.promo);
        const promo2On = !!promo2.promoAktif;
        const promo2Type = promo2On ? promo2.promoTipe : null;
        const promo2Val = promo2On ? promo2.promoValue : null;
        const img2 = await ensureImageId(
          toIntOrNull((l2 as any)?.image?.kolaseId ?? (l2 as any)?.imageId)
        );
        if (img2) collectedImageIds.add(img2);
        const nama2 = uniqueName(2, l2?.label || `Lv2-${i2 + 1}`);
        const c2 = await tx.variasiKombinasi.create({
          data: {
            variasiProduk: { connect: { id: createdVar.id } },
            level: 2,
            nama: nama2,
            nilai: l2?.label || `Lv2-${i2 + 1}`,
            tambahHarga: add2,
            promoAktif: promo2On,
            promoTipe: promo2Type,
            promoValue: promo2Val,
            image: img2 ? { connect: { id: img2 } } : undefined,
            urutan: i2,
          },
        });

        const lv3List = Array.isArray(l2?.lv3) ? l2.lv3 : [];
        for (let i3 = 0; i3 < lv3List.length; i3++) {
          const l3 = lv3List[i3];
          const add3 = toIntOrNull(l3?.addPrice);
          const promo3 = normalizePromoState((l3 as any)?.promo);
          const promo3On = !!promo3.promoAktif;
          const promo3Type = promo3On ? promo3.promoTipe : null;
          const promo3Val = promo3On ? promo3.promoValue : null;
          const img3 = await ensureImageId(
            toIntOrNull((l3 as any)?.image?.kolaseId ?? (l3 as any)?.imageId)
          );
          if (img3) collectedImageIds.add(img3);
          const nama3 = uniqueName(3, l3?.label || `Lv3-${i3 + 1}`);
          await tx.variasiKombinasi.create({
            data: {
              variasiProduk: { connect: { id: createdVar.id } },
              level: 3,
              nama: nama3,
              nilai: l3?.label || `Lv3-${i3 + 1}`,
              tambahHarga: add3,
              promoAktif: promo3On,
              promoTipe: promo3Type,
              promoValue: promo3Val,
              image: img3 ? { connect: { id: img3 } } : undefined,
              urutan: i3,
            },
          });
        }
      }
    }
  }

  return collectedImageIds;
}

async function parseId(
  req: NextRequest,
  paramsPromise: Promise<{ id: string }>
): Promise<{ id: number; raw: string }> {
  let raw = "";
  try {
    const params = await paramsPromise;
    raw = params?.id ?? "";
  } catch {
    raw = "";
  }

  if (!raw) {
    raw = req.nextUrl.pathname.split("/").filter(Boolean).pop() || "";
  }

  const id = Number(raw);
  return { id, raw };
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id, raw } = await parseId(req, ctx.params);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { error: "ID produk tidak valid.", received: raw },
        { status: 400 }
      );
    }

    const produk = await prisma.produk.findUnique({
      where: { id },
      include: {
        mainImage: { select: { id: true, url: true, title: true, tags: true } },
        galeri: {
          orderBy: { urutan: "asc" },
          include: { gambar: { select: { id: true, url: true, title: true, tags: true } } },
        },
        variasiProduk: {
          orderBy: { urutan: "asc" },
          include: {
            mainImage: { select: { id: true, url: true } },
            galeri: { orderBy: { urutan: "asc" }, select: { gambarId: true, gambar: { select: { url: true } }, urutan: true } },
            kombinasi: {
              orderBy: [{ level: "asc" }, { urutan: "asc" }],
              include: { image: { select: { id: true, url: true } } },
            },
          },
        },
      },
    });

    if (!produk) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }

    // Kumpulkan gambar dengan urutan: main dulu, lalu galeri pivot (urutan asc), hilangkan duplikat
    const images: any[] = [];
    const seen = new Set<number>();
    if (produk.mainImage && produk.mainImage.id && !seen.has(produk.mainImage.id)) {
      images.push(produk.mainImage);
      seen.add(produk.mainImage.id);
    }
    (produk.galeri || []).forEach((g: any) => {
      const img = g?.gambar;
      if (img && img.id && !seen.has(img.id)) {
        images.push(img);
        seen.add(img.id);
      }
    });

    const variasi = (produk.variasiProduk || []).map((v: any) => ({
      id: v.id,
      nama: v.nama,
      harga: v.harga,
      priceMode: v.priceMode,
      promoAktif: v.promoAktif,
      promoTipe: v.promoTipe,
      promoValue: v.promoValue,
      imageId: v.imageId,
      imageUrl: v.mainImage?.url ?? null,
      galleryIds: v.galeri?.map((g: any) => g.gambarId) ?? [],
      galleryUrls: v.galeri?.map((g: any) => g.gambar?.url ?? null).filter(Boolean) ?? [],
      combos: v.kombinasi?.map((k: any) => ({
        id: k.id,
        level: k.level,
        nama: k.nama,
        nilai: k.nilai,
        tambahHarga: k.tambahHarga,
        promoAktif: k.promoAktif,
        promoTipe: k.promoTipe,
        promoValue: k.promoValue,
        imageId: k.imageId,
        imageUrl: k.image?.url ?? null,
      })) ?? [],
      options: v.options ?? null,
    }));

    return NextResponse.json({ produk, images, variasi });
  } catch (err: any) {
    console.error("[admin_produk][GET id] error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal mengambil data produk." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id, raw } = await parseId(req, ctx.params);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { error: "ID produk tidak valid.", received: raw },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Partial update logic
    // Currently focused on Promo updates, but can be expanded
    const dataToUpdate: any = {};

    if (typeof body.promoAktif !== "undefined") {
      dataToUpdate.promoAktif = !!body.promoAktif;
    }
    if (typeof body.promoTipe !== "undefined") {
      dataToUpdate.promoTipe = body.promoTipe;
    }
    if (typeof body.promoValue !== "undefined") {
      dataToUpdate.promoValue = body.promoValue;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ message: "No fields to update" });
    }

    const updated = await prisma.produk.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, produk: updated });
  } catch (err: any) {
    console.error("[admin_produk][PATCH id] error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal update produk." },
      { status: 500 }
    );
  }
}


export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id, raw } = await parseId(req, ctx.params);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { error: "ID produk tidak valid.", received: raw },
        { status: 400 }
      );
    }

    const existing = await prisma.produk.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        mainImageId: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }

    const formData = await req.formData();

    // --------- MODE FOTO (upload / kolase) ---------
    const fotoMode = String(formData.get("fotoMode") || "kolase");

    // --------- FIELD WAJIB ---------
    const nama = String(formData.get("nama") || "").trim();
    if (!nama) {
      return NextResponse.json({ error: "Nama produk wajib diisi." }, { status: 400 });
    }

    const slugInput = String(formData.get("slug") || "").trim();
    const finalSlug = await generateUniqueSlugForUpdate(slugInput || nama, id, existing.slug);

    const kategori = String(formData.get("kategori") || "").trim();
    const subkategori = String(formData.get("subkategori") || "").trim();

    const harga = parseNumber(formData.get("harga"), 0);
    const variasiEnabled = String(formData.get("variasiEnabled") || "0") === "1";
    const variasiClear = String(formData.get("variasiClear") || "0") === "1";
    const variasiJsonRaw = String(formData.get("variasiJson") || "").trim();

    // --------- PROMO (OPSIONAL, integer-safe) ---------
    const promoAktif = parseBool(formData.get("promoAktif"));
    const promoTipeRaw = String(formData.get("promoTipe") || "").toLowerCase();
    const promoTipe =
      promoAktif && (promoTipeRaw === "persen" || promoTipeRaw === "nominal")
        ? promoTipeRaw
        : null;

    let promoValueInt = promoAktif ? parseNumber(formData.get("promoValue"), 0) : 0;
    if (promoTipe === "persen") promoValueInt = Math.max(0, Math.min(100, promoValueInt));
    const promoValue = promoAktif && promoTipe && promoValueInt > 0 ? promoValueInt : null;

    // --------- HARGA ---------
    const unitInput = String(formData.get("product_unit") || "").trim();
    const hargaTipeRaw = String(formData.get("hargaTipe") || "tetap");
    const hargaTipe = unitInput || hargaTipeRaw;

    const tipeOrder = String(formData.get("tipeOrder") || "ready");
    const estimasiPengerjaan = String(formData.get("estimasiPengerjaan") || "").trim();

    const isCustom = parseBool(formData.get("isCustom"));
    const bisaCustomUkuran = parseBool(formData.get("bisaCustomUkuran"));
    const jasaPasangRaw = String(formData.get("jasaPasang") || "").trim();
    const jasaPasang = jasaPasangRaw ? jasaPasangRaw : null;

    // --------- DESKRIPSI ---------
    const deskripsiSingkat = String(formData.get("deskripsiSingkat") || "").trim();
    const deskripsiLengkap = String(formData.get("deskripsiLengkap") || "").trim();

    // --------- SPESIFIKASI ---------
    const panjang = parseNumber(formData.get("panjang"), 0);
    const lebar = parseNumber(formData.get("lebar"), 0);
    const tinggi = parseNumber(formData.get("tinggi"), 0);
    const material = String(formData.get("material") || "").trim();
    const finishing = String(formData.get("finishing") || "").trim();
    const warna = String(formData.get("warna") || "").trim();
    const berat = parseNumber(formData.get("berat"), 0);
    const garansi = String(formData.get("garansi") || "").trim();

    // --------- LAINNYA ---------
    const catatanKhusus = String(formData.get("catatanKhusus") || "").trim();
    const tags = String(formData.get("tags") || "").trim();

    // --------- SEO (OPSIONAL) ---------
    const metaTitle = String(formData.get("metaTitle") || "").trim();
    const metaDescription = String(formData.get("metaDescription") || "").trim();

    // --------- kategori relasi (optional) ---------
    const { categoryId, subcategoryId } = await findOrCreateCategoryAndSub(
      kategori || null,
      subkategori || null
    );

    // ================== UPDATE PRODUK (TANPA MEDIA DULU) ==================
    await prisma.produk.update({
      where: { id },
      data: {
        nama,
        slug: finalSlug,
        kategori: kategori || null,
        subkategori: subkategori || null,

        harga,

        promoAktif,
        promoTipe,
        promoValue,

        hargaTipe,
        tipeOrder,
        estimasiPengerjaan: estimasiPengerjaan || null,

        deskripsiSingkat: deskripsiSingkat || null,
        deskripsiLengkap: deskripsiLengkap || null,

        panjang: panjang || 0,
        lebar: lebar || 0,
        tinggi: tinggi || 0,
        material: material || null,
        finishing: finishing || null,
        warna: warna || null,
        berat: berat || 0,
        garansi: garansi || null,

        isCustom,
        bisaCustomUkuran,
        jasaPasang,

        catatanKhusus: catatanKhusus || null,
        tags: tags || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,

        categoryId,
        subcategoryId,
      },
    });

    // ================== HANDLE MEDIA (OPSIONAL) ==================
    let nextMainImageId: number | null | undefined = undefined;
    let nextGalleryIds: number[] | undefined = undefined;

    if (fotoMode === "upload") {
      const mainFileRaw = formData.get("fotoUtamaUpload");
      const galleryFilesRaw = formData.getAll("galeriUpload");

      const mainFile = mainFileRaw instanceof File && mainFileRaw.size > 0 ? mainFileRaw : null;
      const galleryFiles = normalizeFiles(galleryFilesRaw).slice(0, 4);

      // Guard: batas ukuran file & validasi gambar (anti file aneh/DoS)
      if (mainFile) validateImageUpload(mainFile, "Foto utama");
      for (const gf of galleryFiles) validateImageUpload(gf, "Foto galeri");

      // edit mode:
      // - kalau user gak pilih foto utama baru, biarin main image lama
      // - kalau user upload galeri baru, update galeri meski main image tidak diganti
      if (mainFile) {
        const mainUrl = await saveOptimizedWebpToUploads(mainFile);

        const mainKolase = await prisma.gambarUpload.create({
          data: {
            url: mainUrl,
            title: nama || null,
            tags: tags || "",
            categoryId,
            subcategoryId,
          },
        });

        nextMainImageId = mainKolase.id;
      }

      if (galleryFiles.length) {
        const galleryIdsArr: number[] = [];
        for (const file of galleryFiles) {
          const url = await saveOptimizedWebpToUploads(file);

          const galeri = await prisma.gambarUpload.create({
            data: {
              url,
              title: nama || null,
              tags: tags || "",
              categoryId,
              subcategoryId,
            },
          });

          galleryIdsArr.push(galeri.id);
        }

        nextGalleryIds = galleryIdsArr;
      }
    } else {
      // kolase
      const kolaseMainId = Number(formData.get("kolaseMainId") || 0);
      if (!Number.isFinite(kolaseMainId) || kolaseMainId <= 0) {
        return NextResponse.json(
          { error: "Pilih foto utama dari kolase." },
          { status: 400 }
        );
      }

      const kolaseGalleryIds = String(formData.get("kolaseGalleryIds") || "").trim();
      const galleryIds = kolaseGalleryIds
        ? kolaseGalleryIds
          .split(",")
          .map((x) => Number(x.trim()))
          .filter((n) => Number.isFinite(n) && n > 0)
        : [];

      nextMainImageId = kolaseMainId;
      nextGalleryIds = galleryIds;
    }

    // update media kalau ada perubahan yang dihitung
    if (nextMainImageId !== undefined || nextGalleryIds !== undefined) {
      await prisma.$transaction(async (tx: any) => {
        if (nextMainImageId !== undefined) {
          await tx.produk.update({
            where: { id },
            data: { mainImageId: nextMainImageId },
          });
        }

        if (nextGalleryIds !== undefined) {
          await tx.produkGaleri.deleteMany({ where: { produkId: id } });
          if (nextGalleryIds.length) {
            await tx.produkGaleri.createMany({
              data: nextGalleryIds.map((gid, idx) => ({
                produkId: id,
                gambarId: gid,
                urutan: idx,
              })),
            });
          }
        }
      });
    }

    // ================== HANDLE VARIASI & KOMBINASI ==================
    let variasiPayload: VariasiPayload | null = null;
    if (variasiJsonRaw) {
      try {
        variasiPayload = JSON.parse(variasiJsonRaw) as VariasiPayload;
      } catch (e: any) {
        return NextResponse.json(
          { error: "Format variasiJson tidak valid", detail: e?.message },
          { status: 400 }
        );
      }
    }

    let varImageIds: Set<number> | undefined = undefined;
    const shouldUpsert = (variasiEnabled || !!variasiPayload) && !!variasiPayload;

    if (!shouldUpsert && variasiClear) {
      await prisma.variasiProduk.deleteMany({ where: { produkId: id } });
    }

    if (shouldUpsert) {
      varImageIds = await upsertVariasi(prisma, id, variasiPayload, true, harga);
    }

    // tambahkan foto variasi/galeri/kombinasi ke produk galeri (tanpa duplikat)
    if (varImageIds && varImageIds.size) {
      const existingGaleri = await prisma.produkGaleri.findMany({
        where: { produkId: id },
        orderBy: { urutan: "asc" },
        select: { gambarId: true },
      });

      const exists = new Set<number>();
      const mainIdNow =
        nextMainImageId !== undefined
          ? nextMainImageId
          : existing?.mainImageId ?? null;
      if (mainIdNow) exists.add(mainIdNow);

      const gallerySet =
        nextGalleryIds !== undefined
          ? new Set(nextGalleryIds)
          : new Set(existingGaleri.map((g: any) => g.gambarId));
      gallerySet.forEach((id: any) => exists.add(Number(id)));

      const toInsert = [...varImageIds].filter((id) => !exists.has(id));
      if (toInsert.length) {
        const baseUrutan =
          nextGalleryIds !== undefined
            ? nextGalleryIds.length
            : existingGaleri.length;
        await prisma.produkGaleri.createMany({
          data: toInsert.map((gid, idx) => ({
            produkId: id,
            gambarId: gid,
            urutan: baseUrutan + idx,
          })),
        });
      }
    }

    revalidatePath("/produk");
    // Gunakan slug baru jika ada, atau slug lama
    // Kita invalidate global list juga
    revalidatePath("/admin/admin_dashboard/admin_produk/daftar_produk");

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[admin_produk][PUT id] error:", err);
    const status = Number.isFinite(err?.status) ? err.status : 500;
    return NextResponse.json(
      { error: err?.message || "Gagal mengupdate produk." },
      { status }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // Lebih robust: kadang params.id bisa aneh/undefined, jadi fallback ke path URL
    const params = await ctx.params;
    const rawFromParams = params?.id ?? "";
    const url = new URL(req.url);
    const rawFromPath = url.pathname.split("/").filter(Boolean).pop() ?? "";
    const raw = String(rawFromParams || rawFromPath).trim();

    // Ambil digit saja (jaga-jaga ada query/karakter lain)
    const m = raw.match(/\d+/);
    const id = m ? Number(m[0]) : NaN;

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { error: "ID tidak valid", rawId: raw },
        { status: 400 }
      );
    }

    // Hapus relasi item kategori-produk jika ada (untuk menghindari constraint error)
    try {
      await prisma.kategoriProdukItem.deleteMany({ where: { produkId: id } });
    } catch { }

    await prisma.produk.delete({ where: { id } });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Gagal menghapus produk" },
      { status: 500 }
    );
  }
}
