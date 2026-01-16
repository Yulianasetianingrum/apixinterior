// app/admin/admin_dashboard/admin_pengaturan/toko/toko-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import {
    getThemeKeyFromReferer,
    ensureThemeMeta,
    themeMetaSlug,
    redirectBack,
    withThemeKey,
    getThemeKeyFromRow,
    normalizeThemeKey,
    isThemeMetaRow,
    slugify,
    parseSectionTheme,
    parseNumArray,
    validateExistence,
    updateDraftConfigPreserveTheme,
    normalizeThemeAttr,
    ALLOWED_THEMES,
    parseCustomPromoBgTheme,
    normalizeCustomPromoConfig,
    normalizeVoucherImageIds,
    MAX_CUSTOM_PROMO_VOUCHERS,
    normalizeRoomCards,
    MAX_ROOM_CARDS,
    makeRoomCardKey,
    legacyToNewConfig,
    collectExistenceArgs,
    parseNum,

    clampInt,
} from "./toko-utils";
import { SectionTypeId } from "./types";

export async function updateBackgroundTheme(formData: FormData) {
    const raw = (formData.get("backgroundTheme") as string | null)?.trim() ?? "FOLLOW_NAVBAR";
    const picked = raw || "FOLLOW_NAVBAR";

    const allowed = ["FOLLOW_NAVBAR", "NAVY_GOLD", "WHITE_GOLD", "NAVY_WHITE", "GOLD_NAVY", "GOLD_WHITE", "WHITE_NAVY"];
    if (!allowed.includes(picked)) return;

    const themeKey = await getThemeKeyFromReferer();
    const slug = themeMetaSlug(themeKey);

    let meta = await prisma.homepageSectionDraft.findFirst({ where: { slug } });
    if (!meta) {
        meta = await prisma.homepageSectionDraft.create({
            data: {
                type: "THEME_META" as any,
                title: `Theme Meta ${themeKey}`,
                slug,
                enabled: true,
                sortOrder: -999,
                config: { __isThemeMeta: true, __themeKey: themeKey },
            },
        });
    }
    if (!meta) return redirectBack({ error: encodeURIComponent("Theme meta tidak ditemukan.") });

    const cfg = (meta.config ?? {}) as any;
    const nextCfg: any = { ...cfg, __isThemeMeta: true, __themeKey: themeKey };

    if (picked === "FOLLOW_NAVBAR") {
        if ("backgroundTheme" in nextCfg) delete nextCfg.backgroundTheme;
    } else {
        nextCfg.backgroundTheme = picked;
    }

    await prisma.homepageSectionDraft.update({
        where: { id: meta.id },
        data: { config: nextCfg },
    });

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    revalidatePath("/");

    // Pass themeKey explicitly to prevent UI reset
    return redirectBack({ notice: encodeURIComponent("Tema background berhasil disimpan."), theme: themeKey });
}

export async function updateNavbarTheme(formData: FormData) {
    const rawNavbarTheme = (formData.get("navbarTheme") as string | null)?.trim() ?? "DEFAULT";
    const pickedNavbarTheme = rawNavbarTheme || "DEFAULT";

    const allowedNavbarThemes = ["DEFAULT", "NAVY_GOLD", "WHITE_GOLD", "NAVY_WHITE", "GOLD_NAVY", "GOLD_WHITE", "WHITE_NAVY"];
    if (!allowedNavbarThemes.includes(pickedNavbarTheme)) return;

    const rawTk = (formData.get("themeKey") as string | null)?.trim();
    const themeKey = rawTk ? normalizeThemeKey(rawTk) : await getThemeKeyFromReferer();

    await ensureThemeMeta(themeKey);
    const meta = await prisma.homepageSectionDraft.findFirst({ where: { slug: themeMetaSlug(themeKey) } });
    if (!meta) return redirectBack({ error: encodeURIComponent("Theme meta tidak ditemukan.") });

    const cfg = (meta.config ?? {}) as any;
    const nextCfg: any = { ...cfg, __isThemeMeta: true, __themeKey: themeKey };

    if (pickedNavbarTheme === "DEFAULT") {
        if ("navbarTheme" in nextCfg) delete nextCfg.navbarTheme;
    } else {
        nextCfg.navbarTheme = pickedNavbarTheme;
    }

    await prisma.homepageSectionDraft.update({
        where: { id: meta.id },
        data: { config: nextCfg },
    });

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    revalidatePath("/");

    return redirectBack({ notice: encodeURIComponent("Tema navbar berhasil disimpan."), theme: themeKey });
}

