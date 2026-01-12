// app/api/admin/admin_dashboard/admin_produk/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

// sharp butuh Node.js runtime (bukan Edge)
export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

function safeBaseName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function saveOptimizedWebpToUploads(
  file: File,
  opts?: { maxWidth?: number; quality?: number; baseName?: string }
) {
  if (!file.type?.startsWith("image/")) {
    throw new Error("File yang diupload harus berupa gambar.");
  }

  await ensureUploadDir();

  const maxWidth = opts?.maxWidth ?? 1600; // aman buat detail page; next/image bisa downscale
  const quality = opts?.quality ?? 80;
  const base = safeBaseName(opts?.baseName || file.name || "image") || "image";
  const key = randomUUID();
  const filename = `${base}-${key}-${maxWidth}.webp`;
  const outAbs = path.join(UPLOAD_DIR, filename);

  const buf = Buffer.from(await file.arrayBuffer());

  // rotate() supaya EXIF orientation bener, resize buat ngecilin payload, webp buat lebih ringan
  await sharp(buf)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toFile(outAbs);

  // url publik
  return `/uploads/${filename}`;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

  for (let idx = 0; idx < vars.length; idx++) {
    const v = vars[idx] || {};
    const harga = toIntOrNull(v.price);
    const promo = normalizePromoState(v.promo);
    const imageId = toIntOrNull(v?.image?.kolaseId);
    const galeriIds =
      Array.isArray(v.gallery) && v.gallery.length
        ? v.gallery
          .map((g: any) => toIntOrNull(g?.id))
          .filter((n): n is number => Number.isFinite(n as number))
        : [];

    if (imageId) collectedImageIds.add(imageId);
    galeriIds.forEach((gid) => collectedImageIds.add(gid));

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
      const img1 = toIntOrNull((l1 as any)?.image?.kolaseId ?? (l1 as any)?.imageId);
      if (img1) collectedImageIds.add(img1);
      const c1 = await tx.variasiKombinasi.create({
        data: {
          variasiProduk: { connect: { id: createdVar.id } },
          level: 1,
          nama: lv1Title,
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
        const img2 = toIntOrNull((l2 as any)?.image?.kolaseId ?? (l2 as any)?.imageId);
        if (img2) collectedImageIds.add(img2);
        await tx.variasiKombinasi.create({
          data: {
            variasiProduk: { connect: { id: createdVar.id } },
            level: 2,
            nama: lv2Title,
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
          const img3 = toIntOrNull((l3 as any)?.image?.kolaseId ?? (l3 as any)?.imageId);
          if (img3) collectedImageIds.add(img3);
          await tx.variasiKombinasi.create({
            data: {
              variasiProduk: { connect: { id: createdVar.id } },
              level: 3,
              nama: lv3Title,
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
async function generateUniqueSlugForCreate(baseText: string) {
  const base = slugify(baseText || "") || "produk";
  let slug = base;
  let counter = 1;

  while (true) {
    const exists = await prisma.produk.findFirst({
      where: { slug },
      select: { id: true },
    });

    if (!exists) return slug;
    slug = `${base}-${counter++}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const fotoMode = String(formData.get("fotoMode") || "kolase");

    // --------- IDENTITAS ---------
    const nama = String(formData.get("nama") || "").trim();
    if (!nama) {
      return NextResponse.json({ error: "Nama produk wajib diisi." }, { status: 400 });
    }

    const slugInput = String(formData.get("slug") || "").trim();
    const finalSlug = await generateUniqueSlugForCreate(slugInput || nama);

    const kategori = String(formData.get("kategori") || "").trim();
    const subkategori = String(formData.get("subkategori") || "").trim();

    // --------- HARGA & PROMO ---------
    const harga = parseNumber(formData.get("harga"), 0);
    if (!Number.isFinite(harga) || harga <= 0) {
      return NextResponse.json({ error: "Harga wajib diisi (minimal 1)." }, { status: 400 });
    }

    const promoAktif = parseBool(formData.get("promoAktif"));
    const promoTipeRaw = String(formData.get("promoTipe") || "").toLowerCase();
    const promoTipe =
      promoAktif && (promoTipeRaw === "persen" || promoTipeRaw === "nominal")
        ? promoTipeRaw
        : null;

    let promoValueInt = promoAktif ? parseNumber(formData.get("promoValue"), 0) : 0;
    if (promoTipe === "persen") promoValueInt = Math.max(0, Math.min(100, promoValueInt));
    const promoValue = promoAktif && promoTipe && promoValueInt > 0 ? promoValueInt : null;

    const hargaTipe = String(formData.get("hargaTipe") || "tetap");

    const tipeOrder = String(formData.get("tipeOrder") || "ready");
    const estimasiPengerjaan = String(formData.get("estimasiPengerjaan") || "").trim();

    const isCustom = parseBool(formData.get("isCustom"));
    const bisaCustomUkuran = parseBool(formData.get("bisaCustomUkuran"));
    const jasaPasangRaw = String(formData.get("jasaPasang") || "").trim();
    const jasaPasang = jasaPasangRaw ? jasaPasangRaw : null;

    // Variasi & Kombinasi (opsional)
    const variasiEnabled = String(formData.get("variasiEnabled") || "0") === "1";
    const variasiJsonRaw = String(formData.get("variasiJson") || "").trim();

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

    // ================== HANDLE MEDIA (WAJIB) ==================
    let mainImageId: number | null = null;
    let galleryIds: number[] = [];

    if (fotoMode === "upload") {
      const mainFile = formData.get("fotoUtamaUpload") as File | null;
      const galleryFiles = formData.getAll("galeriUpload") as File[];

      if (!mainFile) {
        return NextResponse.json(
          { error: "Mohon pilih foto utama terlebih dahulu." },
          { status: 400 }
        );
      }

      const mainUrl = await saveOptimizedWebpToUploads(mainFile, {
        maxWidth: 1600,
        quality: 80,
        baseName: nama || "produk",
      });

      const mainKolase = await prisma.gambarUpload.create({
        data: {
          url: mainUrl,
          title: nama || null,
          tags: tags || "",
          categoryId,
          subcategoryId,
        },
      });

      mainImageId = mainKolase.id;

      const galleryIdsArr: number[] = [];
      for (const file of galleryFiles.slice(0, 4)) {
        const url = await saveOptimizedWebpToUploads(file, {
          maxWidth: 1600,
          quality: 80,
          baseName: nama || "produk",
        });

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

      galleryIds = galleryIdsArr;
    } else {
      // kolase
      const kolaseMainId = Number(formData.get("kolaseMainId") || 0);
      if (!Number.isFinite(kolaseMainId) || kolaseMainId <= 0) {
        return NextResponse.json({ error: "Pilih foto utama dari kolase." }, { status: 400 });
      }

      const kolaseGalleryIds = String(formData.get("kolaseGalleryIds") || "").trim();
      galleryIds = kolaseGalleryIds
        ? kolaseGalleryIds
          .split(",")
          .map((x) => Number(x.trim()))
          .filter((n) => Number.isFinite(n) && n > 0)
        : [];

      mainImageId = kolaseMainId;
    }

    const created = await prisma.produk.create({
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

        mainImageId,
        ...(galleryIds.length
          ? {
            galeri: {
              create: galleryIds.map((gid, idx) => ({
                gambarId: gid,
                urutan: idx,
              })),
            },
          }
          : {}),

        categoryId,
        subcategoryId,
      },
      select: { id: true, slug: true },
    });

    let varImageIds: Set<number> | undefined = undefined;
    if (variasiEnabled && variasiJsonRaw) {
      let payload: VariasiPayload | null = null;
      try {
        payload = JSON.parse(variasiJsonRaw) as VariasiPayload;
      } catch (e: any) {
        return NextResponse.json(
          { error: "Format variasiJson tidak valid", detail: e?.message },
          { status: 400 }
        );
      }

      varImageIds = await upsertVariasi(prisma, created.id, payload, false, harga);
    }

    // Tambahkan foto variasi/galeri/kombinasi ke produk galeri (tanpa duplikat)
    if (varImageIds && varImageIds.size) {
      const exists = new Set<number>();
      if (mainImageId) exists.add(mainImageId);
      galleryIds.forEach((id) => exists.add(id));

      const toInsert = [...varImageIds].filter((id) => !exists.has(id));
      if (toInsert.length) {
        await prisma.produkGaleri.createMany({
          data: toInsert.map((gid, idx) => ({
            produkId: created.id,
            gambarId: gid,
            urutan: galleryIds.length + idx,
          })),
        });
      }
    }

    return NextResponse.json({ ok: true, id: created.id, slug: created.slug }, { status: 201 });
  } catch (err: any) {
    console.error("[admin_produk][POST] error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal menambahkan produk." },
      { status: 500 }
    );

  }
}

export async function PUT(
  req: NextRequest
) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = Number(searchParams.get("id"));
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID produk tidak valid." }, { status: 400 });
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
    const hargaTipe = String(formData.get("hargaTipe") || "tetap");

    const tipeOrder = String(formData.get("tipeOrder") || "ready");
    const estimasiPengerjaan = String(formData.get("estimasiPengerjaan") || "").trim();

    const isCustom = parseBool(formData.get("isCustom"));
    const bisaCustomUkuran = parseBool(formData.get("bisaCustomUkuran"));
    const jasaPasangRaw = String(formData.get("jasaPasang") || "").trim();
    const jasaPasang = jasaPasangRaw ? jasaPasangRaw : null;

    // --------- VARIASI (OPSIONAL) ---------
    const variasiEnabled = String(formData.get("variasiEnabled") || "0") === "1";
    const variasiJsonRaw = String(formData.get("variasiJson") || "").trim();
    const variasiClear = String(formData.get("variasiClear") || "0") === "1";

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
      const mainFile = formData.get("fotoUtamaUpload") as File | null;
      const galleryFiles = formData.getAll("galeriUpload") as File[];

      // edit mode: kalau user gak pilih file baru, biarin media lama
      if (mainFile) {
        // Paksa format & size agar konsisten (admin boleh upload JPG/PNG sesuka hati)
        const mainUrl = await saveOptimizedWebpToUploads(mainFile, {
          maxWidth: 1600,
          quality: 80,
          baseName: nama || "produk",
        });

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

        const galleryIdsArr: number[] = [];
        for (const file of galleryFiles.slice(0, 4)) {
          const url = await saveOptimizedWebpToUploads(file, {
            maxWidth: 1600,
            quality: 80,
            baseName: nama || "produk",
          });

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
      await prisma.$transaction(async (tx) => {
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

    // ================== VARIASI & KOMBINASI (OPSIONAL) ==================
    let varImageIds: Set<number> | undefined = undefined;
    const shouldUpsert = (variasiEnabled || !!variasiJsonRaw) && !!variasiJsonRaw;

    if (!shouldUpsert || variasiClear) {
      // Hapus semua variasi jika dimatikan atau diminta clear
      await prisma.variasiProduk.deleteMany({ where: { produkId: id } });
    }

    if (shouldUpsert) {
      let payload: VariasiPayload | null = null;
      try {
        payload = JSON.parse(variasiJsonRaw) as VariasiPayload;
      } catch (e: any) {
        return NextResponse.json(
          { error: "Format variasiJson tidak valid", detail: e?.message },
          { status: 400 }
        );
      }

      varImageIds = await upsertVariasi(prisma, id, payload, true, harga);
    }

    // Tambahkan foto variasi/galeri/kombinasi ke produk galeri (tanpa duplikat)
    if (varImageIds && varImageIds.size) {
      const existingGaleri = await prisma.produkGaleri.findMany({
        where: { produkId: id },
        select: { gambarId: true, urutan: true },
        orderBy: { urutan: "asc" },
      });

      const exists = new Set<number>();
      const currentMain = nextMainImageId !== undefined ? nextMainImageId : existing.mainImageId;
      if (currentMain) exists.add(currentMain);
      existingGaleri.forEach((g) => exists.add(g.gambarId));

      const toInsert = [...varImageIds].filter((gid) => !exists.has(gid));
      if (toInsert.length) {
        const startUrutan = existingGaleri.length;
        await prisma.produkGaleri.createMany({
          data: toInsert.map((gid, idx) => ({
            produkId: id,
            gambarId: gid,
            urutan: startUrutan + idx,
          })),
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[admin_produk][PUT id] error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal mengupdate produk." },
      { status: 500 }
    );
  }
}
// force update
// force update
