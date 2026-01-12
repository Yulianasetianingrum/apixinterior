import { prisma } from "./prisma";

export type HomepageSectionType =
  | "HERO"
  | "CATEGORY_GRID"
  | "CATEGORY_GRID_COMMERCE"
  | "PRODUCT_CAROUSEL"
  | "HIGHLIGHT_COLLECTION"
  | "ROOM_CATEGORY"
  | "GALLERY"
  | "BRANCHES"
  | "CONTACT"
  | "SOCIAL"
  | "CUSTOM_PROMO";

export type SectionRow = {
  id: number;
  type: HomepageSectionType;
  title: string | null;
  slug: string | null;
  enabled: boolean;
  sortOrder: number;
  config: unknown; // stored as JSON in DB
};

export type SectionScope = "draft" | "published" | "legacy";

const TABLE_BY_SCOPE: Record<Exclude<SectionScope, "legacy">, string> = {
  draft: "homepagesectiondraft",
  published: "homepagesectionpublished",
};

function safeParseJson(v: any): any {
  if (v == null) return {};
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return {};
    }
  }
  return {};
}

function isObject(v: any): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/**
 * Backward-compat adapter:
 * - CATEGORY_GRID: legacy `categoryIdsForHomepage: number[]`
 * - CUSTOM_PROMO: legacy `bannerPromoId: number` (renderer may look it up)
 */
export function normalizeConfig(type: HomepageSectionType, rawConfig: unknown): any {
  const cfg = safeParseJson(rawConfig);

  if (type === "CATEGORY_GRID" && Array.isArray(cfg?.categoryIdsForHomepage)) {
    const items = cfg.categoryIdsForHomepage
      .filter((x: any) => typeof x === "number")
      .map((kategoriId: number) => ({ kategoriId, coverImageId: null }));
    return {
      layout: { columns: 3, maxItems: items.length || 6 },
      items,
    };
  }

  if (type === "CATEGORY_GRID_COMMERCE") {
    const layoutRaw = isObject(cfg.layout) ? cfg.layout : {};
    const modeRaw = String(layoutRaw?.mode ?? cfg?.mode ?? "clean").toLowerCase();
    const mode = modeRaw === "reverse" ? "reverse" : modeRaw === "commerce" ? "commerce" : "clean";
    return {
      ...(cfg ?? {}),
      layout: {
        columns: 4,
        tabletColumns: 3,
        mobileColumns: 2,
        maxItems: 16,
        ...layoutRaw,
        mode,
      },
      tabs: Array.isArray(cfg.tabs) ? cfg.tabs : [],
    };
  }

  // leave bannerPromoId in place for renderer fallback,
  // but CMS saves back in new format (title/subtitle/button/imageId)
  return cfg ?? {};
}

export function normalizeSectionRow(row: any): SectionRow {
  return {
    id: Number(row.id),
    type: row.type as HomepageSectionType,
    title: row.title ?? null,
    slug: row.slug ?? null,
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sortOrder),
    config: normalizeConfig(row.type as HomepageSectionType, row.config),
  };
}

export async function getSections(scope: SectionScope): Promise<SectionRow[]> {
  if (scope === "legacy") {
    // Legacy fallback table: `homepagesection`
    // If your legacy table name differs, adjust here.
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id,type,title,slug,enabled,sortOrder,config FROM homepagesection ORDER BY sortOrder ASC`
    );
    return rows.map(normalizeSectionRow);
  }

  const table = TABLE_BY_SCOPE[scope];
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id,type,title,slug,enabled,sortOrder,config FROM ${table} ORDER BY sortOrder ASC`
  );
  return rows.map(normalizeSectionRow);
}

export async function getEnabledSections(scope: SectionScope): Promise<SectionRow[]> {
  const all = await getSections(scope);
  return all.filter((s) => s.enabled).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function clearPublishedAndCopyDraft(): Promise<void> {
  const draftTable = TABLE_BY_SCOPE.draft;
  const pubTable = TABLE_BY_SCOPE.published;

  await prisma.$transaction([
    prisma.$executeRawUnsafe(`DELETE FROM ${pubTable}`),
    prisma.$executeRawUnsafe(
      `INSERT INTO ${pubTable} (type,title,slug,enabled,sortOrder,config)
       SELECT type,title,slug,enabled,sortOrder,config
       FROM ${draftTable}
       ORDER BY sortOrder ASC`
    ),
  ]);
}

/**
 * Write helpers for Draft table only (CMS edits go to draft).
 * We use raw SQL to avoid requiring Prisma models for these tables.
 */

export async function createDraftSection(input: {
  type: HomepageSectionType;
  title: string | null;
  slug: string | null;
  enabled: boolean;
  sortOrder: number;
  config: unknown;
}): Promise<number> {
  const table = TABLE_BY_SCOPE.draft;
  const configJson = JSON.stringify(input.config ?? {});
  // CAST(? AS JSON) keeps MySQL JSON constraints happy.
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${table} (type,title,slug,enabled,sortOrder,config)
     VALUES (?,?,?,?,?,CAST(? AS JSON))`,
    input.type,
    input.title,
    input.slug,
    input.enabled ? 1 : 0,
    input.sortOrder,
    configJson
  );

  const res = await prisma.$queryRawUnsafe<any[]>(`SELECT LAST_INSERT_ID() AS id`);
  return Number(res?.[0]?.id ?? 0);
}

export async function updateDraftSection(id: number, patch: Partial<Omit<SectionRow, "id">>): Promise<void> {
  const table = TABLE_BY_SCOPE.draft;

  // Build SET clause dynamically to avoid overwriting unspecified fields.
  const sets: string[] = [];
  const params: any[] = [];

  if (patch.type) {
    sets.push("type=?");
    params.push(patch.type);
  }
  if (patch.title !== undefined) {
    sets.push("title=?");
    params.push(patch.title);
  }
  if (patch.slug !== undefined) {
    sets.push("slug=?");
    params.push(patch.slug);
  }
  if (patch.enabled !== undefined) {
    sets.push("enabled=?");
    params.push(patch.enabled ? 1 : 0);
  }
  if (patch.sortOrder !== undefined) {
    sets.push("sortOrder=?");
    params.push(patch.sortOrder);
  }
  if (patch.config !== undefined) {
    sets.push("config=CAST(? AS JSON)");
    params.push(JSON.stringify(patch.config ?? {}));
  }

  if (!sets.length) return;

  params.push(id);
  await prisma.$executeRawUnsafe(`UPDATE ${table} SET ${sets.join(", ")} WHERE id=?`, ...params);
}

export async function deleteDraftSection(id: number): Promise<void> {
  const table = TABLE_BY_SCOPE.draft;
  await prisma.$executeRawUnsafe(`DELETE FROM ${table} WHERE id=?`, id);
}

export async function reorderDraftSections(idsInOrder: number[]): Promise<void> {
  const table = TABLE_BY_SCOPE.draft;
  const ops = idsInOrder.map((id, idx) =>
    prisma.$executeRawUnsafe(`UPDATE ${table} SET sortOrder=? WHERE id=?`, idx + 1, id)
  );
  await prisma.$transaction(ops);
}