export async function saveHeroConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;

    const headline = (formData.get("headline") as string | null)?.trim() ?? "";
    const subheadline = (formData.get("subheadline") as string | null)?.trim() ?? "";
    const ctaLabel = (formData.get("ctaLabel") as string | null)?.trim() ?? "";
    const ctaHref = (formData.get("ctaHref") as string | null)?.trim() ?? "";
    const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);

    const heroImageIdRaw = (formData.get("heroImageId") as string | null);
    const heroImageId = heroImageIdRaw && heroImageIdRaw.trim() ? Number(heroImageIdRaw) : null;

    try {
        if (heroImageId) await validateExistence({ imageIds: [heroImageId] });
    } catch (e: any) {
        return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal.") });
    }

    await updateDraftConfigPreserveTheme(
        id,
        {
            sectionTheme,
            headline,
            subheadline,
            ctaLabel,
            ctaHref,
            imageId: heroImageId,
            heroImageId,
        },
        { title, slug },
    );

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Config HERO tersimpan.") });
}

export async function saveTextSectionConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;

    const mode = String(formData.get("mode") ?? "body");
    const align = String(formData.get("align") ?? "left");
    const width = String(formData.get("width") ?? "normal");
    const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);

    const blocksJson = String(formData.get("blocks") ?? "[]");
    let blocks = [];
    try {
        blocks = JSON.parse(blocksJson);
    } catch { }

    await updateDraftConfigPreserveTheme(
        id,
        { sectionTheme, mode, align, width, blocks },
        { title, slug },
    );

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Config TEXT_SECTION tersimpan.") });
}

export async function saveProductListingConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    const anchor = String(formData.get("returnTo") ?? "").trim();

    const titleRaw = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;

    await prisma.homepageSectionDraft.update({
        where: { id },
        data: { title: titleRaw, slug },
    });

    const rawSectionTheme = (formData.get("sectionTheme") as string | null) ?? "";
    const normalizedSectionTheme = normalizeThemeAttr(rawSectionTheme);
    const sectionThemeValue =
        normalizedSectionTheme === "FOLLOW_NAVBAR" ||
            (normalizedSectionTheme && ALLOWED_THEMES.includes(normalizedSectionTheme as any))
            ? normalizedSectionTheme
            : "FOLLOW_NAVBAR";

    const clearProducts = ((formData.get("clearProducts") as string | null) ?? "").trim() === "1";
    const productIds = clearProducts ? [] : parseNumArray((formData.getAll("productIds") as string[]) ?? []);

    if (productIds.length > 0) {
        try {
            await validateExistence({ productIds });
        } catch (e: any) {
            return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal."), anchor, sectionId: id });
        }
    }

    const sectionBgTheme = parseCustomPromoBgTheme(formData.get("sectionBgTheme") as string | null);

    await updateDraftConfigPreserveTheme(id, {
        sectionTheme: sectionThemeValue,
        sectionBgTheme,
        title: titleRaw,
        productIds,
    });

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    return redirectBack({ notice: encodeURIComponent("Config PRODUCT_LISTING tersimpan."), anchor, sectionId: id });
}

