// app/api/admin/admin_dashboard/admin_produk/kategori_produk/ai/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";


type LanguageMode = "ID" | "EN";

type ProductLite = {
  id: number;
  nama: string;
  kategori?: string | null;
  subkategori?: string | null;
  deskripsiSingkat?: string | null;
  tags?: string | null;
  hargaAsli?: number | null;
  hargaFinal?: number | null;
  harga?: number | null;
};

type Features = {
  typeKey: string | null;
  roomKey: string | null;
  funcKey: string | null;
  materialKey: string | null;
  styleKey: string | null;
  colorKey: string | null;
  priceKey: string | null;
  discountKey: string | null;
  isCustomKey: string | null;
};

type ItemWithFeat = {
  p: ProductLite;
  f: Features;
  confidence: number;
  norm: string;
};

type CategorySuggestion = {
  nama: string;
  produkIds: number[];
  alasan?: string;
  // SEO helpers (optional): richer title/slug/keywords for category page
  seoTitle?: string;
  seoH1?: string;
  seoSlug?: string;
  seoKeywords?: string[];
  seoDescription?: string;
};

type ResponseShape = {
  categories: CategorySuggestion[];
  reviewProdukIds: number[];
  unassignedProdukIds: number[];
  warnings?: string[];
  diagnostics?: any;
  catatan?: string | null;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

// ========= 1) Normalisasi teks (sesuai rules Apix) =========
const NOISE_WORDS = new Set([
  "promo","diskon","sale","best","terlaris","viral","new","original","premium","murah","gratis","cashback",
  "bestseller","trending","hot","limited","terbaru","ready",
  "apix","produk","product","barang","item",
  "paket","bundle",
]);

function shouldKeepSet(norm: string) {
  // "set" dibuang kecuali konteks interior yang dianggap nama tipe
  return (
    /\bkitchen\s+set\b/.test(norm) ||
    /\bbedroom\s+set\b/.test(norm) ||
    /\bliving\s+set\b/.test(norm) ||
    /\bset\s+dapur\b/.test(norm) ||
    /\bset\s+kamar\s+tidur\b/.test(norm) ||
    /\bset\s+ruang\s+tamu\b/.test(norm)
  );
}

function normalizeForCompare(s: string) {
  const raw = String(s ?? "")
    .toLowerCase()
    .replace(/[^\u0020-\u007E\p{L}\p{N}\s]+/gu, " ")
    .replace(/[_\-\/|,.:;()+\[\]{}=]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const keepSet = shouldKeepSet(raw);

  let t = raw
    .replace(/\b\d+\s*[xX]\s*\d+(\s*[xX]\s*\d+)?\b/g, " ") // 120x200x60
    .replace(/\b\d+(\.\d+)?\s*(cm|mm|m|meter|inch|in|ft|pcs|pc|kg|gr|gram)\b/g, " ")
    .replace(/\b\d+(\.\d+)?\b/g, " ")
    .replace(/\b(series|tipe|type|model|varian|variant|edition|gen)\b/g, " ")
    .replace(/\b[a-z]{1,3}\s*[-]?\s*\d{2,4}\b/gi, " ");

  const toks = t
    .split(" ")
    .filter(Boolean)
    .filter((w) => {
      if (NOISE_WORDS.has(w)) return false;
      if (w === "set" && !keepSet) return false;
      return true;
    });

  return toks.join(" ").replace(/\s+/g, " ").trim();
}

// ========= 2) Rule engine (vocabulary diperbanyak) =========
type Rule = { key: string; keywords: Array<string | RegExp> };

// Tipe produk (KEY bahasa-agnostik)
const TYPE_RULES: Rule[] = [
  // Kitchen / pantry
  { key: "kitchen_set", keywords: ["kitchen set","kabinet dapur","set dapur","pantry",/kitchen\s*set/] },
  { key: "kitchen_cabinet", keywords: ["kabinet dapur","kitchen cabinet","kitchen base","kitchen wall cabinet","cabinet dapur","rak bumbu","rak piring"] },
  { key: "pantry_cabinet", keywords: ["lemari pantry","pantry cabinet","kitchen pantry"] },

  // Living
  { key: "tv_stand", keywords: ["rak tv","tv stand","meja tv","tv console","tv cabinet","tv unit","tv panel","panel tv","backdrop tv","meja console tv"] },
  { key: "sofa", keywords: ["sofa","couch","loveseat","recliner","sectional","l shape sofa","l sofa","sofa l","sofa bed","daybed"] },
  { key: "armchair", keywords: ["armchair","kursi santai","accent chair","kursi malas"] },
  { key: "coffee_table", keywords: ["meja kopi","coffee table","meja tamu","table tamu"] },
  { key: "side_table", keywords: ["meja samping","side table","end table","meja kecil"] },
  { key: "console_table", keywords: ["meja konsol","console table","console desk"] },
  { key: "shelf", keywords: ["rak","shelf","shelving","rak dinding","wall shelf","rak tempel","floating shelf","rak sudut","corner shelf"] },
  { key: "bookcase", keywords: ["rak buku","bookcase","bookshelf","lemari buku"] },
  { key: "display_cabinet", keywords: ["lemari display","display cabinet","showcase","etalase","lemari pajangan"] },
  { key: "partition", keywords: ["partisi","partition","divider","penyekat","sekat ruangan"] },

  // Bedroom
  { key: "bed_frame", keywords: ["tempat tidur","ranjang","bed frame","headboard","dipan","bed","ranjang kayu","ranjang besi","bunk bed","ranjang susun"] },
  { key: "mattress", keywords: ["kasur","mattress"] },
  { key: "bedside_table", keywords: ["nakas","nightstand","bedside","bed side"] },
  { key: "wardrobe", keywords: ["lemari pakaian","wardrobe","walk in closet","walk-in closet","closet","lemari baju"] },
  { key: "dresser", keywords: ["laci","drawer","chest of drawers","drawer unit","chest drawers","cabinet drawer","lemari laci"] },
  { key: "vanity", keywords: ["meja rias","vanity","dresser table","meja rias minimalis"] },
  { key: "mirror", keywords: ["cermin","mirror","standing mirror","wall mirror","cermin berdiri","cermin dinding"] },

  // Dining
  { key: "dining_table", keywords: ["meja makan","dining table"] },
  { key: "dining_chair", keywords: ["kursi makan","dining chair"] },
  { key: "bar_table", keywords: ["meja bar","bar table","island table"] },
  { key: "bar_stool", keywords: ["kursi bar","bar stool","stool bar","bangku bar"] },
  { key: "sideboard", keywords: ["buffet","bufet","sideboard","credenza","credensa"] },

  // Office
  { key: "work_desk", keywords: ["meja kerja","meja kantor","work desk",/\bdesk\b/,"workstation","meja belajar","study desk"] },
  { key: "office_chair", keywords: ["kursi kantor","office chair","chair office"] },
  { key: "filing_cabinet", keywords: ["lemari arsip","filing cabinet","cabinet arsip"] },

  // Storage / utility
  { key: "shoe_rack", keywords: ["rak sepatu","shoe rack","shoe cabinet","lemari sepatu"] },
  { key: "laundry_storage", keywords: ["rak laundry","laundry rack","lemari laundry","keranjang laundry","laundry basket"] },

  // Interior finishing / decor (tetap dalam scope interior)
  { key: "wall_panel", keywords: ["panel dinding","wall panel","wpc","pvc panel","slat wall","slat panel","panel slat","panel kayu"] },
  { key: "wallpaper", keywords: ["wallpaper","wall paper","kertas dinding"] },
  { key: "flooring", keywords: ["lantai vinyl","vinyl flooring","flooring","parket","parquet","laminate flooring","karpet lantai"] },
  { key: "lighting", keywords: ["lampu","lighting","lamp","downlight","spotlight","lampu gantung","chandelier","lampu plafon","ceiling lamp","wall lamp","lampu dinding","lampu meja","table lamp","floor lamp"] },
  { key: "rug", keywords: ["karpet","rug","carpet","doormat","keset"] },
  { key: "curtain", keywords: ["gorden","curtain","tirai","blind","roller blind","vertical blind"] },
  { key: "decor", keywords: ["dekor","dekorasi","hiasan","aksesori","accessory","ornamen","wall art","poster","lukisan","frame","bingkai","vas","tanaman","planter","cushion","bantal","throw pillow"] },
];

// Ruangan/area (KEY bahasa-agnostik)
const ROOM_RULES: Rule[] = [
  { key: "kitchen", keywords: ["dapur","kitchen"] },
  { key: "bedroom", keywords: ["kamar tidur","bedroom"] },
  { key: "living_room", keywords: ["ruang tamu","ruang keluarga","living room","family room"] },
  { key: "dining_room", keywords: ["ruang makan","dining room","dining"] },
  { key: "bathroom", keywords: ["kamar mandi","bathroom"] },
  { key: "patio", keywords: ["teras","patio","outdoor","balkon","balcony"] },
  { key: "office", keywords: ["kantor","ruang kerja","home office","office","workspace","study room","ruang belajar"] },
  { key: "kids_room", keywords: ["kamar anak","kids room","children room","nursery"] },
  { key: "entryway", keywords: ["foyer","entryway","area masuk","teras depan"] },
  { key: "laundry", keywords: ["laundry","ruang cuci","area cuci"] },
];

// Material (KEY bahasa-agnostik)
const MATERIAL_RULES: Rule[] = [
  { key: "wood", keywords: ["kayu","jati","oak","mahoni","meranti","sonokeling","teak","wood","solid wood"] },
  { key: "plywood", keywords: ["plywood","multiplek","multiplex"] },
  { key: "mdf", keywords: ["mdf","hdf"] },
  { key: "metal", keywords: ["besi","metal","steel","stainless","aluminium","aluminum","iron"] },
  { key: "glass", keywords: ["kaca","glass","tempered glass"] },
  { key: "marble", keywords: ["marmer","marble"] },
  { key: "granite", keywords: ["granit","granite"] },
  { key: "rattan", keywords: ["rotan","rattan"] },
  { key: "fabric", keywords: ["kain","fabric","linen","cotton","polyester"] },
  { key: "leather", keywords: ["kulit","leather"] },
];

// Style (KEY bahasa-agnostik)
const STYLE_RULES: Rule[] = [
  { key: "minimalist", keywords: ["minimalis","minimalist"] },
  { key: "modern", keywords: ["modern"] },
  { key: "classic", keywords: ["klasik","classic"] },
  { key: "industrial", keywords: ["industrial","industri"] },
  { key: "scandinavian", keywords: ["skandinavia","scandinavian","scandi"] },
  { key: "japandi", keywords: ["japandi"] },
  { key: "boho", keywords: ["boho","bohemian"] },
];

// Color (KEY bahasa-agnostik)
const COLOR_RULES: Rule[] = [
  { key: "white", keywords: ["putih","white"] },
  { key: "black", keywords: ["hitam","black"] },
  { key: "gray", keywords: ["abu","grey","gray"] },
  { key: "brown", keywords: ["coklat","brown"] },
  { key: "beige", keywords: ["krem","beige"] },
  { key: "gold", keywords: ["emas","gold"] },
  { key: "silver", keywords: ["perak","silver"] },
];

function matchesAny(norm: string, kw: string | RegExp) {
  if (typeof kw === "string") return norm.includes(kw);
  return kw.test(norm);
}

function pickRuleKey(norm: string, rules: Rule[]) {
  for (const r of rules) {
    for (const kw of r.keywords) {
      if (matchesAny(norm, kw)) return r.key;
    }
  }
  return null;
}

// ========= 3) Label dictionaries (single language output) =========
const TYPE_LABELS: Record<LanguageMode, Record<string, string>> = {
  ID: {
    kitchen_set: "Set Dapur",
    kitchen_cabinet: "Kabinet Dapur",
    pantry_cabinet: "Lemari Pantry",

    tv_stand: "Rak TV",
    sofa: "Sofa",
    armchair: "Kursi Santai",
    coffee_table: "Meja Tamu",
    side_table: "Meja Samping",
    console_table: "Meja Konsol",
    shelf: "Rak",
    bookcase: "Rak Buku",
    display_cabinet: "Lemari Pajangan",
    partition: "Partisi",

    bed_frame: "Tempat Tidur",
    mattress: "Kasur",
    bedside_table: "Nakas",
    wardrobe: "Lemari Pakaian",
    dresser: "Lemari Laci",
    vanity: "Meja Rias",
    mirror: "Cermin",

    dining_table: "Meja Makan",
    dining_chair: "Kursi Makan",
    bar_table: "Meja Bar",
    bar_stool: "Kursi Bar",
    sideboard: "Bufet",

    work_desk: "Meja Kerja",
    office_chair: "Kursi Kantor",
    filing_cabinet: "Lemari Arsip",

    shoe_rack: "Rak Sepatu",
    laundry_storage: "Penyimpanan Laundry",

    wall_panel: "Panel Dinding",
    wallpaper: "Wallpaper",
    flooring: "Lantai",
    lighting: "Pencahayaan",
    rug: "Karpet",
    curtain: "Gorden",
    decor: "Dekorasi",
  },
  EN: {
    kitchen_set: "Kitchen Set",
    kitchen_cabinet: "Kitchen Cabinet",
    pantry_cabinet: "Pantry Cabinet",

    tv_stand: "TV Stand",
    sofa: "Sofa",
    armchair: "Armchair",
    coffee_table: "Coffee Table",
    side_table: "Side Table",
    console_table: "Console Table",
    shelf: "Shelf",
    bookcase: "Bookcase",
    display_cabinet: "Display Cabinet",
    partition: "Room Divider",

    bed_frame: "Bed Frame",
    mattress: "Mattress",
    bedside_table: "Bedside Table",
    wardrobe: "Wardrobe",
    dresser: "Drawer Cabinet",
    vanity: "Vanity Table",
    mirror: "Mirror",

    dining_table: "Dining Table",
    dining_chair: "Dining Chair",
    bar_table: "Bar Table",
    bar_stool: "Bar Stool",
    sideboard: "Sideboard",

    work_desk: "Work Desk",
    office_chair: "Office Chair",
    filing_cabinet: "Filing Cabinet",

    shoe_rack: "Shoe Rack",
    laundry_storage: "Laundry Storage",

    wall_panel: "Wall Panel",
    wallpaper: "Wallpaper",
    flooring: "Flooring",
    lighting: "Lighting",
    rug: "Rug",
    curtain: "Curtain",
    decor: "Home Decor",
  },
};

const ROOM_LABELS: Record<LanguageMode, Record<string, string>> = {
  ID: {
    kitchen: "Dapur",
    bedroom: "Kamar Tidur",
    living_room: "Ruang Tamu",
    dining_room: "Ruang Makan",
    bathroom: "Kamar Mandi",
    patio: "Teras",
    office: "Ruang Kerja",
    kids_room: "Kamar Anak",
    entryway: "Area Masuk",
    laundry: "Ruang Cuci",
  },
  EN: {
    kitchen: "Kitchen",
    bedroom: "Bedroom",
    living_room: "Living Room",
    dining_room: "Dining Room",
    bathroom: "Bathroom",
    patio: "Patio",
    office: "Home Office",
    kids_room: "Kids Room",
    entryway: "Entryway",
    laundry: "Laundry Room",
  },
};

const MATERIAL_LABELS: Record<LanguageMode, Record<string, string>> = {
  ID: {
    wood: "Kayu",
    plywood: "Plywood",
    mdf: "MDF",
    metal: "Besi",
    glass: "Kaca",
    marble: "Marmer",
    granite: "Granit",
    rattan: "Rotan",
    fabric: "Kain",
    leather: "Kulit",
  },
  EN: {
    wood: "Wood",
    plywood: "Plywood",
    mdf: "MDF",
    metal: "Metal",
    glass: "Glass",
    marble: "Marble",
    granite: "Granite",
    rattan: "Rattan",
    fabric: "Fabric",
    leather: "Leather",
  },
};

const STYLE_LABELS: Record<LanguageMode, Record<string, string>> = {
  ID: {
    minimalist: "Minimalis",
    modern: "Modern",
    classic: "Klasik",
    industrial: "Industrial",
    scandinavian: "Skandinavia",
    japandi: "Japandi",
    boho: "Boho",
  },
  EN: {
    minimalist: "Minimalist",
    modern: "Modern",
    classic: "Classic",
    industrial: "Industrial",
    scandinavian: "Scandinavian",
    japandi: "Japandi",
    boho: "Boho",
  },
};

const COLOR_LABELS: Record<LanguageMode, Record<string, string>> = {
  ID: {
    white: "Putih",
    black: "Hitam",
    gray: "Abu",
    brown: "Coklat",
    beige: "Krem",
    gold: "Emas",
    silver: "Perak",
  },
  EN: {
    white: "White",
    black: "Black",
    gray: "Gray",
    brown: "Brown",
    beige: "Beige",
    gold: "Gold",
    silver: "Silver",
  },
};

// Kata rumpun (alternatif judul)
const UMBRELLA_WORDS: Record<LanguageMode, string[]> = {
  ID: ["Furnitur", "Perabot", "Mebel", "Interior", "Perlengkapan"],
  EN: ["Furniture", "Furnishings", "Home Furniture", "Interiors"],
};

// implied room untuk menghindari output kaku (tipe + ruangan redundant)
const IMPLIED_ROOM: Record<string, string> = {
  kitchen_set: "kitchen",
  kitchen_cabinet: "kitchen",
  pantry_cabinet: "kitchen",
  dining_table: "dining_room",
  dining_chair: "dining_room",
  bar_table: "dining_room",
  bar_stool: "dining_room",
  bed_frame: "bedroom",
  wardrobe: "bedroom",
  bedside_table: "bedroom",
  vanity: "bedroom",
  shoe_rack: "entryway",
  laundry_storage: "laundry",
};

function titleCase(s: string) {
  return String(s ?? "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function removeAllSeparators(s: string) {
  // Hard rule: no separators at all
  return String(s ?? "")
    .replace(/[-–—\/|_,.:;]+/g, " ")
    .replace(/[(){}\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ========= 4) Sanitasi akhir (hard rules) =========
function sanitizeCategoryLabel(input: string, lang: LanguageMode): string {
  let s = removeAllSeparators(input);

  // no digits
  s = s.replace(/\d+/g, " ");

  // no weird chars
  s = s.replace(/[^\p{L}\s]+/gu, " ");

  // collapse
  s = s.replace(/\s+/g, " ").trim();

  // remove noise tokens
  const toks = s.split(" ").filter(Boolean).filter((t) => !NOISE_WORDS.has(t.toLowerCase()));

  // global dedupe (no repeated words)
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of toks) {
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }

  s = out.join(" ").trim();
  const words = s.split(" ").filter(Boolean);
  if (words.length === 0) return "";

  // enforce 2–4 words (default)
  if (words.length === 1) {
    const umb = UMBRELLA_WORDS[lang][0];
    s = `${words[0]} ${umb}`;
  }
  s = s.split(" ").filter(Boolean).slice(0, 4).join(" ");

  return titleCase(s);
}


// ========= 4b) SEO helpers (richer than kategori label) =========
function slugify(input: string) {
  return String(input ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqStrings(items: Array<string | null | undefined>, limit = 12) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    const s = String(it ?? "").trim();
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

function modeKey(arr: ItemWithFeat[], key: keyof Features) {
  const cnt = new Map<string, number>();
  for (const it of arr) {
    const v = it.f[key];
    if (!v) continue;
    cnt.set(v, (cnt.get(v) ?? 0) + 1);
  }
  let best: { k: string | null; c: number } = { k: null, c: 0 };
  for (const [k, c] of cnt.entries()) {
    if (c > best.c) best = { k, c };
  }
  const total = arr.length || 1;
  return { key: best.k, ratio: best.c / total };
}

// Synonyms for SEO keyword coverage (short list, safe/evergreen)
const TYPE_SEO_SYNONYMS: Record<LanguageMode, Record<string, string[]>> = {
  ID: {
    sofa: ["Sofa", "Couch", "Sofa Minimalis", "Sofa Bed"],
    tv_stand: ["Rak TV", "Meja TV", "TV Stand", "TV Console"],
    coffee_table: ["Meja Kopi", "Meja Tamu", "Coffee Table"],
    side_table: ["Meja Samping", "Side Table", "End Table"],
    dining_table: ["Meja Makan", "Dining Table"],
    dining_chair: ["Kursi Makan", "Dining Chair"],
    bed_frame: ["Tempat Tidur", "Ranjang", "Bed Frame", "Dipan"],
    mattress: ["Kasur", "Mattress"],
    wardrobe: ["Lemari Pakaian", "Lemari Baju", "Wardrobe"],
    dresser: ["Lemari Laci", "Chest of Drawers", "Drawer"],
    work_desk: ["Meja Kerja", "Meja Belajar", "Work Desk", "Desk"],
    office_chair: ["Kursi Kantor", "Office Chair"],
    shelf: ["Rak", "Rak Dinding", "Shelf"],
    bookcase: ["Rak Buku", "Bookshelf", "Bookcase"],
    shoe_rack: ["Rak Sepatu", "Lemari Sepatu", "Shoe Rack"],
    kitchen_set: ["Kitchen Set", "Kabinet Dapur", "Set Dapur"],
    kitchen_cabinet: ["Kabinet Dapur", "Kitchen Cabinet"],
    lighting: ["Lampu", "Lampu Gantung", "Lampu Meja", "Lampu Plafon"],
    rug: ["Karpet", "Rug", "Keset"],
    curtain: ["Gorden", "Tirai", "Curtain", "Blind"],
    decor: ["Dekorasi", "Aksesoris Rumah", "Home Decor"],
    wallpaper: ["Wallpaper", "Kertas Dinding"],
    flooring: ["Vinyl", "Parket", "Flooring", "Lantai Vinyl"],
  },
  EN: {
    sofa: ["Sofa", "Couch", "Sectional Sofa", "Sofa Bed"],
    tv_stand: ["TV Stand", "TV Console", "TV Cabinet"],
    coffee_table: ["Coffee Table", "Living Room Table"],
    side_table: ["Side Table", "End Table"],
    dining_table: ["Dining Table"],
    dining_chair: ["Dining Chair"],
    bed_frame: ["Bed Frame", "Bed", "Headboard"],
    mattress: ["Mattress"],
    wardrobe: ["Wardrobe", "Closet"],
    dresser: ["Dresser", "Drawer Unit", "Chest of Drawers"],
    work_desk: ["Work Desk", "Office Desk", "Study Desk"],
    office_chair: ["Office Chair"],
    shelf: ["Shelf", "Wall Shelf", "Shelving"],
    bookcase: ["Bookcase", "Bookshelf"],
    shoe_rack: ["Shoe Rack", "Shoe Cabinet"],
    kitchen_set: ["Kitchen Set"],
    kitchen_cabinet: ["Kitchen Cabinet"],
    lighting: ["Lighting", "Lamp", "Ceiling Lamp", "Pendant Lamp"],
    rug: ["Rug", "Carpet", "Doormat"],
    curtain: ["Curtain", "Blinds"],
    decor: ["Home Decor", "Decor"],
    wallpaper: ["Wallpaper"],
    flooring: ["Flooring", "Vinyl Flooring", "Laminate"],
  },
};

const ROOM_SEO_SYNONYMS: Record<LanguageMode, Record<string, string[]>> = {
  ID: {
    living_room: ["Ruang Tamu", "Ruang Keluarga"],
    bedroom: ["Kamar Tidur"],
    kitchen: ["Dapur"],
    dining_room: ["Ruang Makan"],
    bathroom: ["Kamar Mandi"],
    office: ["Ruang Kerja", "Home Office"],
    kids_room: ["Kamar Anak", "Nursery"],
    patio: ["Teras", "Outdoor", "Balkon"],
    laundry: ["Ruang Cuci", "Laundry"],
    entryway: ["Area Masuk", "Foyer"],
  },
  EN: {
    living_room: ["Living Room", "Family Room"],
    bedroom: ["Bedroom"],
    kitchen: ["Kitchen"],
    dining_room: ["Dining Room"],
    bathroom: ["Bathroom"],
    office: ["Home Office", "Office"],
    kids_room: ["Kids Room", "Nursery"],
    patio: ["Outdoor", "Patio", "Balcony"],
    laundry: ["Laundry"],
    entryway: ["Entryway", "Foyer"],
  },
};

function buildSeoMeta(params: {
  lang: LanguageMode;
  items: ItemWithFeat[];
  roomKey: string | null;
  typeKey: string | null;
  materialKey: string | null;
  styleKey: string | null;
  colorKey: string | null;
  fallbackName: string;
}) {
  const { lang, items, roomKey, typeKey, fallbackName } = params;

  const typeLabel = getLabel(lang, typeKey, TYPE_LABELS);
  const roomLabel = getLabel(lang, roomKey, ROOM_LABELS);
  const materialLabel = getLabel(lang, params.materialKey, MATERIAL_LABELS);
  const styleLabel = getLabel(lang, params.styleKey, STYLE_LABELS);
  const colorLabel = getLabel(lang, params.colorKey, COLOR_LABELS);

  const implied = typeKey ? IMPLIED_ROOM[typeKey] : null;
  const impliedMatch = Boolean(implied && roomKey && implied === roomKey);

  // Dominant modifiers inside the cluster (for SEO, not for category label)
  const domStyle = items.length ? modeKey(items, "styleKey") : { key: null, ratio: 0 };
  const domMat = items.length ? modeKey(items, "materialKey") : { key: null, ratio: 0 };
  const domColor = items.length ? modeKey(items, "colorKey") : { key: null, ratio: 0 };

  const modStyle = domStyle.key && domStyle.ratio >= 0.55 ? getLabel(lang, domStyle.key, STYLE_LABELS) : null;
  const modMat = domMat.key && domMat.ratio >= 0.6 ? getLabel(lang, domMat.key, MATERIAL_LABELS) : null;
  const modColor = domColor.key && domColor.ratio >= 0.6 ? getLabel(lang, domColor.key, COLOR_LABELS) : null;

  const mods = uniqStrings([modStyle, modMat, modColor], 2); // keep short

  // SEO title: Type + modifiers + Room (full label), fallback to existing label
  let seoTitle = "";
  if (typeLabel && roomLabel && !impliedMatch) {
    seoTitle = uniqStrings([typeLabel, ...mods, roomLabel], 8).join(" ");
  } else if (typeLabel) {
    seoTitle = uniqStrings([typeLabel, ...mods], 8).join(" ");
  } else if (roomLabel) {
    const umb = UMBRELLA_WORDS[lang][0];
    seoTitle = uniqStrings([umb, roomLabel, ...mods], 8).join(" ");
  } else {
    seoTitle = fallbackName;
  }

  seoTitle = titleCase(removeAllSeparators(seoTitle));
  const seoSlug = slugify(seoTitle);

  const typeSyn = (typeKey && TYPE_SEO_SYNONYMS[lang][typeKey]) ? TYPE_SEO_SYNONYMS[lang][typeKey] : [];
  const roomSyn = (roomKey && ROOM_SEO_SYNONYMS[lang][roomKey]) ? ROOM_SEO_SYNONYMS[lang][roomKey] : [];

  const comboTypeRoom =
    typeLabel && roomLabel && !impliedMatch ? `${typeLabel} ${roomLabel}` : null;

  const umbrellaRoom =
    roomLabel ? (lang === "ID" ? `${UMBRELLA_WORDS.ID[0]} ${roomLabel}` : `${roomLabel} ${UMBRELLA_WORDS.EN[0]}`) : null;

  const seoKeywords = uniqStrings(
    [
      seoTitle,
      comboTypeRoom,
      typeLabel,
      ...typeSyn,
      roomLabel,
      ...roomSyn,
      umbrellaRoom,
      materialLabel,
      styleLabel,
      colorLabel,
    ],
    12
  );

  const seoDescription =
    lang === "ID"
      ? `Koleksi ${seoTitle} untuk melengkapi rumah. Pilih model yang pas untuk ${roomLabel ?? "berbagai ruangan"} dengan desain yang rapi dan fungsional.`
      : `Explore ${seoTitle} for your home. Find pieces that fit ${roomLabel ?? "different rooms"} with a clean, functional look.`;

  return {
    seoTitle,
    seoH1: seoTitle,
    seoSlug,
    seoKeywords,
    seoDescription,
  };
}

function detectLanguageMode(products: ProductLite[]): LanguageMode {
  let en = 0, id = 0;
  const enHints = ["wardrobe","sofa","cabinet","shelf","table","chair","kitchen","bedroom","living","dining","bathroom","office","stand","divider","lighting","wallpaper"];
  const idHints = ["lemari","rak","meja","kursi","dapur","kamar","ruang","tempat","tidur","nakas","bufet","dekorasi","perabot","furnitur","mebel","pencahayaan","gorden","karpet"];
  for (const p of products.slice(0, 200)) {
    const n = normalizeForCompare([p.nama, p.tags, p.deskripsiSingkat].filter(Boolean).join(" "));
    for (const h of enHints) if (n.includes(h)) en++;
    for (const h of idHints) if (n.includes(h)) id++;
  }
  return en > id * 1.2 ? "EN" : "ID";
}

// ========= 5) Aspek (admin) =========
function parseManualAspects(raw: any): string[] | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw.map((x) => String(x)).map((x) => x.trim()).filter(Boolean);
  if (typeof raw === "string") {
    return raw.split(/[,|]/g).map((x) => x.trim()).filter(Boolean);
  }
  return null;
}

function mapAspectToKey(a: string): string | null {
  const x = a.toLowerCase();
  if (x.includes("ruang") || x.includes("ruangan") || x.includes("room")) return "room";
  if (x.includes("tipe") || x.includes("type")) return "type";
  if (x.includes("fungsi") || x.includes("func")) return "func";
  if (x.includes("material") || x.includes("bahan")) return "material";
  if (x.includes("gaya") || x.includes("style")) return "style";
  if (x.includes("warna") || x.includes("color")) return "color";
  if (x.includes("harga") || x.includes("price")) return "price";
  if (x.includes("diskon") || x.includes("discount")) return "discount";
  if (x.includes("custom") || x.includes("kustom") || x.includes("built")) return "isCustom";
  return null;
}

function chooseAspectKeys(manual: string[] | null) {
  if (manual && manual.length) {
    const keys = manual.map(mapAspectToKey).filter(Boolean) as string[];
    const out: string[] = [];
    for (const k of keys) if (!out.includes(k)) out.push(k);
    return out.length ? out : ["room", "type"];
  }
  // default interior yang manusia: ruangan -> tipe
  return ["room", "type", "material", "style", "color", "func"];
}

function computeCoverage(items: ItemWithFeat[], get: (it: ItemWithFeat) => string | null) {
  if (!items.length) return 0;
  let ok = 0;
  for (const it of items) if (get(it)) ok++;
  return ok / items.length;
}

function isGenericTypeKey(typeKey: string | null) {
  if (!typeKey) return true;
  return ["sofa","armchair","cabinet","shelf","decor","lighting"].includes(typeKey);
}

// conventional titles tanpa separator (contoh: Meja Makan)
function conventionalName(lang: LanguageMode, roomKey: string | null, typeKey: string | null): string | null {
  if (!roomKey || !typeKey) return null;

  if (lang === "ID") {
    if (typeKey === "dining_table") return "Meja Makan";
    if (typeKey === "dining_chair") return "Kursi Makan";
    if (typeKey === "coffee_table") return "Meja Tamu";
    if (typeKey === "work_desk") return "Meja Kerja";
    if (typeKey === "tv_stand") return "Rak TV";
    if (typeKey === "kitchen_set") return "Furnitur Dapur";
    if (typeKey === "shoe_rack") return "Rak Sepatu";
  }

  if (lang === "EN") {
    if (typeKey === "dining_table") return "Dining Table";
    if (typeKey === "dining_chair") return "Dining Chair";
    if (typeKey === "coffee_table") return "Coffee Table";
    if (typeKey === "work_desk") return "Work Desk";
    if (typeKey === "tv_stand") return "TV Stand";
    if (typeKey === "kitchen_set") return "Kitchen Furniture";
    if (typeKey === "shoe_rack") return "Shoe Rack";
  }

  return null;
}

function getLabel(lang: LanguageMode, key: string | null, dict: Record<LanguageMode, Record<string, string>>) {
  if (!key) return null;
  return dict[lang][key] ?? null;
}

// Creative naming (tanpa dash) + rumpun kata
function generateCategoryName(params: {
  lang: LanguageMode;
  roomKey: string | null;
  typeKey: string | null;
  materialKey: string | null;
  styleKey: string | null;
  colorKey: string | null;
  existing: Set<string>;
  aspectKeys: string[];
}): string {
  const { lang, roomKey, typeKey, materialKey, styleKey, colorKey, existing, aspectKeys } = params;

  const roomLabel = getLabel(lang, roomKey, ROOM_LABELS);
  const typeLabel = getLabel(lang, typeKey, TYPE_LABELS);
  const materialLabel = getLabel(lang, materialKey, MATERIAL_LABELS);
  const styleLabel = getLabel(lang, styleKey, STYLE_LABELS);
  const colorLabel = getLabel(lang, colorKey, COLOR_LABELS);

  const implied = typeKey ? IMPLIED_ROOM[typeKey] : null;
  const impliedMatch = Boolean(implied && roomKey && implied === roomKey);

  // Short room labels (biar ringkas & tetap <= 4 kata)
  const shortRoomID: Record<string, string> = {
    "Ruang Tamu": "Tamu",
    "Ruang Makan": "Makan",
    "Kamar Tidur": "Tidur",
    "Ruang Kerja": "Kerja",
    "Kamar Mandi": "Mandi",
    "Kamar Anak": "Anak",
    "Ruang Cuci": "Cuci",
    "Area Masuk": "Masuk",
  };
  const roomShort =
    lang === "ID"
      ? (roomLabel ? (shortRoomID[roomLabel] ?? roomLabel) : null)
      : roomLabel;

  const candidates: string[] = [];

  // (A) Conventional first
  const conv = conventionalName(lang, roomKey, typeKey);
  if (conv) candidates.push(conv);

  // (B) Manual aspect-driven candidates (first two aspects only)
  const a1 = aspectKeys[0] ?? "room";
  const a2 = aspectKeys[1] ?? "type";

  const pick = (a: string) => {
    if (a === "room") return roomLabel;
    if (a === "type") return typeLabel;
    if (a === "material") return materialLabel;
    if (a === "style") return styleLabel;
    if (a === "color") return colorLabel;
    return null;
  };

  const p1 = pick(a1);
  const p2 = pick(a2);

  // Type-first grammar untuk kombinasi room+type walaupun order aspectKeys kebalik
  if (
    typeLabel &&
    roomLabel &&
    (a1 === "room" || a2 === "room") &&
    (a1 === "type" || a2 === "type")
  ) {
    if (
      !(
        impliedMatch &&
        ((a1 === "room" && a2 === "type") || (a1 === "type" && a2 === "room"))
      )
    ) {
      candidates.push(lang === "ID" ? `${typeLabel} ${roomShort}` : `${typeLabel} ${roomLabel}`);
    }
  } else if (p1 && p2) {
    // kalau salah satu "type", tetap taruh type di depan
    if (typeLabel && (a1 === "type" || a2 === "type")) {
      const other = a1 === "type" ? p2 : p1;
      candidates.push(other ? `${typeLabel} ${other}` : typeLabel);
    } else {
      candidates.push(`${p1} ${p2}`);
    }
  } else if (p1) {
    // room-only jangan jadi "Dapur" doang → jadikan umbrella + room
    if (a1 === "room" && roomLabel) {
      if (lang === "ID") {
        candidates.push(`${UMBRELLA_WORDS.ID[0]} ${roomLabel}`);
        candidates.push(`${UMBRELLA_WORDS.ID[1]} ${roomLabel}`);
      } else {
        candidates.push(`${roomLabel} ${UMBRELLA_WORDS.EN[0]}`);
        candidates.push(`${roomLabel} ${UMBRELLA_WORDS.EN[1]}`);
      }
    } else if ((a1 === "material" || a1 === "style" || a1 === "color") && p1) {
      // modifier-only → umbrella + modifier (lebih natural)
      candidates.push(lang === "ID" ? `${UMBRELLA_WORDS.ID[0]} ${p1}` : `${p1} ${UMBRELLA_WORDS.EN[0]}`);
    } else {
      candidates.push(p1);
    }
  }

  // (C) Implied redundancy: prefer umbrella room or type only
  if (impliedMatch && roomLabel) {
    if (lang === "ID") {
      candidates.push(`${UMBRELLA_WORDS.ID[0]} ${roomLabel}`);
      candidates.push(`${UMBRELLA_WORDS.ID[1]} ${roomLabel}`);
      candidates.push(`${UMBRELLA_WORDS.ID[2]} ${roomLabel}`);
    } else {
      candidates.push(`${roomLabel} ${UMBRELLA_WORDS.EN[0]}`);
      candidates.push(`${roomLabel} ${UMBRELLA_WORDS.EN[1]}`);
    }
    if (typeLabel && typeLabel.split(" ").length >= 2) candidates.push(typeLabel);
  }

  // (D) Generic type needs context: use umbrella room
  if (roomLabel && (isGenericTypeKey(typeKey) || !typeLabel)) {
    if (lang === "ID") {
      candidates.push(`${UMBRELLA_WORDS.ID[0]} ${roomLabel}`);
      candidates.push(`${UMBRELLA_WORDS.ID[1]} ${roomLabel}`);
      candidates.push(`${UMBRELLA_WORDS.ID[3]} ${roomLabel}`);
    } else {
      candidates.push(`${roomLabel} ${UMBRELLA_WORDS.EN[0]}`);
      candidates.push(`${roomLabel} ${UMBRELLA_WORDS.EN[1]}`);
      candidates.push(`${roomLabel} ${UMBRELLA_WORDS.EN[2]}`);
    }
  }

  // (E) Type only
  if (typeLabel) candidates.push(typeLabel);

  // (F) Type + short room (non redundant)
  if (typeLabel && roomLabel && !impliedMatch) {
    if (lang === "ID") {
      candidates.push(`${typeLabel} ${roomShort}`);
    } else {
      candidates.push(`${typeLabel} ${roomLabel}`);
    }
  }

  // (G) Type + material/style/color (buat aspek non-room)
  if (typeLabel && materialLabel) candidates.push(`${typeLabel} ${materialLabel}`);
  if (typeLabel && styleLabel) candidates.push(`${typeLabel} ${styleLabel}`);
  if (typeLabel && colorLabel) candidates.push(`${typeLabel} ${colorLabel}`);

  // choose first valid unused
  for (const c of candidates) {
    const clean = sanitizeCategoryLabel(c, lang);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (!existing.has(key)) {
      existing.add(key);
      return clean;
    }
  }

  // Last resort: umbrella only
  const fb = sanitizeCategoryLabel(UMBRELLA_WORDS[lang][0], lang);
  const k = fb.toLowerCase();
  if (!existing.has(k)) existing.add(k);
  return fb;
}

// ========= 6) Handler =========
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const products: ProductLite[] = Array.isArray(body?.products) ? body.products : [];
    if (!products.length) {
      return NextResponse.json({ error: "products[] kosong." }, { status: 400 });
    }

    const target = clamp(Math.round(Number(body?.targetCategoryCount ?? 8)), 1, 10);

    const manualAspects = parseManualAspects(body?.aspects);
    const aspectKeys = chooseAspectKeys(manualAspects);

    const lang: LanguageMode =
      body?.languageMode === "EN" || body?.languageMode === "ID"
        ? body.languageMode
        : detectLanguageMode(products);

    const minConfidence = typeof body?.minConfidence === "number" ? body.minConfidence : 0.35;

    const warnings: string[] = [];
    const itemsAll: ItemWithFeat[] = [];

    for (const p of products) {
      const norm = normalizeForCompare([p.nama, p.kategori, p.subkategori, p.tags, p.deskripsiSingkat].filter(Boolean).join(" "));
      const typeKey = pickRuleKey(norm, TYPE_RULES);
      const roomKey = pickRuleKey(norm, ROOM_RULES);
      const materialKey = pickRuleKey(norm, MATERIAL_RULES);
      const styleKey = pickRuleKey(norm, STYLE_RULES);
      const colorKey = pickRuleKey(norm, COLOR_RULES);

      const f: Features = {
        typeKey,
        roomKey,
        funcKey: null,
        materialKey,
        styleKey,
        colorKey,
        priceKey: null,
        discountKey: null,
        isCustomKey: /custom|kustom|built\s*in|built-in/.test(norm) ? "custom" : null,
      };

      // Confidence: type strongest, then room/material/style/color
      let conf = 0.12;
      if (typeKey) conf += 0.55;
      if (roomKey) conf += 0.18;
      if (materialKey) conf += 0.06;
      if (styleKey) conf += 0.04;
      if (colorKey) conf += 0.03;
      if (f.isCustomKey) conf += 0.02;
      conf = clamp(conf, 0, 1);

      itemsAll.push({ p, f, confidence: conf, norm });
    }

    let review = itemsAll.filter((x) => x.confidence < minConfidence);
    let items = itemsAll.filter((x) => x.confidence >= minConfidence);

    if (items.length === 0) {
      warnings.push(`Terlalu banyak produk ambigu untuk minConfidence=${minConfidence}. Dipaksa lanjut dengan semua produk.`);
      items = itemsAll;
      review = [];
    }

    // Coverage for potential strategies
    const covRoom = computeCoverage(itemsAll, (it) => it.f.roomKey);
    const covType = computeCoverage(itemsAll, (it) => it.f.typeKey);
    const covMat = computeCoverage(itemsAll, (it) => it.f.materialKey);
    const covStyle = computeCoverage(itemsAll, (it) => it.f.styleKey);
    const covColor = computeCoverage(itemsAll, (it) => it.f.colorKey);

    // Strategy list: prioritize manual aspects first, then fallbacks
    const strategies: Array<{ name: string; keys: string[] }> = [];

    // Manual (use first two keys; if only one -> one key)
    const manualKeys = aspectKeys.slice(0, 2);
    if (manualKeys.length) strategies.push({ name: `manual:${manualKeys.join("+")}`, keys: manualKeys });

    // Common good strategies when data exists
    if (covRoom >= 0.15 && covType >= 0.15) strategies.push({ name: "room+type", keys: ["room", "type"] });
    if (covType >= 0.15 && covMat >= 0.12) strategies.push({ name: "type+material", keys: ["type", "material"] });
    if (covType >= 0.15 && covStyle >= 0.10) strategies.push({ name: "type+style", keys: ["type", "style"] });
    if (covRoom >= 0.15) strategies.push({ name: "room-only", keys: ["room"] });
    if (covType >= 0.15) strategies.push({ name: "type-only", keys: ["type"] });
    if (covMat >= 0.12) strategies.push({ name: "material-only", keys: ["material"] });
    if (covStyle >= 0.10) strategies.push({ name: "style-only", keys: ["style"] });
    if (covColor >= 0.10) strategies.push({ name: "color-only", keys: ["color"] });

    if (!strategies.length) strategies.push({ name: "type-only", keys: ["type"] });

    const groupings: Array<{ strat: string; keys: string[]; groups: Map<string, ItemWithFeat[]>; unknown: number }> = [];

    const getFeat = (it: ItemWithFeat, k: string) => {
      if (k === "room") return it.f.roomKey;
      if (k === "type") return it.f.typeKey;
      if (k === "material") return it.f.materialKey;
      if (k === "style") return it.f.styleKey;
      if (k === "color") return it.f.colorKey;
      if (k === "isCustom") return it.f.isCustomKey;
      return null;
    };

    for (const st of strategies) {
      const groups = new Map<string, ItemWithFeat[]>();
      let unknown = 0;

      for (const it of items) {
        const parts: string[] = [];
        for (const k of st.keys) {
          const v = getFeat(it, k);
          parts.push(v ?? "unknown");
        }
        const key = parts.join("|");
        if (key.includes("unknown")) unknown++;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(it);
      }

      groupings.push({ strat: st.name, keys: st.keys, groups, unknown });
    }

    function scoreGrouping(g: typeof groupings[number]) {
      const diff = Math.abs(g.groups.size - target);
      const unkPenalty = (g.unknown / Math.max(1, items.length)) * 3;
      // Slightly prefer manual strategies if same score
      const manualBonus = g.strat.startsWith("manual:") ? -0.35 : 0;
      return diff * 2 + unkPenalty + manualBonus;
    }

    groupings.sort((a, b) => scoreGrouping(a) - scoreGrouping(b));
    const chosen = groupings[0];

    let suggestions: CategorySuggestion[] = [];
    const unassigned: number[] = [];
    const usedNames = new Set<string>();

    for (const [key, arr] of chosen.groups.entries()) {
      if (key.includes("unknown")) {
        for (const it of arr) unassigned.push(it.p.id);
        continue;
      }

      const parts = key.split("|");
      const k1 = parts[0] ?? "";
      const k2 = parts[1] ?? "";

      // Map grouping keys back to features for naming
      let roomKey: string | null = null;
      let typeKey: string | null = null;
      let materialKey: string | null = null;
      let styleKey: string | null = null;
      let colorKey: string | null = null;

      if (chosen.keys[0] === "room") roomKey = k1 || null;
      if (chosen.keys[0] === "type") typeKey = k1 || null;
      if (chosen.keys[0] === "material") materialKey = k1 || null;
      if (chosen.keys[0] === "style") styleKey = k1 || null;
      if (chosen.keys[0] === "color") colorKey = k1 || null;

      if (chosen.keys.length >= 2) {
        if (chosen.keys[1] === "room") roomKey = k2 || null;
        if (chosen.keys[1] === "type") typeKey = k2 || null;
        if (chosen.keys[1] === "material") materialKey = k2 || null;
        if (chosen.keys[1] === "style") styleKey = k2 || null;
        if (chosen.keys[1] === "color") colorKey = k2 || null;
      }

      const nama = generateCategoryName({
        lang,
        roomKey,
        typeKey,
        materialKey,
        styleKey,
        colorKey,
        existing: usedNames,
        aspectKeys,
      });

      if (!nama) {
        for (const it of arr) unassigned.push(it.p.id);
        continue;
      }

      const seo = buildSeoMeta({
        lang,
        items: arr,
        roomKey,
        typeKey,
        materialKey,
        styleKey,
        colorKey,
        fallbackName: nama,
      });

      suggestions.push({ nama, produkIds: arr.map((x) => x.p.id), alasan: `Grouping ${chosen.strat}`, ...seo });
    }

    // Merge duplicate names (case-insensitive)
    const merged = new Map<string, CategorySuggestion>();
    for (const s of suggestions) {
      const clean = sanitizeCategoryLabel(s.nama, lang);
      if (!clean) continue;
      const k = clean.toLowerCase();
      const prev = merged.get(k);
      if (!prev) merged.set(k, { ...s, nama: clean, produkIds: [...new Set(s.produkIds)] });
      else {
        const st = new Set<number>(prev.produkIds);
        for (const id of s.produkIds) st.add(id);
        prev.produkIds = [...st];
      }
    }

    suggestions = [...merged.values()].sort((a, b) => b.produkIds.length - a.produkIds.length);
    if (suggestions.length > target) suggestions = suggestions.slice(0, target);

    // Creative fallback: buat umbrella by room dari unassigned kalau masih kurang
    if (suggestions.length < target) {
      const bucketByRoom = new Map<string, number[]>();
      for (const id of unassigned) {
        const it = itemsAll.find((x) => x.p.id === id);
        const rk = it?.f.roomKey ?? null;
        if (!rk) continue;
        if (!bucketByRoom.has(rk)) bucketByRoom.set(rk, []);
        bucketByRoom.get(rk)!.push(id);
      }
      const sortedRooms = [...bucketByRoom.entries()].sort((a, b) => b[1].length - a[1].length);

      const existingNow = new Set<string>(suggestions.map((x) => x.nama.toLowerCase()));
      for (const [rk, ids] of sortedRooms) {
        if (suggestions.length >= target) break;

        // pilih variasi umbrella yang beda kalau bentrok
        for (const umb of UMBRELLA_WORDS[lang]) {
          const roomLabel = getLabel(lang, rk, ROOM_LABELS);
          if (!roomLabel) continue;
          const name = sanitizeCategoryLabel(lang === "ID" ? `${umb} ${roomLabel}` : `${roomLabel} ${umb}`, lang);
          if (!name) continue;
          const k = name.toLowerCase();
          if (existingNow.has(k)) continue;
          existingNow.add(k);
          const seo = buildSeoMeta({
            lang,
            items: [],
            roomKey: rk,
            typeKey: null,
            materialKey: null,
            styleKey: null,
            colorKey: null,
            fallbackName: name,
          });
          suggestions.push({ nama: name, produkIds: ids, alasan: "Fallback umbrella", ...seo });
          break;
        }
      }

      if (suggestions.length < target) {
        warnings.push(`Jumlah kategori (${suggestions.length}) lebih sedikit dari target (${target}). Data produk kurang variatif / terlalu ambigu.`);
      }
    }

    const reviewProdukIds = review.map((x) => x.p.id);
    const unassignedProdukIds = [...new Set(unassigned.filter((id) => !reviewProdukIds.includes(id)))];

    const diagnostics = {
      lang,
      chosenStrategy: chosen.strat,
      chosenKeys: chosen.keys,
      target,
      counts: {
        products: products.length,
        usedForGrouping: items.length,
        review: reviewProdukIds.length,
        unassigned: unassignedProdukIds.length,
        categories: suggestions.length,
      },
      coverage: {
        type: covType,
        room: covRoom,
        material: covMat,
        style: covStyle,
        color: covColor,
      },
      aspectKeys,
    };

    let catatan: string | null = null;
    const reviewRate = reviewProdukIds.length / Math.max(1, products.length);
    if (reviewRate >= 0.4) {
      catatan = "Banyak produk ambigu. Coba isi aspek seperti: Ruangan, Tipe atau Tipe, Material (dan pilih bahasa) agar hasil lebih rapi.";
    }

    const out: ResponseShape = { categories: suggestions, reviewProdukIds, unassignedProdukIds, warnings, diagnostics, catatan };
    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
