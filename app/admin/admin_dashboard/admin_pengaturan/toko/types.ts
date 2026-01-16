export type SectionTypeId =
  | "HERO"
  | "TEXT_SECTION"
  | "CATEGORY_GRID"
  | "CATEGORY_GRID_COMMERCE"
  | "PRODUCT_CAROUSEL"
  | "PRODUCT_LISTING"
  | "HIGHLIGHT_COLLECTION"
  | "ROOM_CATEGORY"
  | "GALLERY"
  | "BRANCHES"
  | "CONTACT"
  | "SOCIAL"
  | "CUSTOM_PROMO"
  | "FOOTER"
  | "THEME_META";

export type SectionDef = {
  type: SectionTypeId;
  label: string;
  description: string;
  defaultSlug: string;
  defaultConfig: any;
};

export type ThemeKey = string;

export type DraftSection = {
  id: number;
  type: SectionTypeId;
  title: string | null;
  slug: string | null;
  enabled: boolean;
  sortOrder: number;
  config: any;
};

export type MasterData = {
  images: Array<{ id: number; url: string; title: string | null }>;
  produk: Array<{ id: number; nama: string }>;
  kategori: Array<{ id: number; nama: string }>;
  hubungi: Array<{ id: number; label: string; value: string }>;
  cabang: Array<{ id: number; nama: string; alamat: string }>;
  medsos: Array<{ id: number; nama: string; iconKey: string; url: string }>;
};
