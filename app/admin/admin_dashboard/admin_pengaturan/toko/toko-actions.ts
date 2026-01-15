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
    DEFAULT_THEME_KEY,
    ADMIN_TOKO_PATH,
    isPngUrl,
    limitWords,
    toTitleCase,
    ensureScopeLabel,
    scoreImageMatch,
    getCategoryLabel,
    buildSeoSlug,
    pickBestImage,
    THEME_META_SLUG_PREFIX,
    SECTION_DEFS,
    sanitizeExistence,
} from "./toko-utils";
import { SectionTypeId, ThemeKey } from "./types";

export async function updateBackgroundTheme(formData: FormData) {
    const raw = (formData.get("backgroundTheme") as string | null)?.trim() ?? "FOLLOW_NAVBAR";
    const picked = raw || "FOLLOW_NAVBAR";

    const allowed = ["FOLLOW_NAVBAR", "NAVY_GOLD", "WHITE_GOLD", "NAVY_WHITE", "GOLD_NAVY", "GOLD_WHITE", "WHITE_NAVY"];
    if (!allowed.includes(picked)) return;

    const rawTk = (formData.get("themeKey") as string | null)?.trim();
    const themeKey = rawTk ? normalizeThemeKey(rawTk) : await getThemeKeyFromReferer();
    const slug = themeMetaSlug(themeKey);

    await ensureThemeMeta(themeKey);
    const meta = await prisma.homepageSectionDraft.findFirst({ where: { slug } });
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

    const clearHero = String(formData.get("clearHero") ?? "") === "1";
    const incomingImageId = parseNum(formData.get("imageId"));

    // Read existing config so we can preserve values when a form doesn't send them (e.g. clear-image form)
    const existing = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const existingCfg = (existing?.config ?? {}) as any;
    const headlineRaw = formData.get("headline");
    const subheadlineRaw = formData.get("subheadline");
    const ctaLabelRaw = formData.get("ctaLabel");
    const ctaHrefRaw = formData.get("ctaHref");
    const eyebrowRaw = formData.get("eyebrow");

    const parseLines = (v: any, max: number) =>
        String(typeof v === "string" ? v : "")
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, max);

    const badges = parseLines(formData.get("badges"), 6);
    const highlights = parseLines(formData.get("highlights"), 6);
    const trustChips = parseLines(formData.get("trustChips"), 8);

    const miniInfo = [1, 2, 3]
        .map((idx) => {
            const title = String(formData.get(`miniTitle${idx}`) ?? "").trim();
            const desc = String(formData.get(`miniDesc${idx}`) ?? "").trim();
            return title || desc ? { title, desc } : null;
        })
        .filter(Boolean) as { title: string; desc: string }[];

    const floatLookbookTitle = String(formData.get("floatLookbookTitle") ?? "").trim();
    const floatLookbookSubtitle = String(formData.get("floatLookbookSubtitle") ?? "").trim();
    const floatPromoTitle = String(formData.get("floatPromoTitle") ?? "").trim();
    const floatPromoText = String(formData.get("floatPromoText") ?? "").trim();

    const headline =
        typeof headlineRaw === "string" ? headlineRaw.trim() : String(existingCfg?.headline ?? "").trim();
    const subheadline =
        typeof subheadlineRaw === "string" ? subheadlineRaw.trim() : String(existingCfg?.subheadline ?? "").trim();
    const ctaLabel =
        typeof ctaLabelRaw === "string" ? ctaLabelRaw.trim() : String(existingCfg?.ctaLabel ?? "").trim();
    const ctaHref =
        typeof ctaHrefRaw === "string" ? ctaHrefRaw.trim() : String(existingCfg?.ctaHref ?? "").trim();
    const eyebrow =
        typeof eyebrowRaw === "string" ? eyebrowRaw.trim() : String(existingCfg?.eyebrow ?? "").trim();

    const rawSectionThemeMaybe =
        (formData.get("sectionTheme") as string | null) ?? (formData.get("heroTheme") as string | null) ?? null;
    const rawSectionThemeExisting = (existingCfg?.sectionTheme ?? existingCfg?.heroTheme ?? null) as string | null;
    const rawHeroTheme = (typeof rawSectionThemeMaybe === "string" ? rawSectionThemeMaybe : rawSectionThemeExisting)?.trim() ?? "FOLLOW_NAVBAR";
    const sectionThemeOpt = parseSectionTheme(rawHeroTheme);

    const existingImageId =
        Number.isFinite(Number(existingCfg?.imageId)) && Number(existingCfg?.imageId) > 0
            ? Number(existingCfg?.imageId)
            : Number.isFinite(Number(existingCfg?.heroImageId)) && Number(existingCfg?.heroImageId) > 0
                ? Number(existingCfg?.heroImageId)
                : null;

    const finalImageId = clearHero ? null : (incomingImageId ?? existingImageId);

    const { imageIds: validImageIds } = await sanitizeExistence({ imageIds: finalImageId ? [finalImageId] : [] });
    const validatedImageId = validImageIds && validImageIds.length > 0 ? validImageIds[0] : null;

    const heroContent = {
        eyebrow,
        badges,
        highlights,
        trustChips,
        miniInfo,
        floatLookbookTitle,
        floatLookbookSubtitle,
        floatPromoTitle,
        floatPromoText,
    };
    const themeKey = getThemeKeyFromRow(existing);
    const nextCfgBase = {
        ...(existingCfg ?? {}),
        eyebrow,
        headline,
        subheadline,
        ctaLabel,
        ctaHref,
        imageId: validatedImageId,
        heroImageId: validatedImageId,
        badges,
        highlights,
        trustChips,
        miniInfo,
        floatLookbookTitle,
        floatLookbookSubtitle,
        floatPromoTitle,
        floatPromoText,
        heroContent,
    };
    if (sectionThemeOpt) {
        nextCfgBase.sectionTheme = sectionThemeOpt;
        nextCfgBase.heroTheme = sectionThemeOpt;
    } else {
        delete (nextCfgBase as any).sectionTheme;
        delete (nextCfgBase as any).heroTheme;
    }

    const nextCfg = withThemeKey(nextCfgBase, themeKey);

    await updateDraftConfigPreserveTheme(id, nextCfg);

    // heroHeadline etc tetap di luar config untuk schema optimization (jika ada di schema)
    await prisma.homepageSectionDraft.update({
        where: { id },
        data: {
            heroHeadline: headline || null,
            heroSubheadline: subheadline || null,
            heroCtaLabel: ctaLabel || null,
            heroCtaHref: ctaHref || null,
            heroContent,
        },
    });

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    return redirectBack({ notice: encodeURIComponent("Config HERO tersimpan.") });
}


export async function saveTextSectionConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;
    const text = (formData.get("text") as string | null)?.trim() ?? "";
    const mode = String(formData.get("mode") ?? "body") as any;
    const align = String(formData.get("align") ?? "left") as any;
    const width = String(formData.get("width") ?? "normal") as any;
    const sectionTheme = String(formData.get("sectionTheme") ?? "FOLLOW_NAVBAR");
    const blocksJson = formData.get("blocksJson") as string | null;
    let blocks = [];
    try { if (blocksJson) blocks = JSON.parse(blocksJson); } catch { }
    await updateDraftConfigPreserveTheme(id, { text, mode, align, width, sectionTheme, blocks }, { title, slug });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    return redirectBack({ notice: encodeURIComponent("Config TEXT_SECTION tersimpan.") });
}


export async function saveProductListingConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    const anchor = String(formData.get("returnTo") ?? "").trim();

    const titleRaw = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;

    const rawSectionTheme = (formData.get("sectionTheme") as string | null) ?? "";
    const normalizedSectionTheme = normalizeThemeAttr(rawSectionTheme);
    const sectionThemeValue =
        normalizedSectionTheme === "FOLLOW_NAVBAR" ||
            (normalizedSectionTheme && ALLOWED_THEMES.includes(normalizedSectionTheme as any))
            ? normalizedSectionTheme
            : "FOLLOW_NAVBAR";

    const clearProducts = ((formData.get("clearProducts") as string | null) ?? "").trim() === "1";
    const productIds = clearProducts ? [] : parseNumArray((formData.getAll("productIds") as string[]) ?? []);

    let validProductIds: number[] = [];
    if (productIds.length > 0) {
        const sanitized = await sanitizeExistence({ productIds });
        validProductIds = sanitized.productIds ?? [];
    }

    const sectionBgTheme = parseCustomPromoBgTheme(formData.get("sectionBgTheme") as string | null);

    await updateDraftConfigPreserveTheme(id, {
        sectionTheme: sectionThemeValue,
        sectionBgTheme,
        title: titleRaw,
        productIds: validProductIds,
    }, { title: titleRaw, slug });

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    return redirectBack({ notice: encodeURIComponent("Config PRODUCT_LISTING tersimpan."), anchor, sectionId: id });
}


export async function saveCustomPromoConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;

    const layout = String(formData.get("layout") ?? "carousel").toLowerCase() as any;
    const sectionBgTheme = parseCustomPromoBgTheme(formData.get("sectionBgTheme") as string | null);

    const voucherImageIds = parseNumArray(formData.getAll("voucherImageIds") as string[]);
    const voucherLinks: Record<number, string> = {};

    // DEBUG: Print all form keys to see what's coming in
    const debugKeys: string[] = [];
    formData.forEach((_, k) => debugKeys.push(k));
    console.log("DEBUG_TOK0_ACTIONS: Incoming Form Keys:", debugKeys);

    for (const vid of voucherImageIds) {
        // Parse mode and fields from VoucherLinkEditor
        const modeKey = `voucherLinkMode_${vid}`;
        const catKey = `voucherCategory_${vid}`;
        const manualKey = `voucherLink_${vid}`;

        const mode = (formData.get(modeKey) as string | null)?.trim();
        const catIdRaw = formData.get(catKey);
        const manualLinkRaw = formData.get(manualKey);

        console.log(`DEBUG_TOK0_ACTIONS: Processing VID=${vid}, Mode=${mode}`, { catIdRaw, manualLinkRaw });

        if (mode === "category") {
            const catId = (catIdRaw as string | null)?.trim();
            if (catId) {
                voucherLinks[vid] = `category:${catId}`;
                console.log(`DEBUG_TOK0_ACTIONS: Set VID=${vid} to Category=${catId}`);
            } else {
                console.log(`DEBUG_TOK0_ACTIONS: VID=${vid} Mode=Category but ID is empty!`);
            }
        } else if (mode === "manual") {
            const manualLink = (manualLinkRaw as string | null)?.trim();
            if (manualLink) {
                voucherLinks[vid] = manualLink;
                console.log(`DEBUG_TOK0_ACTIONS: Set VID=${vid} to Manual=${manualLink}`);
            }
        } else {
            // Fallback for legacy or direct inputs if any
            const simpleLink = (formData.get(`link_${vid}`) as string | null)?.trim();
            if (simpleLink) voucherLinks[vid] = simpleLink;
        }
    }

    const { imageIds: validVoucherIds } = await sanitizeExistence({ imageIds: voucherImageIds });

    await updateDraftConfigPreserveTheme(
        id,
        { layout, sectionBgTheme, voucherImageIds: validVoucherIds ?? [], voucherLinks },
        { title, slug },
    );

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    return redirectBack({ notice: encodeURIComponent("Config CUSTOM_PROMO tersimpan.") });
}