export async function saveCustomPromoConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    const isAutosave = String(formData.get("cpAutosave") ?? "") === "1";

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;

    const layoutRaw = String(formData.get("layout") ?? "carousel").toLowerCase();
    const layout = layoutRaw === "grid" ? "grid" : layoutRaw === "hero" ? "hero" : "carousel";
    const sectionBgTheme = parseCustomPromoBgTheme(formData.get("sectionBgTheme") as string | null);

    const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const existingCfg = normalizeCustomPromoConfig(row?.config);
    const existingLinks =
        existingCfg && typeof existingCfg.voucherLinks === "object" && existingCfg.voucherLinks !== null
            ? (existingCfg.voucherLinks as Record<number, string>)
            : {};

    const formVoucherIds = parseNumArray((formData.getAll("voucherImageIds") as string[]) ?? []);
    const voucherImageIds = normalizeVoucherImageIds(
        formVoucherIds.length ? formVoucherIds : existingCfg?.voucherImageIds,
    );

    const voucherLinks: Record<number, string> = { ...existingLinks };
    for (const vid of voucherImageIds) {
        const catRaw = formData.get(`voucherCategory_${vid}`) as string | null;
        const catId = catRaw ? Number(catRaw) : NaN;
        const linkRaw = (formData.get(`voucherLink_${vid}`) as string | null)?.trim() ?? "";
        const modeRaw = (formData.get(`voucherLinkMode_${vid}`) as string | null)?.trim() ?? "";
        const mode = modeRaw === "category" || modeRaw === "manual" ? modeRaw : "";

        if (mode === "category") {
            if (Number.isFinite(catId) && catId > 0) voucherLinks[vid] = `category:${catId}`;
            else delete voucherLinks[vid];
        } else if (mode === "manual") {
            if (linkRaw) voucherLinks[vid] = linkRaw;
            else delete voucherLinks[vid];
        }
    }

    try {
        await validateExistence({ imageIds: voucherImageIds });
    } catch (e: any) {
        return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal.") });
    }

    await updateDraftConfigPreserveTheme(
        id,
        {
            layout,
            sectionBgTheme,
            voucherImageIds,
            voucherLinks,
        },
        { title, slug },
    );

    if (isAutosave) return { ok: true };

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    return redirectBack({ notice: encodeURIComponent("Config CUSTOM_PROMO tersimpan."), forceReload: true });
}

export async function saveSocialConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";

    const slug = slugRaw ? slugify(slugRaw) : null;

    const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);
    const iconKeys = ((formData.getAll("iconKeys") as string[]) ?? []).filter(Boolean);

    try {
        await validateExistence({ mediaIconKeys: iconKeys });
    } catch (e: any) {
        return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal.") });
    }

    const rows = await prisma.mediaSosial.findMany({
        where: { iconKey: { in: iconKeys } },
        select: { iconKey: true, nama: true },
    });

    const selected = iconKeys
        .map((k) => rows.find((r) => r.iconKey === k))
        .filter(Boolean)
        .map((r) => ({ iconKey: (r as any).iconKey, nama: (r as any).nama ?? (r as any).iconKey }));

    await updateDraftConfigPreserveTheme(
        id,
        { ...(sectionTheme ? { sectionTheme } : {}), selected, display: { iconsOnly: true } },
        { title, slug },
    );

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Config SOCIAL tersimpan.") });
}

export async function saveFooterConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;

    const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);

    const whatsapp = (formData.get("whatsapp") as string | null)?.trim() ?? "";
    const email = (formData.get("email") as string | null)?.trim() ?? "";
    const address = (formData.get("address") as string | null)?.trim() ?? "";
    const instagram = (formData.get("instagram") as string | null)?.trim() ?? "";
    const facebook = (formData.get("facebook") as string | null)?.trim() ?? "";

    const useGlobalContact = (formData.get("useGlobalContact") as string) === "1";
    const useGlobalSocial = (formData.get("useGlobalSocial") as string) === "1";

    const menuLinksRaw = String(formData.get("menuLinks") ?? "[]");
    const footerTagsRaw = String(formData.get("footerTags") ?? "[]");

    let menuLinks = [];
    try { menuLinks = JSON.parse(menuLinksRaw); } catch { }

    let footerTags = [];
    try { footerTags = JSON.parse(footerTagsRaw); } catch { }

    await updateDraftConfigPreserveTheme(
        id,
        {
            ...(sectionTheme ? { sectionTheme } : {}),
            whatsapp,
            email,
            address,
            instagram,
            facebook,
            menuLinks,
            footerTags,
            useGlobalContact,
            useGlobalSocial
        },
        { title, slug }
    );

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    return redirectBack({ notice: encodeURIComponent("Config Footer tersimpan.") });
}

