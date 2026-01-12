
// lib/product-utils.ts

export const CATEGORY_COMMERCE_FALLBACK_URL = "/logo/logo_apixinterior_biru.png.png";

/**
 * Normalizes ID list from CSV or JSON array string
 */
export function parseIdList(raw?: string | null): number[] {
    if (!raw) return [];
    const s = raw.trim();
    if (!s) return [];

    if (s.startsWith("[") && s.endsWith("]")) {
        try {
            const arr = JSON.parse(s);
            if (Array.isArray(arr)) {
                return arr
                    .map((x) => Number(x))
                    .filter((n) => Number.isFinite(n) && n > 0);
            }
        } catch {
            // fallback
        }
    }

    return s
        .split(/[,;]+/)
        .map((x) => Number(String(x).trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
}

/**
 * Format number to IDR currency
 */
export function formatIDR(n: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n);
}

/**
 * Calculate final price after promo
 */
export function computeHargaSetelahPromo(p: {
    harga: number;
    promoAktif?: boolean | null;
    promoTipe?: "persen" | "nominal" | null;
    promoValue?: number | null;
}) {
    const hargaAsli = Math.round(Number(p.harga ?? 0) || 0);
    const aktif = !!p.promoAktif;
    const tipe = (p.promoTipe ?? null) as "persen" | "nominal" | null;
    const valueRaw = Math.round(Number(p.promoValue ?? 0) || 0);

    if (!aktif || !tipe || valueRaw <= 0 || hargaAsli <= 0) {
        return { hargaAsli, hargaFinal: hargaAsli, isPromo: false, promoLabel: "" };
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
        return { hargaAsli, hargaFinal: hargaAsli, isPromo: false, promoLabel: "" };
    }

    const promoLabel =
        tipe === "persen" ? `-${Math.max(0, Math.min(100, valueRaw))}%` : `-Rp ${diskon.toLocaleString("id-ID")}`;

    return { hargaAsli, hargaFinal, isPromo: true, promoLabel };
}

/**
 * Ensures URL has starting slash if local
 */
export function normalizePublicUrl(url?: string | null) {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    if (url.startsWith("/")) return url;
    return `/${url}`;
}