export async function saveSocialConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;
    const iconKeys = (formData.getAll("iconKeys") as string[]) ?? [];
    const iconsOnly = formData.get("iconsOnly") === "1";

    const rows = await prisma.mediaSosial.findMany({
        where: { iconKey: { in: iconKeys } },
        select: { iconKey: true, nama: true }
    });
    const selected = iconKeys.map(k => {
        const r = rows.find((x: any) => x.iconKey === k);
        return { iconKey: k, nama: r?.nama ?? k };
    });

    const rawSectionTheme = (formData.get("sectionTheme") as string | null) ?? "";
    const sectionTheme = normalizeThemeAttr(rawSectionTheme);
    const sectionThemeValue =
        sectionTheme === "FOLLOW_NAVBAR" ||
            (sectionTheme && ALLOWED_THEMES.includes(sectionTheme as any))
            ? sectionTheme
            : "FOLLOW_NAVBAR";

    await updateDraftConfigPreserveTheme(id, {
        selected,
        display: { iconsOnly },
        sectionTheme: sectionThemeValue,
    }, { title, slug });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Config SOCIAL tersimpan.") });
}


export async function saveFooterConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;

    const whatsapp = (formData.get("whatsapp") as string | null)?.trim() ?? "";
    const email = (formData.get("email") as string | null)?.trim() ?? "";
    const address = (formData.get("address") as string | null)?.trim() ?? "";
    const instagram = (formData.get("instagram") as string | null)?.trim() ?? "";
    const facebook = (formData.get("facebook") as string | null)?.trim() ?? "";
    const useGlobalContact = formData.get("useGlobalContact") === "1";
    const useGlobalSocial = formData.get("useGlobalSocial") === "1";

    const menuLinksRaw = String(formData.get("menuLinks") ?? "[]");
    const footerTagsRaw = String(formData.get("footerTags") ?? "[]");
    let menuLinks = [];
    try { menuLinks = JSON.parse(menuLinksRaw); } catch { }
    let footerTags = [];
    try { footerTags = JSON.parse(footerTagsRaw); } catch { }

    const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);

    await updateDraftConfigPreserveTheme(id, {
        ...(sectionTheme ? { sectionTheme } : {}),
        whatsapp, email, address, instagram, facebook,
        useGlobalContact, useGlobalSocial,
        menuLinks, footerTags
    }, { title, slug });

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Config FOOTER tersimpan.") });
}


export async function saveBranchesConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;

    const branchIds = parseNumArray((formData.getAll("branchIds") as string[]) ?? []);
    const layout = String(formData.get("layout") ?? "carousel") === "grid" ? "grid" : "carousel";

    const rawSectionTheme = (formData.get("sectionTheme") as string | null) ?? "";
    const sectionTheme = normalizeThemeAttr(rawSectionTheme);
    const sectionThemeValue =
        sectionTheme === "FOLLOW_NAVBAR" ||
            (sectionTheme && ALLOWED_THEMES.includes(sectionTheme as any))
            ? sectionTheme
            : "FOLLOW_NAVBAR";

    const rawBg = (formData.get("sectionBgTheme") as string | null) ?? "";
    const sectionBgTheme = (rawBg === "GOLD" || rawBg === "WHITE") ? rawBg : "NAVY";

    const { branchIds: validBranchIds } = await sanitizeExistence({ branchIds });

    await updateDraftConfigPreserveTheme(id, {
        branchIds: validBranchIds ?? [],
        layout,
        sectionTheme: sectionThemeValue,
        sectionBgTheme,
    }, { title, slug });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Config BRANCHES tersimpan.") });
}


export async function saveContactConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;

    const hubungiIds = parseNumArray((formData.getAll("hubungiIds") as string[]) ?? []);
    const mode = String(formData.get("mode") ?? "SPLIT_IMAGE_STACK") as any;
    const showImage = formData.get("showImage") === "1";
    const imageId = parseNum(formData.get("imageId"));
    const headerText = (formData.get("headerText") as string | null)?.trim() ?? "";
    const bodyText = (formData.get("bodyText") as string | null)?.trim() ?? "";

    const buttonLabels: Record<number, string> = {};
    for (const hid of hubungiIds) {
        const label = (formData.get(`label_${hid}`) as string | null)?.trim() ?? "";
        if (label) buttonLabels[hid] = label;
    }

    const { hubungiIds: validHubungiIds, imageIds: validImageIds } = await sanitizeExistence({ hubungiIds, imageIds: imageId ? [imageId] : [] });
    const validatedImageId = validImageIds && validImageIds.length > 0 ? validImageIds[0] : null;

    const rawSectionTheme = (formData.get("sectionTheme") as string | null) ?? "";
    const sectionTheme = normalizeThemeAttr(rawSectionTheme);
    const sectionThemeValue =
        sectionTheme === "FOLLOW_NAVBAR" ||
            (sectionTheme && ALLOWED_THEMES.includes(sectionTheme as any))
            ? sectionTheme
            : "FOLLOW_NAVBAR";

    await updateDraftConfigPreserveTheme(
        id,
        {
            hubungiIds: validHubungiIds ?? [],
            buttonLabels,
            mode,
            showImage,
            imageId: validatedImageId,
            headerText,
            bodyText,
            sectionTheme: sectionThemeValue
        },
        { title, slug },
    );

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    return redirectBack({ notice: encodeURIComponent("Config CONTACT tersimpan.") });
}