export async function saveBranchesConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";

    const slug = slugRaw ? slugify(slugRaw) : null;

    const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);
    const branchIds = parseNumArray((formData.getAll("branchIds") as string[]) ?? []);
    const layout = ((formData.get("layout") as string | null) ?? "carousel") === "carousel" ? "carousel" : "grid";

    try {
        await validateExistence({ branchIds });
    } catch (e: any) {
        return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal.") });
    }

    await updateDraftConfigPreserveTheme(
        id,
        { ...(sectionTheme ? { sectionTheme } : {}), branchIds, layout },
        { title, slug },
    );

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Config BRANCHES tersimpan.") });
}

export async function saveContactConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";

    const slug = slugRaw ? slugify(slugRaw) : null;

    const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);
    const hubungiIds = parseNumArray((formData.getAll("hubungiIds") as string[]) ?? []);

    const headerText = (formData.get("headerText") as string | null)?.trim() ?? "";
    const bodyText = (formData.get("bodyText") as string | null)?.trim() ?? "";

    const existing = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const existingCfg = legacyToNewConfig("CONTACT", existing?.config ?? {});
    const imageId = parseNum((existingCfg as any)?.imageId);

    const buttonLabels: Record<string, string> = {};
    for (const hid of hubungiIds) {
        const key = String(hid);
        const v = (formData.get(`hubungiLabel_${key}`) as string | null)?.trim() ?? "";
        if (v) buttonLabels[key] = v;
    }

    try {
        await validateExistence({ hubungiIds, ...(imageId ? { imageIds: [imageId] } : {}) });
    } catch (e: any) {
        return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal.") });
    }

    await updateDraftConfigPreserveTheme(
        id,
        {
            ...(sectionTheme ? { sectionTheme } : {}),
            hubungiIds,
            buttonLabels,
            mode: "SPLIT_IMAGE_STACK",
            showImage: true,
            imageId,
            headerText,
            bodyText,
        },
        { title, slug },
    );

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Config CONTACT tersimpan.") });
}

