// app/background_setting/route.ts
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

const THEME_META_SLUG_PREFIX = "__theme_meta__";

function themeMetaSlug(themeKey: string) {
  return `${THEME_META_SLUG_PREFIX}${themeKey}`;
}

function safeThemeKey(v: unknown) {
  const s = String(v ?? "").trim();
  // keep it simple & safe (theme_1, theme_2, etc)
  if (!s) return "theme_1";
  if (!/^[a-zA-Z0-9_\-]+$/.test(s)) return "theme_1";
  return s;
}

type BgBase = "FOLLOW_NAVBAR" | "NAVY" | "WHITE" | "GOLD";

function safeReturnTo(v: unknown) {
  const s = String(v ?? "").trim();
  // hanya izinkan path relatif (same-origin) untuk menghindari open-redirect
  if (!s.startsWith("/")) return null;
  if (s.startsWith("//")) return null;
  return s;
}

function normalizeBg(v: unknown): BgBase {
  const s = String(v ?? "").trim().toUpperCase();
  if (s === "NAVY" || s === "WHITE" || s === "GOLD") return s as BgBase;
  return "FOLLOW_NAVBAR";
}

export async function POST(req: Request) {
  const form = await req.formData();
  const themeKey = safeThemeKey(form.get("themeKey"));
  const bg = normalizeBg(form.get("bg"));

  const slug = themeMetaSlug(themeKey);

  // Ensure theme meta row exists (type pakai enum valid biar tidak perlu migrate)
  const existing = await prisma.homepageSectionDraft.findFirst({ where: { slug } });
  const baseConfig: any = {
    __isThemeMeta: true,
    __themeKey: themeKey,
    ...(existing?.config && typeof existing.config === "object" ? (existing.config as any) : {}),
  };

  if (bg === "FOLLOW_NAVBAR") {
    if ("backgroundBase" in baseConfig) delete baseConfig.backgroundBase;
  } else {
    baseConfig.backgroundBase = bg;
  }

  if (existing) {
    await prisma.homepageSectionDraft.update({
      where: { id: existing.id },
      data: { config: baseConfig },
    });
  } else {
    await prisma.homepageSectionDraft.create({
      data: {
        type: "CUSTOM_PROMO" as any,
        title: "__THEME_META__",
        slug,
        enabled: false,
        sortOrder: 0,
        config: baseConfig,
      },
    });
  }

  // Revalidate
  revalidatePath("/");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");

  // Redirect back with notice
  const returnTo = safeReturnTo(form.get("returnTo"));
  const origin = new URL(req.url).origin;

  // prefer returnTo dari form (lebih stabil daripada referer header)
  const target = returnTo ?? "/admin/admin_dashboard/admin_pengaturan/toko";

  const url = new URL(target, origin);
  url.searchParams.delete("error");
  url.searchParams.set("notice", "Background utama berhasil disimpan.");

  return NextResponse.redirect(url.toString(), { status: 303 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const themeKey = safeThemeKey(searchParams.get("themeKey"));
  const slug = themeMetaSlug(themeKey);

  const meta = await prisma.homepageSectionDraft.findFirst({ where: { slug } });
  const cfg = (meta?.config ?? {}) as any;

  return NextResponse.json({
    themeKey,
    backgroundBase: cfg?.backgroundBase ?? null,
  });
}