export async function publishDraftToWebsite(formData: FormData) {
    const rawTk = formData.get("themeKey") as string | null;
    const themeKey = rawTk ? normalizeThemeKey(rawTk) : await getThemeKeyFromReferer();
    const meta = await prisma.homepageSectionDraft.findFirst({ where: { slug: themeMetaSlug(themeKey) } });
    if (!meta) return { ok: false, error: "Belum ada theme aktif." };

    const allDrafts = await prisma.homepageSectionDraft.findMany({ orderBy: { sortOrder: "asc" } });
    const drafts = allDrafts.filter((d: any) => {
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
        ...drafts.map((d: any) =>
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

export async function toggleDraft(formData: FormData) {
    const id = Number(formData.get("id"));
    const currentEnabled = (formData.get("currentEnabled") as string | null) === "true";
    if (!id || Number.isNaN(id)) return;

    await prisma.homepageSectionDraft.update({
        where: { id },
        data: { enabled: !currentEnabled },
    });

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    revalidatePath("/");
    return redirectBack({ notice: encodeURIComponent("Status section diubah.") });
}

export async function deleteDraft(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    await prisma.homepageSectionDraft.delete({ where: { id } });

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    revalidatePath("/");
    return redirectBack({ notice: encodeURIComponent("Section draft berhasil dihapus.") });
}

export async function createDraftSection(formData: FormData) {
    const themeKey = await getThemeKeyFromReferer();
    const meta = await prisma.homepageSectionDraft.findFirst({ where: { slug: themeMetaSlug(themeKey) } });
    if (!meta) {
        return redirectBack({ error: encodeURIComponent("Buat theme dulu dengan tombol + Theme, lalu susun section di dalam theme tersebut.") });
    }

    const typeRaw = (formData.get("type") as string | null) ?? null;
    const titleRaw = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";

    const def = SECTION_DEFS.find((d) => d.type === typeRaw);
    if (!def) return redirectBack({ error: encodeURIComponent("Jenis section tidak valid.") });

    const last = await prisma.homepageSectionDraft.findFirst({ orderBy: { sortOrder: "desc" } });
    const sortOrder = last ? last.sortOrder + 1 : 1;

    const slug = slugRaw ? slugify(slugRaw) : def.defaultSlug;
    if (slug === "__active_theme__" || slug.startsWith(THEME_META_SLUG_PREFIX)) {
        return redirectBack({ error: encodeURIComponent("Slug tersebut diproteksi oleh sistem.") });
    }

    await prisma.homepageSectionDraft.create({
        data: {
            type: def.type as any,
            title: titleRaw,
            slug: slug.length ? slug : null,
            enabled: true,
            sortOrder,
            config: withThemeKey(def.defaultConfig ?? {}, themeKey),
        },
    });

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    revalidatePath("/");
    return redirectBack({ notice: encodeURIComponent("Section draft berhasil ditambahkan.") });
}

export async function updateDraftMeta(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";

    const slug = slugRaw ? slugify(slugRaw) : null;
    if (slug === "__active_theme__" || (slug && slug.startsWith(THEME_META_SLUG_PREFIX))) {
        return redirectBack({ error: encodeURIComponent("Slug tersebut diproteksi oleh sistem.") });
    }

    await prisma.homepageSectionDraft.update({
        where: { id },
        data: { title, slug },
    });

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    revalidatePath("/");
    return redirectBack({ notice: encodeURIComponent("Metadata section berhasil disimpan.") });
}


export async function saveCategoryGridConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;

    const existingRow = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const existingCfg = legacyToNewConfig("CATEGORY_GRID", existingRow?.config);
    const existingItems = Array.isArray((existingCfg as any)?.items) ? (existingCfg as any).items : [];
    const existingCoverByKategori = new Map<number, number | null>(
        existingItems.map((it: any) => [Number(it?.kategoriId), (Number(it?.coverImageId) || 0) > 0 ? Number(it.coverImageId) : null])
    );

    const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);

    const columnsRaw = Number((formData.get("columns") as string | null) ?? "3");
    const columns = clampInt(columnsRaw, 2, 6);

    const maxItemsStr = (formData.get("maxItems") as string | null)?.trim() ?? "";
    const maxItems = maxItemsStr ? clampInt(Number(maxItemsStr), 1, 60) : null;

    const selectedKategoriIds = parseNumArray((formData.getAll("kategoriIds") as string[]) ?? []);

    const items = selectedKategoriIds.map((kategoriId) => {
        const coverKey = `coverImageId_${kategoriId}`;
        let cover: number | null = null;

        if (formData.has(coverKey)) {
            const c = parseNum(formData.get(coverKey));
            cover = c && c > 0 ? c : null;
        } else {
            const prev = existingCoverByKategori.get(kategoriId);
            cover = (typeof prev === "number" && prev > 0) ? prev : null;
        }

        return { kategoriId, coverImageId: cover };
    });

    const finalItems = maxItems ? items.slice(0, maxItems) : items;
    const finalKategoriIds = finalItems.map((it) => it.kategoriId);
    const coverIds = finalItems
        .map((it) => it.coverImageId)
        .filter((v): v is number => typeof v === "number" && v > 0);

    const { kategoriIds: validKategoriIds, imageIds: validCoverIds } = await sanitizeExistence({ kategoriIds: finalKategoriIds, imageIds: coverIds });
    const validCoverSet = new Set(validCoverIds ?? []);
    const validKategoriSet = new Set(validKategoriIds ?? []);

    const sanitizedItems = finalItems.filter(it => validKategoriSet.has(it.kategoriId)).map(it => ({
        ...it,
        coverImageId: (it.coverImageId && validCoverSet.has(it.coverImageId)) ? it.coverImageId : null
    }));

    await updateDraftConfigPreserveTheme(
        id,
        {
            ...(sectionTheme ? { sectionTheme } : {}),
            layout: { columns, ...(maxItems ? { maxItems } : {}) },
            items: sanitizedItems,
        },
        { title, slug },
    );

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    return redirectBack({ notice: encodeURIComponent("Config CATEGORY_GRID tersimpan.") });
}


export async function saveCategoryGridCommerceConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    const anchor = String(formData.get("returnTo") ?? "").trim();

    const titleRaw = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const descriptionRaw = (formData.get("description") as string | null)?.trim() ?? "";

    const slug = slugRaw ? slugify(slugRaw) : null;
    const modeRaw = String(formData.get("layoutMode") ?? "").toLowerCase().trim();
    const mode = modeRaw === "reverse" ? "reverse" : modeRaw === "commerce" ? "commerce" : "clean";
    const rawSectionTheme = (formData.get("sectionTheme") as string | null) ?? "";
    const normalizedSectionTheme = normalizeThemeAttr(rawSectionTheme);
    const sectionThemeValue =
        normalizedSectionTheme === "FOLLOW_NAVBAR" ||
            (normalizedSectionTheme && ALLOWED_THEMES.includes(normalizedSectionTheme as any))
            ? normalizedSectionTheme
            : "FOLLOW_NAVBAR";

    await prisma.homepageSectionDraft.update({
        where: { id },
        data: {
            title: titleRaw,
            slug,
            description: descriptionRaw || null,
        },
    });

    const itemsJsonRaw = formData.get("itemsJson");
    if (itemsJsonRaw === null) {
        // If no itemsJson, we might be saving from a simple form. Re-read existing config.
        const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
        const cfg = (row?.config ?? {}) as any;
        const finalCfg = { ...cfg, sectionTheme: sectionThemeValue, layout: { ...cfg.layout, mode } };
        await prisma.homepageSectionDraft.update({
            where: { id },
            data: { config: finalCfg },
        });
        return redirectBack({ notice: encodeURIComponent("Theme Section CATEGORY_GRID_COMMERCE tersimpan.") });
    }

    const itemsJson = (itemsJsonRaw as string) || "[]";
    let parsed: any[] = [];
    try {
        const raw = JSON.parse(itemsJson);
        parsed = Array.isArray(raw) ? raw : [];
    } catch {
        parsed = [];
    }

    const tabsJsonRaw = formData.get("tabsJson");
    const tabsJson = (tabsJsonRaw as string) || "[]";
    let tabsParsed: Array<{ id: string; label: string }> = [];
    try {
        const rawTabs = JSON.parse(tabsJson);
        tabsParsed = Array.isArray(rawTabs) ? rawTabs : [];
    } catch {
        tabsParsed = [];
    }

    const tabs = tabsParsed
        .map((t) => ({
            id: String(t?.id ?? "").trim(),
            label: String(t?.label ?? "").trim(),
        }))
        .filter((t) => t.id && t.label)
        .slice(0, 6);
    const tabIds = new Set(tabs.map((t) => t.id));
    const fallbackTabId = tabs[0]?.id ?? "";

    let items: any[] = [];
    for (const it of parsed) {
        const type = String(it?.type ?? "category") === "custom" ? "custom" : "category";
        const tabIdRaw = String(it?.tabId ?? "").trim();
        const tabId = tabIdRaw && tabIds.has(tabIdRaw) ? tabIdRaw : fallbackTabId;

        if (type === "custom") {
            items.push({
                type: "custom",
                label: String(it?.label ?? "").trim(),
                href: String(it?.href ?? "").trim(),
                imageId: Number(it?.imageId) || null,
                tabId: tabId,
            });
        } else {
            items.push({
                type: "category",
                kategoriId: Number(it?.kategoriId),
                slug: String(it?.slug ?? "").trim(),
                label: String(it?.label ?? "").trim(),
                imageId: Number(it?.imageId) || null,
                tabId: tabId,
            });
        }
    }

    const finalCfg = {
        sectionTheme: sectionThemeValue,
        layout: { columns: 4, tabletColumns: 3, mobileColumns: 2, maxItems: 60, mode },
        items,
        tabs,
    };

    const themeKey = getThemeKeyFromRow(await prisma.homepageSectionDraft.findUnique({ where: { id } }));
    await prisma.homepageSectionDraft.update({
        where: { id },
        data: { config: withThemeKey(finalCfg, themeKey) },
    });

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    return redirectBack({ notice: encodeURIComponent("Config CATEGORY_GRID_COMMERCE tersimpan."), anchor });
}


export async function saveProductCarouselConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;

    const existingRow = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const existingCfg = legacyToNewConfig("PRODUCT_CAROUSEL", existingRow?.config);

    const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);
    const description = (formData.get("description") as string | null)?.trim() ?? (existingCfg as any)?.description ?? "";
    const showPrice = formData.has("showPrice") ? formData.get("showPrice") === "1" || formData.get("showPrice") === "true" : Boolean((existingCfg as any)?.showPrice);
    const showCta = formData.has("showCta") ? formData.get("showCta") === "1" || formData.get("showCta") === "true" : Boolean((existingCfg as any)?.showCta);

    const productIds = parseNumArray((formData.getAll("productIds") as string[]) ?? []);

    try {
        if (productIds.length > 0) {
            await validateExistence({ productIds });
        }
    } catch (e: any) {
        return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal.") });
    }

    await updateDraftConfigPreserveTheme(
        id,
        {
            ...(sectionTheme ? { sectionTheme } : {}),
            title,
            description,
            productIds,
            showPrice,
            showCta
        },
        { title, slug },
    );

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    return redirectBack({ notice: encodeURIComponent("Config PRODUCT_CAROUSEL tersimpan.") });
}



export async function pickAllProductListingProducts(formData: FormData) {
    const id = parseNum(formData.get("id"));
    if (!id) return;

    const latestProducts = await prisma.produk.findMany({
        orderBy: { id: "desc" },
        take: 300,
        select: { id: true },
    });

    const productIds = latestProducts.map((p: any) => Number(p.id));

    await updateDraftConfigPreserveTheme(id, { productIds });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("300 produk terbaru berhasil dipilih.") });
}

export async function clearProductCarouselProducts(formData: FormData) {

    const id = parseNum(formData.get("id"));
    if (!id) return;
    await updateDraftConfigPreserveTheme(id, { productIds: [] });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Produk dikosongkan.") });
}