export async function publishDraftToWebsite(formData: FormData) {
    const rawTk = formData.get("themeKey") as string | null;
    const themeKey = rawTk ? normalizeThemeKey(rawTk) : await getThemeKeyFromReferer();
    const meta = await prisma.homepageSectionDraft.findFirst({ where: { slug: themeMetaSlug(themeKey) } });
    if (!meta) return { ok: false, error: "Belum ada theme aktif." };

    const allDrafts = await prisma.homepageSectionDraft.findMany({ orderBy: { sortOrder: "asc" } });
    const drafts = allDrafts.filter((d) => {
        // Include meta rows ONLY if they match this specific theme
        if (isThemeMetaRow(d)) {
            return d.slug === themeMetaSlug(themeKey);
        }
        const tk = getThemeKeyFromRow(d);
        return tk === themeKey;
    });

    const metaConfig = (meta.config ?? {}) as any;
    const backgroundTheme = metaConfig.backgroundTheme;

    // DEBUG: Log apa yang dibaca dari meta
    console.log("🔍 DEBUG PUBLISH:");
    console.log("  - themeKey:", themeKey);
    console.log("  - metaConfig:", metaConfig);
    console.log("  - metaConfig.navbarTheme:", metaConfig.navbarTheme);
    console.log("  - metaConfig.backgroundTheme:", metaConfig.backgroundTheme);

    // Transaction: Delete old published sections, Insert new sections, AND Update NavbarSetting
    const transactionOps: any[] = [
        prisma.homepageSectionPublished.deleteMany({}),
        ...drafts.map((d) =>
            prisma.homepageSectionPublished.create({
                data: {
                    type: d.type as any,
                    title: d.title,
                    slug: d.slug,
                    enabled: d.enabled,
                    sortOrder: d.sortOrder,
                    config: d.config as any,
                },
            }),
        ),
    ];

    await prisma.$transaction(transactionOps);

    // Save the active theme key so homepage knows which theme to display
    const existingActiveTheme = await prisma.homepageSectionDraft.findFirst({
        where: { slug: "__active_theme__" },
    });

    if (existingActiveTheme) {
        await prisma.homepageSectionDraft.update({
            where: { id: existingActiveTheme.id },
            data: {
                config: { __isActiveTheme: true, activeThemeKey: themeKey },
            },
        });
    } else {
        await prisma.homepageSectionDraft.create({
            data: {
                type: "HERO",
                title: "Active Theme Marker",
                slug: "__active_theme__",
                enabled: true,
                sortOrder: -1000,
                config: { __isActiveTheme: true, activeThemeKey: themeKey },
            },
        });
    }

    revalidatePath("/");
    revalidatePath("/navbar");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");

    // Redirect to preview page with success notice (same as preview page button)
    redirect(
        `/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(themeKey)}&notice=${encodeURIComponent(
            "Publish berhasil. Homepage utama sudah di-refresh.",
        )}`,
    );
}

export async function unpublishWebsite() {
    // Delete ALL published sections (makes homepage completely empty)
    await prisma.homepageSectionPublished.deleteMany({});

    // Delete active theme marker (so homepage doesn't know which theme to show)
    const activeTheme = await prisma.homepageSectionDraft.findFirst({
        where: { slug: "__active_theme__" },
    });
    if (activeTheme) {
        await prisma.homepageSectionDraft.delete({ where: { id: activeTheme.id } });
    }


    revalidatePath("/");
    revalidatePath("/navbar");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");

    // Redirect back with success notice
    return redirectBack({ notice: encodeURIComponent("Publish berhasil dihapus. Homepage sekarang kosong.") });
}

export async function deleteDraftSection(id: number) {
    await prisma.homepageSectionDraft.delete({ where: { id } });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return { ok: true, notice: "Section dihapus." };
}

export async function reorderDraftSections(items: { id: number; sortOrder: number }[]) {
    await prisma.$transaction(
        items.map((it) => prisma.homepageSectionDraft.update({ where: { id: it.id }, data: { sortOrder: it.sortOrder } }))
    );
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return { ok: true };
}

export async function toggleDraftSection(id: number, enabled: boolean) {
    await prisma.homepageSectionDraft.update({ where: { id }, data: { enabled } });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return { ok: true };
}

export async function saveCategoryGridConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;

    const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);
    const columns = clampInt(Number(formData.get("columns") ?? 3), 1, 6);
    const maxItems = clampInt(Number(formData.get("maxItems") ?? 6), 1, 30);

    const kategoriIds = parseNumArray((formData.getAll("kategoriIds") as string[]) ?? []);
    const items = kategoriIds.map((kid) => {
        const coverImageId = parseNum(formData.get(`coverImageId_${kid}`));
        return { kategoriId: kid, coverImageId };
    });

    try {
        await validateExistence({ kategoriIds, imageIds: items.map((it) => it.coverImageId).filter((v): v is number => !!v) });
    } catch (e: any) {
        return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal.") });
    }

    await updateDraftConfigPreserveTheme(
        id,
        { sectionTheme, layout: { columns, maxItems }, items },
        { title, slug },
    );

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Config CATEGORY_GRID tersimpan.") });
}

export async function saveCategoryGridCommerceConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;

    const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);

    const columns = clampInt(Number(formData.get("columns") ?? 4), 1, 8);
    const tabletColumns = clampInt(Number(formData.get("tabletColumns") ?? 3), 1, 6);
    const mobileColumns = clampInt(Number(formData.get("mobileColumns") ?? 2), 1, 4);
    const maxItems = clampInt(Number(formData.get("maxItems") ?? 16), 1, 60);

    const itemsJson = String(formData.get("items") ?? "[]");
    let items = [];
    try { items = JSON.parse(itemsJson); } catch { }

    await updateDraftConfigPreserveTheme(
        id,
        { sectionTheme, layout: { columns, tabletColumns, mobileColumns, maxItems }, items },
        { title, slug },
    );

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Config CATEGORY_GRID_COMMERCE tersimpan.") });
}

export async function saveProductCarouselConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;

    const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);
    const description = (formData.get("description") as string | null)?.trim() ?? "";
    const showPrice = formData.get("showPrice") === "1";
    const showCta = formData.get("showCta") === "1";

    const productIds = parseNumArray((formData.getAll("productIds") as string[]) ?? []);

    try {
        if (productIds.length > 0) await validateExistence({ productIds });
    } catch (e: any) {
        return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal.") });
    }

    const sectionBgTheme = parseCustomPromoBgTheme(formData.get("sectionBgTheme") as string | null);

    await updateDraftConfigPreserveTheme(
        id,
        { sectionTheme, sectionBgTheme, title, description, productIds, showPrice, showCta },
        { title, slug },
    );

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Config PRODUCT_CAROUSEL tersimpan.") });
}

export async function clearProductCarouselProducts(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    await updateDraftConfigPreserveTheme(id, { productIds: [] });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Produk dikosongkan.") });
}

export async function clearProductListingProducts(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    await updateDraftConfigPreserveTheme(id, { productIds: [] });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Produk dikosongkan.") });
}

export async function removeCustomPromoVoucher(imageId: number, formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const cfg = normalizeCustomPromoConfig(row?.config);
    const next = cfg.voucherImageIds.filter((v: number) => v !== imageId);
    const nextLinks = { ...cfg.voucherLinks };
    delete nextLinks[imageId];
    await updateDraftConfigPreserveTheme(id, { ...cfg, voucherImageIds: next, voucherLinks: nextLinks });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Voucher dihapus.") });
}

export async function moveCustomPromoVoucher(move: string, formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    const [rawId, dir] = move.split(":");
    const target = Number(rawId);
    const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const cfg = normalizeCustomPromoConfig(row?.config);
    const idx = cfg.voucherImageIds.indexOf(target);
    if (idx < 0) return;
    const next = [...cfg.voucherImageIds];
    if (dir === "up" && idx > 0) [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    if (dir === "down" && idx < next.length - 1) [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    await updateDraftConfigPreserveTheme(id, { ...cfg, voucherImageIds: next });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Urutan diperbarui.") });
}

export async function clearCustomPromoVouchers(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const cfg = normalizeCustomPromoConfig(row?.config);
    await updateDraftConfigPreserveTheme(id, { ...cfg, voucherImageIds: [], voucherLinks: {} });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Semua voucher dihapus.") });
}

export async function clearHighlightCollectionProducts(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const cfg = legacyToNewConfig("HIGHLIGHT_COLLECTION", row?.config);
    await updateDraftConfigPreserveTheme(id, { ...cfg, productIds: [], items: [] });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Produk dikosongkan.") });
}

export async function saveHighlightCollectionConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    const theme = (formData.get("theme") as string | null)?.trim();
    const headline = (formData.get("headline") as string | null)?.trim() ?? "";
    const layout = (formData.get("layout") as string | null) ?? "FEATURED_LEFT";
    const heroImageId = parseNum(formData.get("heroImageId"));
    const description = (formData.get("description") as string | null)?.trim() ?? "";
    const ctaText = (formData.get("ctaText") as string | null)?.trim() ?? "";
    const ctaHref = (formData.get("ctaHref") as string | null)?.trim() ?? "";
    const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);
    const productIds = parseNumArray(formData.getAll("productIds") as string[]);

    try {
        const images = heroImageId ? [heroImageId] : [];
        await validateExistence({ productIds, imageIds: images });
    } catch (e: any) {
        return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal.") });
    }

    const items = productIds.map(pid => ({ type: "product", refId: pid, enabled: true }));

    const title = (formData.get("title") as string | null)?.trim() ?? headline;
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;

    await updateDraftConfigPreserveTheme(id, {
        mode: "products",
        title: headline,
        productIds,
        layout,
        heroImageId,
        headline,
        description,
        ctaText,
        ctaHref,
        sectionTheme,
        items,
    }, { title, slug });

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    const tk = theme || "theme_1";
    return redirect(`/admin/admin_dashboard/admin_pengaturan/toko?notice=${encodeURIComponent("Config tersimpan.")}&theme=${tk}`);
}

