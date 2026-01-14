"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPromoConfig() {
    let config = await prisma.promoPageConfig.findFirst({
        where: { id: 1 },
    });

    if (!config) {
        config = await prisma.promoPageConfig.create({
            data: {
                id: 1,
                heroTitle: "Luxury Flash Sale",
                heroSubtitle: "Kesempatan eksklusif memiliki furnitur premium dengan penawaran harga terbaik. Berlaku hingga stok habis.",
                vouchers: [
                    { code: "NEWMEMBER", value: "10%", label: "Diskon Member Baru", min: "Min. 200rb" },
                    { code: "ONGKIR50", value: "50rb", label: "Potongan Ongkir", min: "Min. 1jt" },
                ]
            }
        });
    }

    return config;
}

export async function savePromoConfig(formData: FormData) {
    const heroTitle = String(formData.get("heroTitle") ?? "");
    const heroSubtitle = String(formData.get("heroSubtitle") ?? "");

    // Parse Flash Sale End (DateTime local string -> ISO)
    const flashSaleRaw = String(formData.get("flashSaleEnd") ?? "");
    const flashSaleEnd = flashSaleRaw ? new Date(flashSaleRaw) : null;

    // Parse Vouchers JSON
    const vouchersRaw = String(formData.get("vouchers") ?? "[]");
    let vouchers: any[] = [];
    try {
        vouchers = JSON.parse(vouchersRaw);
    } catch {
        // Fallback default if error
        vouchers = [];
    }

    await prisma.promoPageConfig.upsert({
        where: { id: 1 },
        update: { heroTitle, heroSubtitle, flashSaleEnd, vouchers },
        create: { id: 1, heroTitle, heroSubtitle, flashSaleEnd, vouchers },
    });

    revalidatePath("/promo");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/promo");
}