export async function clearProductListingProducts(formData: FormData) {
    const id = parseNum(formData.get("id"));
    if (!id) return;
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
    const theme = (((formData.get("theme") as string | null) ?? "").trim());

    // Explicit "clear" actions (so admin bisa benar-benar mengosongkan pilihan)
    const clearHero = (((formData.get("clearHero") as string | null) ?? "").trim() === "1");
    const clearProducts = (((formData.get("clearProducts") as string | null) ?? "").trim() === "1");

    // NOTE:
    // Karena picker gambar & produk bisa di-set via action terpisah, form "Simpan" ini
    // harus merge dengan config yang sudah ada supaya tidak menghapus pilihan yang tidak ikut terkirim.
    const existingRowForMerge = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const existingConfigForMerge = (existingRowForMerge?.config ?? {}) as any;
    const existingTitleRaw =
        typeof (existingConfigForMerge as any)?.title === "string" ? String((existingConfigForMerge as any).title).trim() : "";
    const existingHeadlineRaw =
        typeof (existingConfigForMerge as any)?.headline === "string"
            ? String((existingConfigForMerge as any).headline).trim()
            : "";

    // "Judul tampil" untuk Highlight Collection bersifat opsional.
    // Penting: sebagian tombol (mis. hapus hero) bisa submit form tanpa semua field hadir,
    // jadi kita harus merge dengan existing config agar tidak mengosongkan field lain.
    const hasHeadlineField = formData.has("headline");
    const headlineFromForm = (((formData.get("headline") as string | null) ?? "")).trim();
    const headline = hasHeadlineField ? headlineFromForm : existingHeadlineRaw;

    // Backward compatible key: `title` kita samakan dengan `headline` ketika field hadir.
    // Kalau field tidak hadir, pertahankan existing `title`.
    const title = hasHeadlineField ? headline : (existingTitleRaw || "");

    const existingLayoutRaw = String((existingConfigForMerge as any)?.layout ?? "FEATURED_LEFT");
    const layoutRawFromForm = (formData.get("layout") as string | null)?.trim();
    const layoutRaw = formData.has("layout") ? (layoutRawFromForm ?? existingLayoutRaw) : existingLayoutRaw;
    const layout =
        layoutRaw === "FEATURED_TOP" || layoutRaw === "GRID" || layoutRaw === "CARDS" ? layoutRaw : "FEATURED_LEFT";

    // Hero image (opsional)
    const heroImageIdRaw = (formData.get("heroImageId") as string | null);
    const heroImageIdNum = heroImageIdRaw && heroImageIdRaw.trim() ? Number(heroImageIdRaw) : NaN;
    const heroImageId = Number.isFinite(heroImageIdNum) && heroImageIdNum > 0 ? heroImageIdNum : undefined;

    const existingHeroNum = Number((existingConfigForMerge as any)?.heroImageId);
    const existingHeroImageId: number | null =
        Number.isFinite(existingHeroNum) && existingHeroNum > 0 ? existingHeroNum : null;

    const nextHeroImageId: number | null = clearHero ? null : heroImageId !== undefined ? heroImageId : existingHeroImageId;

    const existingDescriptionRaw =
        typeof (existingConfigForMerge as any)?.description === "string"
            ? String((existingConfigForMerge as any).description).trim()
            : "";
    const descriptionFromForm = (((formData.get("description") as string | null) ?? "")).trim();
    const description = formData.has("description") ? descriptionFromForm : existingDescriptionRaw;

    const existingCtaTextRaw =
        typeof (existingConfigForMerge as any)?.ctaText === "string" ? String((existingConfigForMerge as any).ctaText).trim() : "";
    const ctaTextFromForm = (((formData.get("ctaText") as string | null) ?? "")).trim();
    const ctaText = formData.has("ctaText") ? ctaTextFromForm : existingCtaTextRaw;

    const existingCtaHrefRaw =
        typeof (existingConfigForMerge as any)?.ctaHref === "string" ? String((existingConfigForMerge as any).ctaHref).trim() : "";
    const ctaHrefFromForm = (((formData.get("ctaHref") as string | null) ?? "")).trim();
    const ctaHref = formData.has("ctaHref") ? ctaHrefFromForm : existingCtaHrefRaw;

    const existingSectionThemeRaw =
        typeof (existingConfigForMerge as any)?.sectionTheme === "string"
            ? String((existingConfigForMerge as any).sectionTheme).trim()
            : "";
    const sectionThemeFromForm = (((formData.get("sectionTheme") as string | null) ?? "")).trim();
    const sectionThemeCandidate = formData.has("sectionTheme") ? sectionThemeFromForm : existingSectionThemeRaw;
    const sectionTheme = parseSectionTheme(sectionThemeCandidate);


    // MVP: kurasi produk (ordered)
    const productIdsFromForm = parseNumArray((formData.getAll("productIds") as string[]) ?? []);
    // Marker dari ProductCarouselPicker
    const hasProductIdsField = String(formData.get("productIds__present") ?? "") === "1";

    const existingProductIds = Array.isArray((existingConfigForMerge as any)?.productIds)
        ? parseNumArray((existingConfigForMerge as any).productIds as any)
        : [];

    const rawProductIds = clearProducts ? [] : hasProductIdsField ? productIdsFromForm : existingProductIds;
    const productIds = Array.from(new Set(rawProductIds));

    // Validasi
    const imageIdsToValidate = nextHeroImageId ? [nextHeroImageId] : [];
    const { productIds: validProductIds, imageIds: validImageIds } = await sanitizeExistence({ productIds, imageIds: imageIdsToValidate });
    const validatedHeroImageId = validImageIds && validImageIds.length > 0 ? validImageIds[0] : null;

    // items
    const existingItems = Array.isArray((existingConfigForMerge as any)?.items) ? (existingConfigForMerge as any).items : null;
    const shouldRegenerateItems = clearProducts || hasProductIdsField || !existingItems;
    const items = shouldRegenerateItems
        ? (validProductIds ?? []).map((pid) => ({ type: "product", refId: pid, enabled: true }))
        : existingItems;

    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;

    await updateDraftConfigPreserveTheme(
        id,
        {
            // Backward compatible keys
            mode: "products",
            title,
            productIds: validProductIds,

            // New keys
            layout,
            heroImageId: validatedHeroImageId,

            badgeText: "",
            headline,
            description,
            ctaText,
            ctaHref,
            ...(sectionTheme ? { sectionTheme } : {}),
            items,
        },
        { title, slug }
    );

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");

    const msg =
        clearHero && clearProducts
            ? "Hero & produk HIGHLIGHT_COLLECTION dikosongkan."
            : clearHero
                ? "Hero HIGHLIGHT_COLLECTION dihapus."
                : clearProducts
                    ? "Produk HIGHLIGHT_COLLECTION dikosongkan."
                    : "Config HIGHLIGHT_COLLECTION tersimpan.";

    const themeKey = theme || String((existingConfigForMerge as any)?.__themeKey ?? "theme_1");

    const noticeEnc = encodeURIComponent(msg);
    return redirect(`/admin/admin_dashboard/admin_pengaturan/toko?notice=${noticeEnc}&theme=${encodeURIComponent(themeKey)}`);

}

export async function clearHighlightCollectionHero(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const theme = (((formData.get("theme") as string | null) ?? "").trim());

    const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    if (!row) {
        const sp = new URLSearchParams();
        if (theme) sp.set("theme", theme);
        sp.set("error", encodeURIComponent("Section tidak ditemukan."));
        return redirect(`/admin/admin_dashboard/admin_pengaturan/toko?${sp.toString()}`);
    }

    const existingCfg: any = (row as any).config ?? {};
    const nextCfg: any = { ...(typeof existingCfg === "object" && existingCfg ? existingCfg : {}) };
    nextCfg.heroImageId = null;

    await prisma.homepageSectionDraft.update({
        where: { id },
        data: { config: nextCfg },
    });

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");

    const sp = new URLSearchParams();
    if (theme) sp.set("theme", theme);
    sp.set("notice", encodeURIComponent("Hero HIGHLIGHT_COLLECTION dihapus."));
    return redirect(`/admin/admin_dashboard/admin_pengaturan/toko?${sp.toString()}`);
}

export async function autoGenerateHighlightCollection(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    const theme = (((formData.get("theme") as string | null) ?? "").trim());

    const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    if (!row) return;

    const existingCfg: any = (row as any).config ?? {};
    const nextCfg = {
        ...existingCfg,
        headline: "Koleksi Pilihan",
        description: "Temukan produk terbaik kami yang dikurasi khusus untuk keindahan ruangan Anda.",
        ctaText: "Lihat Semua",
        ctaHref: "/kategori",
    };

    await prisma.homepageSectionDraft.update({
        where: { id },
        data: {
            enabled: true,
            config: nextCfg
        }
    });

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");

    const sp = new URLSearchParams();
    if (theme) sp.set("theme", theme);
    sp.set("notice", encodeURIComponent("Text Highlight Collection berhasil di-generate otomatis."));
    return redirect(`/admin/admin_dashboard/admin_pengaturan/toko?${sp.toString()}`);
}


export async function uploadImageToGallery(formData: FormData) {
    const file = formData.get("file");
    const title = (formData.get("title") as string | null)?.trim() ?? null;
    const tags = (formData.get("tags") as string | null)?.trim() ?? "";

    if (!file || !(file instanceof File)) {
        return redirectBack({ error: encodeURIComponent("File gambar wajib diupload.") });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Auto-compress ke WebP supaya file kecil & tajam
    const compressed = await sharp(buffer)
        .rotate()
        .resize({ width: 1920, withoutEnlargement: true }) // cukup untuk desktop, hemat size
        .webp({ quality: 78 })
        .toBuffer();

    const uploadDir = path.join(process.cwd(), "public", "uploads", "gambar_upload");
    await fs.mkdir(uploadDir, { recursive: true });

    const originalName = file.name || "image";
    const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "_").replace(/\.webp$/i, "");
    const filename = `${Date.now()}-${safeName}.webp`;
    const filePath = path.join(uploadDir, filename);
    const publicUrl = `/uploads/gambar_upload/${filename}`;

    await fs.writeFile(filePath, compressed);

    await prisma.gambarUpload.create({
        data: {
            url: publicUrl,
            title: title ?? safeName,
            tags,
            categoryId: null,
            subcategoryId: null,
        },
    });

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Gambar berhasil diupload ke galeri.") });
}