export async function clearHighlightCollectionHero(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const cfg: any = row?.config ?? {};
    await prisma.homepageSectionDraft.update({ where: { id }, data: { config: { ...cfg, heroImageId: null } } });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Hero dihapus.") });
}

export async function uploadImageToGallery(formData: FormData) {
    const file = formData.get("file");
    if (!file || !(file instanceof File)) return redirectBack({ error: encodeURIComponent("File wajib.") });
    const buffer = Buffer.from(await file.arrayBuffer());
    const compressed = await sharp(buffer).rotate().resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}.webp`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "gambar_upload");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), compressed);
    await prisma.gambarUpload.create({ data: { url: `/uploads/gambar_upload/${filename}`, title: file.name, tags: "" } });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Berhasil upload.") });
}

export async function uploadImageToGalleryAndAttach(formData: FormData) {
    try {
        const sectionId = Number(formData.get("sectionId"));
        const attach = (formData.get("attach") as string | null) ?? "";
        const file = formData.get("file");
        const pickedImageId = parseNum(formData.get("imageId"));

        let imageIdToUse = pickedImageId;
        if (file instanceof File && file.size > 0) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}.webp`;
            const uploadDir = path.join(process.cwd(), "public", "uploads", "gambar_upload");
            await fs.mkdir(uploadDir, { recursive: true });
            await fs.writeFile(path.join(uploadDir, filename), buffer);
            const created = await prisma.gambarUpload.create({ data: { url: `/uploads/gambar_upload/${filename}`, title: file.name } });
            imageIdToUse = created.id;
        }

        if (!imageIdToUse) return { ok: false, error: "Pilih gambar." };

        const section = await prisma.homepageSectionDraft.findUnique({ where: { id: sectionId } });
        if (!section) return { ok: false, error: "Section tidak ditemukan." };
        const type = String(section.type).toUpperCase();
        let cfg = legacyToNewConfig(type, section.config);

        if (attach === "HERO:imageId") cfg = { ...cfg, imageId: imageIdToUse, heroImageId: imageIdToUse };
        else if (attach === "CUSTOM_PROMO:append") {
            const vouchers = normalizeVoucherImageIds(cfg.voucherImageIds);
            if (!vouchers.includes(imageIdToUse)) cfg.voucherImageIds = [...vouchers, imageIdToUse];
        }
        else if (attach === "CONTACT:imageId") cfg = { ...cfg, imageId: imageIdToUse, showImage: true };
        else if (attach === "HIGHLIGHT_COLLECTION:heroImageId") cfg = { ...cfg, heroImageId: imageIdToUse };
        else if (attach.startsWith("ROOM_CATEGORY:")) {
            const key = attach.split(":")[1];
            const cards = normalizeRoomCards(cfg.cards);
            cfg.cards = cards.map(c => c.key === key ? { ...c, imageId: imageIdToUse } : c);
        }

        const themeKey = getThemeKeyFromRow(section);
        await prisma.homepageSectionDraft.update({ where: { id: sectionId }, data: { config: withThemeKey(cfg, themeKey) } });
        revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
        return { ok: true, imageId: imageIdToUse, notice: "Berhasil attach." };
    } catch (e: any) {
        return { ok: false, error: e.message };
    }
}



export async function saveGalleryConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    const sectionTheme = parseSectionTheme(formData.get("sectionTheme"));
    const imageIds = parseNumArray(formData.getAll("imageIds") as string[]);
    const layout = (formData.get("layout") as string) === "grid" ? "grid" : "carousel";
    await updateDraftConfigPreserveTheme(id, { sectionTheme, imageIds, layout });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Config GALLERY tersimpan.") });
}

export async function saveRoomCategoryConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const sectionTheme = parseSectionTheme(formData.get("sectionTheme"));
    const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const cfg = legacyToNewConfig("ROOM_CATEGORY", row?.config);
    const cards = normalizeRoomCards(cfg.cards).map(c => ({
        ...c,
        title: (formData.get(`title_${c.key}`) as string)?.trim() ?? c.title,
        kategoriId: parseNum(formData.get(`kategoriId_${c.key}`)),
    }));
    await updateDraftConfigPreserveTheme(id, { sectionTheme, cards }, { title });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Config ROOM_CATEGORY tersimpan.") });
}

export async function addRoomCategoryCard(formData: FormData) {
    const id = Number(formData.get("id"));
    const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const cfg = legacyToNewConfig("ROOM_CATEGORY", row?.config);
    const cards = normalizeRoomCards(cfg.cards);
    if (cards.length >= MAX_ROOM_CARDS) return redirectBack({ error: encodeURIComponent("Maksimal.") });
    const key = makeRoomCardKey();
    await updateDraftConfigPreserveTheme(id, { cards: [...cards, { key, title: "", description: "", badge: "", kategoriId: null, imageId: null }] });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Kartu ditambahkan.") });
}

export async function removeRoomCategoryCard(key: string, formData: FormData) {
    const id = Number(formData.get("id"));
    const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const cfg = legacyToNewConfig("ROOM_CATEGORY", row?.config);
    const next = normalizeRoomCards(cfg.cards).filter(c => c.key !== key);
    await updateDraftConfigPreserveTheme(id, { cards: next });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Kartu dihapus.") });
}

export async function moveRoomCategoryCard(move: string, formData: FormData) {
    const id = Number(formData.get("id"));
    const [key, dir] = move.split(":");
    const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const cfg = legacyToNewConfig("ROOM_CATEGORY", row?.config);
    const cards = normalizeRoomCards(cfg.cards);
    const idx = cards.findIndex(c => c.key === key);
    if (idx < 0) return;
    const next = [...cards];
    if (dir === "up" && idx > 0) [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    if (dir === "down" && idx < next.length - 1) [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    await updateDraftConfigPreserveTheme(id, { cards: next });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Urutan diperbarui.") });
}

export async function clearRoomCategoryCardImage(key: string, formData: FormData) {
    const id = Number(formData.get("id"));
    const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const cfg = legacyToNewConfig("ROOM_CATEGORY", row?.config);
    const cards = normalizeRoomCards(cfg.cards).map(c => c.key === key ? { ...c, imageId: null } : c);
    await updateDraftConfigPreserveTheme(id, { cards });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Gambar di-reset.") });
}

export async function autoGenerateContactCopy(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    const info = await prisma.informasiToko.findFirst({ select: { namaToko: true } });
    const brand = (info?.namaToko ?? "").trim() || "apixinterior";
    const headerText = `Hubungi ${brand} | Konsultasi Desain Interior`;
    const bodyText = `Tim ${brand} siap bantu desain interior dan produksi furniture custom. Klik salah satu kontak di bawah untuk mulai diskusi.`;
    const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const cfg = legacyToNewConfig("CONTACT", row?.config);
    await updateDraftConfigPreserveTheme(id, { ...cfg, headerText, bodyText });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Auto-generate berhasil.") });
}