export async function uploadImageToGalleryAndAttach(formData: FormData): Promise<{ ok: true; imageId: number; image?: { id: number; url?: string; title?: string; tags?: string | null } | null; notice?: string } | { ok: false; error: string }> {
    try {
        const sectionId = Number(formData.get("sectionId"));
        const attach = (formData.get("attach") as string | null) ?? "";
        const kategoriIdRaw = formData.get("kategoriId") as string | null;
        const kategoriId = kategoriIdRaw ? Number(kategoriIdRaw) : NaN;

        const file = formData.get("file");
        const title = (formData.get("title") as string | null)?.trim() ?? null;
        const tags = (formData.get("tags") as string | null)?.trim() ?? "";

        const pickedRaw = ((formData.get("imageId") as string | null) ?? "").trim();
        const pickedMatch = pickedRaw.match(/^\s*(\d+)/);
        const pickedImageId = pickedMatch ? Number(pickedMatch[1]) : NaN;

        const hasUploadFile = file instanceof File && file.size > 0;
        const isCommerceIconAttach = attach.startsWith("CATEGORY_GRID_COMMERCE:icon:");
        const isCommerceCustomAttach = attach.startsWith("CATEGORY_GRID_COMMERCE:custom:");

        let imageIdToUse: number | null =
            Number.isFinite(pickedImageId) && pickedImageId > 0 ? pickedImageId : null;
        let finalImageObj: { id: number; url?: string; title?: string; tags?: string | null } | null = null;
        if (!sectionId || Number.isNaN(sectionId)) {
            return { ok: false, error: "SectionId tidak valid." };
        }

        const section = await prisma.homepageSectionDraft.findUnique({ where: { id: sectionId } });
        if (!section) {
            return { ok: false, error: "Section draft tidak ditemukan." };
        }

        const sectionType = String(section.type || "").toUpperCase() as SectionTypeId;
        const sectionCfg = legacyToNewConfig(sectionType, section.config);

        if (!hasUploadFile && !imageIdToUse) {
            return { ok: false, error: "Pilih gambar dari galeri atau upload file." };
        }

        const layoutOverride = (formData.get("layout") as string | null)?.toLowerCase().trim() || null;

        if (hasUploadFile) {
            if (isCommerceIconAttach || isCommerceCustomAttach) {
                // Relaxed: allow any image format
                /*
                const mime = String((file as File).type ?? "").toLowerCase();
                const mimeOk = mime === "image/png";
                const nameOk = /\.png$/i.test(String((file as File).name ?? ""));
                if (!mimeOk && !nameOk) {
                    return { ok: false, error: "Icon CATEGORY_GRID_COMMERCE wajib PNG." };
                }
                */
            }

            // 1) Save file to /public/uploads/gambar_upload (same as galeri) dengan auto compress -> WebP
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const uploadDir = path.join(process.cwd(), "public", "uploads", "gambar_upload");
            await fs.mkdir(uploadDir, { recursive: true });

            const safeName = (title ?? (file as File).name ?? "image")
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-_\.]/g, "")
                .replace(/\.[^/.]+$/, "")
                .slice(0, 60);

            const isPng = isCommerceIconAttach || isCommerceCustomAttach;
            const ext = isPng ? "png" : "webp";
            const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}-${safeName}.${ext}`;
            const filePath = path.join(uploadDir, filename);
            const publicUrl = `/uploads/gambar_upload/${filename}`;

            const sharpInstance = sharp(buffer);
            const meta = await sharpInstance.metadata();

            if (sectionType === "CUSTOM_PROMO") {
                const promoCfg = normalizeCustomPromoConfig(sectionCfg);
                const ratio = meta.width && meta.height ? meta.width / meta.height : null;
                const layoutRaw = layoutOverride || String(promoCfg.layout ?? "carousel").toLowerCase();
                const isHero = layoutRaw === "hero";
                const width = meta.width ?? 0;
                const height = meta.height ?? 0;
                if (!ratio || !width || !height) {
                    return { ok: false, error: "Metadata gambar tidak lengkap. Coba upload ulang." };
                }
                if (isHero) {
                    if (width !== 3000 || height !== 1000) {
                        return { ok: false, error: "Hero wajib ukuran 3000x1000 (tidak bisa selain itu)." };
                    }
                } else {
                    if (width < 2300 || width > 4000 || height < 1000 || height > 1500) {
                        return { ok: false, error: "Carousel/Grid wajib lebar 2300-4000 dan tinggi 1000-1500." };
                    }
                }
                if (isHero) {
                    const currentCount = Array.isArray(promoCfg.voucherImageIds) ? promoCfg.voucherImageIds.length : 0;
                    if (currentCount >= 1) {
                        return { ok: false, error: "Layout Hero hanya boleh 1 gambar. Hapus dulu sebelum upload gambar lain." };
                    }
                }
            }

            // Jangan mengecilkan di bawah batas minimal per mode (hindari gagal saat attach).
            let targetWidth = 1920;
            if (isCommerceIconAttach || isCommerceCustomAttach) {
                const metaWidth = Number(meta.width ?? 0);
                targetWidth = metaWidth > 0 ? Math.min(512, metaWidth) : 512;
            }
            if (sectionType === "CUSTOM_PROMO") {
                const promoCfg = normalizeCustomPromoConfig(sectionCfg);
                const layoutRaw = layoutOverride || String(promoCfg.layout ?? "carousel").toLowerCase();
                const isHero = layoutRaw === "hero";
                const minWidthCp = isHero ? 3000 : 2300;
                const maxWidthCp = isHero ? 3000 : 4000;
                const metaWidth = meta.width ?? minWidthCp;
                targetWidth = isHero ? 3000 : Math.max(minWidthCp, Math.min(metaWidth, maxWidthCp));
            }

            const compressed = await sharpInstance
                .rotate()
                .resize({ width: targetWidth, withoutEnlargement: true })
            [isCommerceIconAttach || isCommerceCustomAttach ? "png" : "webp"](
                isCommerceIconAttach || isCommerceCustomAttach ? {} : { quality: 78 },
            )
                .toBuffer();

            await fs.writeFile(filePath, compressed);

            // 2) Create gambar_upload row
            const created = await prisma.gambarUpload.create({
                data: {
                    url: publicUrl,
                    title: title ?? safeName,
                    tags,
                    categoryId: null,
                    subcategoryId: null,
                },
                select: { id: true },
            });

            imageIdToUse = Number(created.id);
            finalImageObj = { id: imageIdToUse, url: publicUrl, title: title ?? safeName, tags };
        }

        // 3) Attach to Draft section config (ONLY if attach is provided)
        if (!imageIdToUse || Number.isNaN(Number(imageIdToUse))) {
            return { ok: false, error: "Gambar tidak valid." };
        }

        const type = sectionType;
        let cfg: any = legacyToNewConfig(type, section.config);

        if (isCommerceIconAttach || isCommerceCustomAttach) {
            const rec = await prisma.gambarUpload.findUnique({ where: { id: imageIdToUse }, select: { url: true } });
            // Relaxed: no PNG validation
            /*
            if (!rec?.url || !/\.png(\?|#|$)/i.test(String(rec.url))) {
                return { ok: false, error: "Icon CATEGORY_GRID_COMMERCE wajib PNG." };
            }
            */
        }

        const metaFromDisk = async (imgId: number) => {
            const rec = await prisma.gambarUpload.findUnique({ where: { id: imgId }, select: { url: true } });
            if (!rec || !rec.url) return null;
            const fp = path.join(process.cwd(), "public", String(rec.url).replace(/^\//, ""));
            try {
                return await sharp(fp).metadata();
            } catch {
                return null;
            }
        };

        if (attach === "HERO:imageId") {
            // HERO: simpan di dua key untuk kompatibilitas (imageId + heroImageId)
            cfg = { ...(cfg ?? {}), imageId: imageIdToUse, heroImageId: imageIdToUse };
        } else if (attach === "CUSTOM_PROMO:append" || attach === "CUSTOM_PROMO:imageId") {
            // enforce rules: ratio + width + hero single image
            const meta = await metaFromDisk(Number(imageIdToUse));
            if (!meta?.width || !meta?.height) {
                throw new Error("Metadata gambar tidak bisa dibaca untuk Custom Promo.");
            }
            const layoutRaw = (layoutOverride || String((cfg as any)?.layout ?? "carousel")).toLowerCase();
            const isHero = layoutRaw === "hero";
            const nextLayout = isHero ? "hero" : layoutRaw === "grid" ? "grid" : "carousel";
            if (isHero) {
                if (meta.width !== 3000 || meta.height !== 1000) {
                    throw new Error("Hero wajib ukuran 3000x1000 (tidak bisa selain itu).");
                }
            } else {
                if (meta.width < 2300 || meta.width > 4000 || meta.height < 1000 || meta.height > 1500) {
                    throw new Error("Carousel/Grid wajib lebar 2300-4000 dan tinggi 1000-1500.");
                }
            }

            const vouchers = normalizeVoucherImageIds(cfg?.voucherImageIds);
            const already = vouchers.includes(Number(imageIdToUse));
            if (!isHero && vouchers.length > 0) {
                const firstMeta = await metaFromDisk(Number(vouchers[0]));
                if (firstMeta?.width && firstMeta?.height) {
                    if (firstMeta.width !== meta.width || firstMeta.height !== meta.height) {
                        throw new Error("Ukuran voucher harus seragam dengan voucher pertama agar rapi.");
                    }
                }
            }
            if (!already && vouchers.length >= MAX_CUSTOM_PROMO_VOUCHERS) {
                throw new Error(`Maksimal ${MAX_CUSTOM_PROMO_VOUCHERS} voucher untuk Custom Promo.`);
            }
            if (layoutRaw === "hero" && vouchers.length >= 1 && !already) {
                throw new Error("Mode Hero hanya boleh 1 gambar. Hapus dulu sebelum tambah gambar baru.");
            }
            const next = already ? vouchers : [...vouchers, imageIdToUse];
            cfg = { ...(cfg ?? {}), layout: nextLayout, voucherImageIds: next };
        } else if (attach === "CONTACT:imageId") {
            // CONTACT: attach image + auto enable showImage
            cfg = { ...(cfg ?? {}), imageId: imageIdToUse, showImage: true };
        } else if (attach === "HIGHLIGHT_COLLECTION:heroImageId") {
            cfg = { ...(cfg ?? {}), heroImageId: imageIdToUse };
        } else if (attach.startsWith("ROOM_CATEGORY:")) {
            // attach format: "ROOM_CATEGORY:<cardKey>"
            const key = attach.slice("ROOM_CATEGORY:".length).trim(); // e.g. ruang_keluarga_tamu
            if (!key) {
                return { ok: false, error: "Card key kosong for ROOM_CATEGORY." };
            }

            const cards = normalizeRoomCards(cfg?.cards);
            const idx = cards.findIndex((c: any) => String(c?.key) === String(key));
            if (idx < 0) {
                return { ok: false, error: `Card key "${key}" tidak ditemukan di config ROOM_CATEGORY.` };
            }
            cards[idx] = { ...cards[idx], imageId: imageIdToUse };
            cfg = { ...(cfg ?? {}), cards };
        } else if (attach === "GALLERY:append") {
            const prev = Array.isArray(cfg?.imageIds) ? cfg.imageIds : [];
            const next = Array.from(new Set([...prev.map((v: any) => Number(v)).filter(Number.isFinite), imageIdToUse]));
            cfg = { ...(cfg ?? {}), imageIds: next };
        } else if (attach.startsWith("CATEGORY_GRID:cover:")) {
            const tail = attach.slice("CATEGORY_GRID:cover:".length).trim();
            const kid = Number(tail);
            if (!kid || Number.isNaN(kid)) {
                throw new Error("KategoriId tidak valid untuk cover CATEGORY_GRID.");
            }
            const items = Array.isArray(cfg?.items) ? [...cfg.items] : [];
            const i = items.findIndex((it: any) => Number(it?.kategoriId) === kid);
            if (i >= 0) {
                items[i] = { ...items[i], coverImageId: imageIdToUse };
            } else {
                items.push({ kategoriId: kid, coverImageId: imageIdToUse });
            }
            const layout = cfg?.layout ?? { columns: 3, maxItems: 6 };
            cfg = { ...(cfg ?? {}), layout, items };
        } else if (attach === "CATEGORY_GRID:cover") {
            if (!kategoriIdRaw || Number.isNaN(kategoriId)) {
                throw new Error("Pilih kategori dulu untuk cover CATEGORY_GRID.");
            }
            const items = Array.isArray(cfg?.items) ? [...cfg.items] : [];
            const i = items.findIndex((it: any) => Number(it?.kategoriId) === kategoriId);
            if (i >= 0) {
                items[i] = { ...items[i], coverImageId: imageIdToUse };
            } else {
                // kalau kategori belum dicentang, kita tambahkan sekaligus
                items.push({ kategoriId, coverImageId: imageIdToUse });
            }
            const layout = cfg?.layout ?? { columns: 3, maxItems: 6 };
            cfg = { ...(cfg ?? {}), layout, items };

        } else if (attach.startsWith("CATEGORY_GRID_COMMERCE:icon:")) {
            const tail = attach.slice("CATEGORY_GRID_COMMERCE:icon:".length).trim();
            const kid = Number(tail);
            if (!kid || Number.isNaN(kid)) {
                throw new Error("KategoriId tidak valid untuk icon CATEGORY_GRID_COMMERCE.");
            }
            const items = Array.isArray(cfg?.items) ? [...cfg.items] : [];
            const i = items.findIndex((it: any) => Number(it?.kategoriId) === kid);
            if (i < 0) {
                throw new Error("Pilih kategori dulu sebelum upload icon.");
            }
            items[i] = { ...items[i], imageId: imageIdToUse };
            const layout = cfg?.layout ?? { columns: 4, tabletColumns: 3, mobileColumns: 2, maxItems: 16 };
            cfg = { ...(cfg ?? {}), layout, items };
        } else if (attach.startsWith("CATEGORY_GRID_COMMERCE:custom:")) {
            const key = attach.slice("CATEGORY_GRID_COMMERCE:custom:".length).trim();
            if (!key) {
                throw new Error("Key item custom tidak valid.");
            }
            const items = Array.isArray(cfg?.items) ? [...cfg.items] : [];
            const i = items.findIndex((it: any) => String(it?.key ?? "") === String(key));
            if (i < 0) {
                throw new Error("Item custom tidak ditemukan.");
            }
            items[i] = { ...items[i], imageId: imageIdToUse };
            const layout = cfg?.layout ?? { columns: 4, tabletColumns: 3, mobileColumns: 2, maxItems: 16 };
            cfg = { ...(cfg ?? {}), layout, items };

        } else if (attach.startsWith("ROOM_CATEGORY:")) {
            const key = attach.split(":")[1] ?? "";
            const safeKey = String(key).trim();
            if (!safeKey) {
                throw new Error("Key kartu ROOM_CATEGORY tidak valid.");
            }

            const cards = normalizeRoomCards(cfg?.cards);
            const next = cards.map((c: any) => (c.key === safeKey ? { ...c, imageId: imageIdToUse } : c));
            cfg = { ...(cfg ?? {}), cards: next };

        } else {
            // no attach -> do nothing
        }

        // Validate basic references so config tetap aman
        const ref = collectExistenceArgs(type, cfg);
        const { imageIds: validImageIds = [], ...rest } = await sanitizeExistence(ref);

        if (!imageIdToUse || !Number.isFinite(imageIdToUse)) {
            return { ok: false, error: "ImageId tidak valid setelah proses upload/pilih." };
        }

        // If the new imageId is not in the sanitized list (meaning it doesn't exist in DB), fail gracefully or warn.
        // However, we just added it or picked it, so it should exist. 
        // If it was pruned by sanitizeExistence, then it's invalid.
        // We only check if our specific imageIdToUse is valid if it's an image attachment.
        if (ref.imageIds?.includes(imageIdToUse)) {
            const found = (validImageIds ?? []).includes(imageIdToUse);
            if (!found) return { ok: false, error: "Gambar yang dipilih tidak ditemukan di database." };
        }

        // CRITICAL FIX: Save the updated config to database!
        const themeKey = getThemeKeyFromRow(section);
        const finalCfg = withThemeKey(cfg, themeKey);

        await prisma.homepageSectionDraft.update({
            where: { id: sectionId },
            data: { config: finalCfg },
        });

        // Create explicit return object
        // finalImageObj is already populated if upload occurred

        revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
        revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");

        // FIX: Add small delay to ensure FS flush
        await new Promise(resolve => setTimeout(resolve, 1000));

        // FIX: Add cache buster to optimistic update URL
        if (finalImageObj?.url) {
            finalImageObj.url += `?t=${Date.now()}`;
        }

        return {
            ok: true,
            imageId: imageIdToUse as number,
            image: finalImageObj,
            notice: "Gambar diupload & dipakai di section draft."
        };
    } catch (err: any) {
        return { ok: false, error: String(err?.message || "Gagal upload/pakai gambar.") };
    }
}




export async function saveGalleryConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;
    const imageIds = parseNumArray(formData.getAll("imageIds") as string[]);
    const layout = String(formData.get("layout") ?? "grid") === "carousel" ? "carousel" : "grid";
    await updateDraftConfigPreserveTheme(id, { imageIds, layout }, { title, slug });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Config GALLERY tersimpan.") });
}


export async function saveRoomCategoryConfig(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
    const slug = slugRaw ? slugify(slugRaw) : null;
    const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);

    // Merge dengan config existing (biar kartu dinamis 1..12 aman, dan picker gambar via action tidak ke-reset)
    const existingRow = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    if (!existingRow) return redirectBack({ error: encodeURIComponent("Section draft tidak ditemukan.") });
    const existingCfg = legacyToNewConfig("ROOM_CATEGORY", existingRow?.config);
    const existingCards = normalizeRoomCards(existingCfg?.cards);

    const cards: any[] = existingCards.map((prev) => {
        const key = prev.key;
        const title = (formData.get(`title_${key}`) as string | null)?.trim() ?? prev.title ?? "";
        const description = (formData.get(`description_${key}`) as string | null)?.trim() ?? prev.description ?? "";
        const badge = (formData.get(`badge_${key}`) as string | null)?.trim() ?? prev.badge ?? "";
        const kategoriId = parseNum(formData.get(`kategoriId_${key}`));
        // imageId dibiarkan dari config (diubah lewat picker / tombol reset)
        return {
            key,
            title,
            description,
            badge,
            kategoriId: kategoriId ?? null,
            imageId: prev.imageId ?? null,
        };
    }).slice(0, MAX_ROOM_CARDS);

    const kategoriIds = cards.map((c) => c.kategoriId).filter((v): v is number => typeof v === "number");
    const imageIds = cards.map((c) => c.imageId).filter((v): v is number => typeof v === "number");

    const { kategoriIds: validKategoriIds, imageIds: validImageIds } = await sanitizeExistence({ kategoriIds, imageIds });

    const validKategoriSet = new Set(validKategoriIds ?? []);
    const validImageSet = new Set(validImageIds ?? []);

    const sanitizedCards = cards.map(c => ({
        ...c,
        kategoriId: (c.kategoriId && validKategoriSet.has(c.kategoriId)) ? c.kategoriId : null,
        imageId: (c.imageId && validImageSet.has(c.imageId)) ? c.imageId : null
    }));

    await updateDraftConfigPreserveTheme(
        id,
        { ...(sectionTheme ? { sectionTheme } : {}), cards: sanitizedCards },
        { title, slug },
    );

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    return redirectBack({ notice: encodeURIComponent("Config ROOM_CATEGORY tersimpan.") });
}



export async function addRoomCategoryCard(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const cfg = legacyToNewConfig("ROOM_CATEGORY", row?.config);
    const cards = normalizeRoomCards(cfg?.cards);

    if (cards.length >= MAX_ROOM_CARDS) {
        return redirectBack({ error: encodeURIComponent(`Maksimal ${MAX_ROOM_CARDS} kartu.`) });
    }

    const key = makeRoomCardKey(`card_${Date.now()}`);
    const next: any[] = [...cards, { key, title: "", description: "", badge: "", kategoriId: null, imageId: null }];

    await updateDraftConfigPreserveTheme(id, { cards: next });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    return redirectBack({ notice: encodeURIComponent("Kartu ruangan ditambahkan.") });
}


export async function removeRoomCategoryCard(key: string, formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    const safeKey = String(key ?? "").trim();
    if (!safeKey) return;

    const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const cfg = legacyToNewConfig("ROOM_CATEGORY", row?.config);
    const cards = normalizeRoomCards(cfg?.cards);

    const next = cards.filter((c) => c.key !== safeKey);
    if (!next.length) {
        return redirectBack({ error: encodeURIComponent("Minimal harus ada 1 kartu.") });
    }

    await updateDraftConfigPreserveTheme(id, { cards: next });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    return redirectBack({ notice: encodeURIComponent("Kartu ruangan dihapus.") });
}


export async function moveRoomCategoryCard(move: string, formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    const safeMove = String(move ?? "").trim();
    const [key, dir] = safeMove.split(":");
    if (!key || !dir) return;

    const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const cfg = legacyToNewConfig("ROOM_CATEGORY", row?.config);
    const cards = normalizeRoomCards(cfg?.cards);

    const idx = cards.findIndex((c) => c.key === key);
    if (idx < 0) return;

    const next = [...cards];
    if (dir === "up" && idx > 0) {
        const tmp = next[idx - 1];
        next[idx - 1] = next[idx];
        next[idx] = tmp;
    }
    if (dir === "down" && idx < next.length - 1) {
        const tmp = next[idx + 1];
        next[idx + 1] = next[idx];
        next[idx] = tmp;
    }

    await updateDraftConfigPreserveTheme(id, { cards: next });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    return redirectBack({ notice: encodeURIComponent("Urutan kartu diperbarui.") });
}


export async function clearRoomCategoryCardImage(key: string, formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;
    const safeKey = String(key ?? "").trim();
    if (!safeKey) return;

    const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const cfg = legacyToNewConfig("ROOM_CATEGORY", row?.config);
    const cards = normalizeRoomCards(cfg?.cards);

    const next = cards.map((c) => (c.key === safeKey ? { ...c, imageId: null } : c));

    await updateDraftConfigPreserveTheme(id, { cards: next });
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    return redirectBack({ notice: encodeURIComponent("Gambar kartu di-reset ke mode otomatis.") });
}


function generateContactCopy(brandRaw: string, seed: number) {
    const brand = (brandRaw || "").trim() || "apixinterior";
    const kwCore = [
        "desain interior",
        "jasa interior",
        "interior rumah",
        "custom furniture",
        "kitchen set",
        "lemari",
        "ruang tamu",
        "kamar tidur",
        "ruang kerja",
        "apartemen",
        "kantor",
        "renovasi interior",
        "ukur & survey",
        "konsultasi",
    ];

    const titleTemplates = [
        `Hubungi ${brand} | Konsultasi Desain Interior & Custom Furniture`,
        `Butuh Interior Rapi? Hubungi ${brand} Sekarang`,
        `${brand} | Konsultasi Interior, Kitchen Set, & Furniture Custom`,
        `Konsultasi Interior Cepat | ${brand} Siap Bantu`,
        `Hubungi ${brand}: Desain Interior, Produksi, & Instalasi`,
    ];

    const sentenceA = [
        `Konsultasi desain interior & custom furniture bareng tim ${brand}.`,
        `Tim ${brand} siap bantu desain interior dan produksi furniture custom.`,
        `Mulai dari konsep sampai instalasi, ${brand} bantu urus interiornya.`,
        `Ceritakan kebutuhan ruanganmu, ${brand} bantu cari solusi yang pas.`,
    ];

    const sentenceB = [
        `Layanan populer: ${kwCore.slice(0, 6).join(", ")}.`,
        `Fokus pengerjaan: ${kwCore.slice(2, 10).join(", ")}.`,
        `Cocok untuk rumah, apartemen, hingga kantor dengan finishing rapi.`,
        `Fast response, bisa konsultasi dulu, lalu estimasi & timeline yang jelas.`,
    ];

    const sentenceC = [
        `Klik salah satu kontak di bawah untuk chat/telepon (bisa rename teks tombol).`,
        `Pilih kontak di bawah, kami respons secepatnya untuk kebutuhan interior kamu.`,
        `Hubungi kami lewat kontak yang kamu pilih di bawah. Yuk mulai konsultasi!`,
        `Pilih kontak favoritmu di bawah untuk mulai diskusi proyek interior.`,
    ];

    const pick = <T,>(arr: T[]) => arr[Math.abs(seed) % arr.length];

    const headerText = pick(titleTemplates);
    const bodyText = [pick(sentenceA), pick(sentenceB), pick(sentenceC)].join(" ");

    return { headerText, bodyText };
}

export async function autoGenerateContactCopy(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const existing = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    const existingCfg = legacyToNewConfig("CONTACT", existing?.config ?? {});

    // Brand dari DB: informasi_toko.namaToko
    const info = await prisma.informasiToko.findFirst({ select: { namaToko: true } });
    const brand = (info?.namaToko ?? "").trim() || "apixinterior";

    const seed = id * 131 + brand.length * 17;
    const { headerText, bodyText } = generateContactCopy(brand, seed);

    await updateDraftConfigPreserveTheme(id, {
        ...(existingCfg as any),
        headerText,
        bodyText,
    });

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    return redirectBack({ notice: encodeURIComponent("Judul & deskripsi Hubungi Kami berhasil di-auto-generate.") });
}


export async function duplicateDraft(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id || Number.isNaN(id)) return;

    const existing = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    if (!existing) return redirectBack({ error: encodeURIComponent("Section draft tidak ditemukan.") });

    const themeKey = getThemeKeyFromRow(existing);
    const allDrafts = await prisma.homepageSectionDraft.findMany({ orderBy: { sortOrder: "asc" } });
    const sameTheme = (allDrafts as any[])
        .filter((d) => !isThemeMetaRow(d))
        .filter((d) => getThemeKeyFromRow(d) === themeKey);

    const baseSort = Number(existing.sortOrder ?? 0) + 1;
    const toShift = sameTheme
        .filter((d) => Number(d.sortOrder ?? 0) >= baseSort)
        .sort((a, b) => Number(b.sortOrder ?? 0) - Number(a.sortOrder ?? 0));

    const existingSlug = String(existing.slug ?? "").trim();
    let nextSlug = existingSlug ? slugify(`${existingSlug}-copy`) : "";
    if (nextSlug) {
        const used = new Set(
            sameTheme
                .map((d) => String(d.slug ?? "").trim())
                .filter(Boolean),
        );
        let i = 2;
        while (used.has(nextSlug)) {
            nextSlug = slugify(`${existingSlug}-copy-${i}`);
            i += 1;
        }
    }

    const titleBase = String(existing.title ?? "Section").trim() || "Section";
    const nextTitle = `${titleBase} (copy)`;

    const created = await prisma.$transaction(async (tx: any) => {
        for (const row of toShift) {
            await tx.homepageSectionDraft.update({
                where: { id: Number(row.id) },
                data: { sortOrder: Number(row.sortOrder ?? 0) + 1 },
            });
        }

        return tx.homepageSectionDraft.create({
            data: {
                type: existing.type as any,
                title: nextTitle,
                slug: nextSlug ? nextSlug : null,
                enabled: Boolean(existing.enabled),
                sortOrder: baseSort,
                config: withThemeKey(existing.config ?? {}, themeKey),
            },
        });
    });

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    revalidatePath("/");
    return redirectBack({
        notice: encodeURIComponent("Section berhasil diduplikat."),
        anchor: `section-${created.id}`,
        sectionId: created.id,
    });
}

export async function createTheme() {
    const allDrafts = await prisma.homepageSectionDraft.findMany({
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    const used = new Set<ThemeKey>();
    for (const d of allDrafts as any[]) {
        if (isThemeMetaRow(d)) used.add(getThemeKeyFromRow(d));
    }

    let nextKey: ThemeKey = used.size === 0 ? DEFAULT_THEME_KEY : "";
    if (!nextKey) {
        const ts = Date.now().toString(36);
        const rnd = Math.random().toString(36).slice(2, 7);
        nextKey = `theme_${ts}_${rnd}`;
        while (used.has(nextKey)) {
            const rnd2 = Math.random().toString(36).slice(2, 7);
            nextKey = `theme_${ts}_${rnd2}`;
        }
    }

    const nextName = `Theme ${used.size + 1}`;
    await ensureThemeMeta(nextKey, nextName);

    revalidatePath(ADMIN_TOKO_PATH);
    redirect(`${ADMIN_TOKO_PATH}?theme=${encodeURIComponent(nextKey)}`);
}

export async function renameTheme(formData: FormData) {
    const themeKey = normalizeThemeKey(formData.get("themeKey"));
    const themeName = (formData.get("themeName") as string | null)?.trim() ?? "";
    if (!themeName) {
        return redirectBack({ error: encodeURIComponent("Nama theme wajib diisi.") });
    }

    await ensureThemeMeta(themeKey, themeName);
    revalidatePath(ADMIN_TOKO_PATH);
    return redirectBack({ notice: encodeURIComponent("Nama theme disimpan.") });
}

export async function resetTheme(formData: FormData) {
    const themeKey = normalizeThemeKey(formData.get("themeKey"));
    await ensureThemeMeta(themeKey);

    const allDrafts = await prisma.homepageSectionDraft.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
    const ids = (allDrafts as any[])
        .filter((d) => !isThemeMetaRow(d) && getThemeKeyFromRow(d) === themeKey)
        .map((d) => d.id);

    if (ids.length) {
        await prisma.homepageSectionDraft.deleteMany({ where: { id: { in: ids } } });
    }

    revalidatePath(ADMIN_TOKO_PATH);
    return redirectBack({ notice: encodeURIComponent("Theme berhasil di-reset (kosong).") });
}

export async function duplicateThemeSimple(formData: FormData) {
    const fromRaw = (formData.get("fromKey") ?? formData.get("from")) as any;
    const fromKey = normalizeThemeKey(fromRaw);

    const newThemeName = (formData.get("newThemeName") as string | null)?.trim() ?? "";
    if (!newThemeName) {
        return redirectBack({ error: "Nama theme baru wajib diisi." });
    }

    const allDrafts = await prisma.homepageSectionDraft.findMany({
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    const used = new Set<ThemeKey>();
    for (const d of allDrafts as any[]) {
        if (isThemeMetaRow(d)) used.add(getThemeKeyFromRow(d));
    }

    const ts = Date.now().toString(36);
    let toKey: ThemeKey = `theme_${ts}_${Math.random().toString(36).slice(2, 7)}`;
    while (used.has(toKey)) {
        toKey = `theme_${ts}_${Math.random().toString(36).slice(2, 7)}`;
    }

    await ensureThemeMeta(toKey, newThemeName);

    const fromRows = (allDrafts as any[]).filter((d) => !isThemeMetaRow(d) && getThemeKeyFromRow(d) === fromKey);

    await prisma.$transaction(
        fromRows.map((d) =>
            prisma.homepageSectionDraft.create({
                data: {
                    type: d.type as any,
                    title: d.title,
                    slug: d.slug,
                    enabled: d.enabled,
                    sortOrder: d.sortOrder,
                    config: withThemeKey(d.config ?? {}, toKey),
                },
            })
        )
    );

    revalidatePath(ADMIN_TOKO_PATH);
    redirect(`${ADMIN_TOKO_PATH}?theme=${encodeURIComponent(toKey)}`);
}

export async function duplicateTheme(formData: FormData) {
    const fromRaw = (formData.get("fromKey") ?? formData.get("from")) as any;
    const toRaw = (formData.get("toKey") ?? formData.get("to")) as any;

    const fromKey = normalizeThemeKey(fromRaw);
    const toChoice = String(toRaw ?? "").trim();

    const allDrafts = await prisma.homepageSectionDraft.findMany({
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    let toKey: ThemeKey;
    if (toChoice === "__new__") {
        const used = new Set<ThemeKey>();
        for (const d of allDrafts as any[]) {
            if (isThemeMetaRow(d)) used.add(getThemeKeyFromRow(d));
        }
        const ts = Date.now().toString(36);
        const rnd = Math.random().toString(36).slice(2, 7);
        toKey = `theme_${ts}_${rnd}`;
        while (used.has(toKey)) {
            const rnd2 = Math.random().toString(36).slice(2, 7);
            toKey = `theme_${ts}_${rnd2}`;
        }
    } else {
        toKey = normalizeThemeKey(toChoice);
    }

    if (fromKey === toKey) {
        return redirectBack({ error: encodeURIComponent("Theme asal dan tujuan tidak boleh sama.") });
    }

    await ensureThemeMeta(toKey);

    const fromRows = (allDrafts as any[]).filter((d) => !isThemeMetaRow(d) && getThemeKeyFromRow(d) === fromKey);

    const toIds = (allDrafts as any[])
        .filter((d) => !isThemeMetaRow(d) && getThemeKeyFromRow(d) === toKey)
        .map((d) => d.id);

    await prisma.$transaction([
        ...(toIds.length ? [prisma.homepageSectionDraft.deleteMany({ where: { id: { in: toIds } } })] : []),
        ...fromRows.map((d) =>
            prisma.homepageSectionDraft.create({
                data: {
                    type: d.type as any,
                    title: d.title,
                    slug: d.slug,
                    enabled: d.enabled,
                    sortOrder: d.sortOrder,
                    config: withThemeKey(d.config ?? {}, toKey),
                },
            }),
        ),
    ]);

    revalidatePath(ADMIN_TOKO_PATH);

    if (toChoice === "__new__") {
        redirect(`${ADMIN_TOKO_PATH}?theme=${encodeURIComponent(toKey)}`);
    }

    return redirectBack({ notice: encodeURIComponent("Theme berhasil diduplikat (overwrite).") });
}

export async function deleteTheme(formData: FormData) {
    const themeKey = normalizeThemeKey(formData.get("themeKey"));
    const allDrafts = await prisma.homepageSectionDraft.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });

    const ids = (allDrafts as any[])
        .filter((d) => !isThemeMetaRow(d) && getThemeKeyFromRow(d) === themeKey)
        .map((d) => d.id);

    const slug = themeMetaSlug(themeKey);

    await prisma.$transaction([
        ...(ids.length ? [prisma.homepageSectionDraft.deleteMany({ where: { id: { in: ids } } })] : []),
        prisma.homepageSectionDraft.deleteMany({ where: { slug } }),
    ]);

    revalidatePath(ADMIN_TOKO_PATH);
    return redirectBack({ notice: encodeURIComponent("Theme berhasil dihapus.") });
}

export async function autoGenerateThemeContent(formData: FormData) {
    const rawThemeKey = normalizeThemeKey(formData.get("themeKey"));
    const themeKey = rawThemeKey || (await getThemeKeyFromReferer());
    if (!themeKey) return;

    await ensureThemeMeta(themeKey);

    const allDrafts = await prisma.homepageSectionDraft.findMany({
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    const existing = (allDrafts as any[])
        .filter((d) => !isThemeMetaRow(d))
        .filter((d) => getThemeKeyFromRow(d) === themeKey);

    if (existing.length) {
        return redirectBack({
            error: encodeURIComponent("Theme sudah ada section. Kosongkan dulu dengan Drop All."),
        });
    }

    const [categoriesRaw, imagesRaw, productsRaw, themeMeta] = await Promise.all([
        prisma.kategoriProduk.findMany({
            orderBy: { id: "asc" },
            select: { id: true, nama: true, slug: true },
        }),
        prisma.gambarUpload.findMany({
            orderBy: { id: "desc" },
            take: 400,
            select: { id: true, url: true, title: true },
        }),
        prisma.produk.findMany({
            orderBy: { id: "desc" },
            take: 12,
            select: { id: true },
        }),
        prisma.homepageSectionDraft.findFirst({ where: { slug: themeMetaSlug(themeKey) } }),
    ]);

    const categories = (categoriesRaw ?? []) as any[];
    const images = (imagesRaw ?? []) as any[];
    const pngImages = images.filter((img) => isPngUrl(img.url));

    const themeNameRaw = String((themeMeta?.config as any)?.themeName ?? "").trim();
    const themeName = themeNameRaw || "Apix Interior";

    const scopeWords = ["Interior", "Mebel", "Furnitur", "Rumah", "Office", "Bangunan"];
    const templates = [
        "{base} {scope}",
        "Mebel {base}",
        "Furnitur {base}",
        "Interior {base}",
        "{base} Rumah",
        "Office {base}",
        "Bangunan {base}",
    ];

    const makeSeoLabel = (baseRaw: string, seed: number) => {
        const base = limitWords(toTitleCase(baseRaw), 4);
        const scopeWord = scopeWords[seed % scopeWords.length];
        const templateIdx = seed % templates.length;
        const templated = templates[templateIdx].replace("{base}", base).replace("{scope}", scopeWord);
        return limitWords(ensureScopeLabel(templated.trim(), scopeWord), 6);
    };

    const usedSlugs = new Set<string>();
    const makeUniqueSlug = (base: string) => {
        let slug = slugify(base);
        if (!slug) return "";
        if (!usedSlugs.has(slug)) {
            usedSlugs.add(slug);
            return slug;
        }
        let i = 2;
        while (usedSlugs.has(`${slug}-${i}`)) i += 1;
        const next = `${slug}-${i}`;
        usedSlugs.add(next);
        return next;
    };

    const usedImageIds = new Set<number>();

    const pickBestAnyImage = (label: string) => {
        let best: { id: number; score: number } | null = null;
        for (const img of images) {
            const score = scoreImageMatch(label, img);
            if (score < 10) continue;
            if (!best || score > best.score) best = { id: Number(img.id), score };
        }
        return best?.id ?? null;
    };

    const heroLabelBase = categories.length ? getCategoryLabel(categories[0]) : themeName;
    const heroImageId = pickBestAnyImage(heroLabelBase) ?? (images[0] ? Number(images[0].id) : null);

    const heroConfig = {
        headline: "Kurasi Furnitur & Interior Premium",
        subheadline: "Belanja mebel pilihan untuk rumah, office, dan ruang keluarga.",
        ctaLabel: "Belanja Sekarang",
        ctaHref: "/cari",
        eyebrow: themeName,
        heroTheme: "FOLLOW_NAVBAR",
        sectionTheme: "FOLLOW_NAVBAR",
        imageId: Number.isFinite(Number(heroImageId)) ? Number(heroImageId) : null,
        badges: ["Ready Stock", "Kurasi Interior", "Material Premium"],
        highlights: ["Gratis konsultasi styling", "Pilihan warna netral hangat", "Cocok untuk ruang kecil"],
        trustChips: ["Pembayaran Aman", "Garansi", "Support CS"],
        miniInfo: [
            { title: " 4.8", desc: "Rating pelanggan" },
            { title: " 1.2k+", desc: "Produk tersedia" },
            { title: " Fast", desc: "Respon CS" },
        ],
        heroContent: {
            eyebrow: themeName,
            badges: ["Ready Stock", "Kurasi Interior", "Material Premium"],
            highlights: ["Gratis konsultasi styling", "Pilihan warna netral hangat", "Cocok untuk ruang kecil"],
            trustChips: ["Pembayaran Aman", "Garansi", "Support CS"],
            miniInfo: [
                { title: " 4.8", desc: "Rating pelanggan" },
                { title: " 1.2k+", desc: "Produk tersedia" },
                { title: " Fast", desc: "Respon CS" },
            ],
        }
    };

    const textBlocks = [
        {
            mode: "subtitle",
            text: "Kurasi mebel dan interior untuk rumah tangga, office, dan bangunan lainnya.",
        },
        {
            mode: "body",
            text:
                "Temukan furnitur pilihan yang selaras dengan desain ruang tamu, dapur, kamar, hingga area kerja. " +
                "Kami pilihkan produk berkualitas agar tampilan rapi, nyaman, dan mudah dirawat.",
        },
        {
            mode: "caption",
            text: "Kami menjamin setiap produk diproses dengan standar tinggi untuk kepuasan Anda.",
        },
    ];

    const textConfig = {
        sectionTheme: "FOLLOW_NAVBAR",
        blocks: textBlocks,
        text: "",
        mode: "body",
        align: "left",
        width: "normal",
    };

    const commerceCats = categories.slice(0, Math.min(8, categories.length));
    const commerceItems = commerceCats.map((cat, idx) => {
        const baseRaw = getCategoryLabel(cat);
        const label = makeSeoLabel(baseRaw, idx + Number(cat.id || 0));
        const slug = makeUniqueSlug(buildSeoSlug(label) || slugify(String(cat.slug ?? baseRaw)));
        const imageId = pickBestImage(baseRaw, pngImages, usedImageIds);
        if (imageId) usedImageIds.add(Number(imageId));
        return {
            type: "category",
            key: `cat-${cat.id}`,
            kategoriId: Number(cat.id),
            slug,
            label,
            imageId: Number.isFinite(Number(imageId)) ? Number(imageId) : null,
            tabId: "",
        };
    });

    const commerceConfig = {
        sectionTheme: "FOLLOW_NAVBAR",
        layout: { columns: 4, tabletColumns: 3, mobileColumns: 2, maxItems: 16, mode: "commerce" },
        items: commerceItems,
        tabs: [],
    };

    const gridCats = categories.slice(0, Math.min(6, categories.length));
    const gridItems = gridCats.map((cat) => {
        const baseRaw = getCategoryLabel(cat);
        const imageId = pickBestImage(baseRaw, pngImages);
        return {
            kategoriId: Number(cat.id),
            coverImageId: Number.isFinite(Number(imageId)) ? Number(imageId) : null,
        };
    });

    const gridConfig = {
        sectionTheme: "FOLLOW_NAVBAR",
        layout: { columns: 3, maxItems: Math.max(6, gridItems.length) || 6 },
        items: gridItems,
    };

    const productIds = (productsRaw ?? [])
        .map((p: any) => Number(p.id))
        .filter((n: number) => Number.isFinite(n));

    const productConfig = {
        sectionTheme: "FOLLOW_NAVBAR",
        title: "Produk Pilihan",
        description: "",
        productIds,
        showPrice: true,
        showCta: true,
    };

    const sectionsToCreate = [
        { type: "HERO", title: "", slug: "hero", config: heroConfig },
        { type: "CATEGORY_GRID_COMMERCE", title: "", slug: "grid-category-commerce", config: commerceConfig },
        { type: "TEXT_SECTION", title: "", slug: "text-section", config: textConfig },
        { type: "PRODUCT_CAROUSEL", title: "", slug: "carousel-produk", config: productConfig },
        { type: "CATEGORY_GRID", title: "", slug: "kategori-produk", config: gridConfig },
    ];

    const last = await prisma.homepageSectionDraft.findFirst({ orderBy: { sortOrder: "desc" } });
    let sortOrder = last ? Number(last.sortOrder ?? 0) + 1 : 1;

    const created = await prisma.$transaction(
        sectionsToCreate.map((s: any) =>
            prisma.homepageSectionDraft.create({
                data: {
                    type: s.type as any,
                    title: s.title,
                    slug: s.slug || null,
                    enabled: true,
                    sortOrder: sortOrder++,
                    config: withThemeKey(s.config ?? {}, themeKey),
                },
            }),
        ),
    );

    const firstId = created[0]?.id ? Number(created[0].id) : null;

    revalidatePath(ADMIN_TOKO_PATH);
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    revalidatePath("/");
    return redirectBack({
        notice: encodeURIComponent("Auto-generate theme berhasil dijalankan."),
        anchor: firstId ? `section-${firstId}` : undefined,
        sectionId: firstId ?? undefined,
    });
}
