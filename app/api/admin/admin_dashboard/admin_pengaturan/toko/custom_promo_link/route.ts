import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Payload = {
  sectionId: number;
  voucherId: number;
  mode: "category" | "manual";
  categoryId: number | null;
  link: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Payload>;
    const sectionId = Number(body.sectionId);
    const voucherId = Number(body.voucherId);
    const mode = body.mode === "category" || body.mode === "manual" ? body.mode : null;
    const categoryId = Number(body.categoryId);
    const link = String(body.link ?? "").trim();

    if (!Number.isFinite(sectionId) || sectionId <= 0) {
      return NextResponse.json({ ok: false, error: "SectionId tidak valid." }, { status: 400 });
    }
    if (!Number.isFinite(voucherId) || voucherId <= 0) {
      return NextResponse.json({ ok: false, error: "VoucherId tidak valid." }, { status: 400 });
    }
    if (!mode) {
      return NextResponse.json({ ok: false, error: "Mode tidak valid." }, { status: 400 });
    }

    const section = await prisma.homepageSectionDraft.findUnique({ where: { id: sectionId } });
    if (!section) {
      return NextResponse.json({ ok: false, error: "Section draft tidak ditemukan." }, { status: 404 });
    }

    const cfg = (section.config ?? {}) as any;
    const voucherIds: number[] = Array.isArray(cfg?.voucherImageIds) ? cfg.voucherImageIds.map((v: any) => Number(v)) : [];
    if (!voucherIds.includes(voucherId)) {
      return NextResponse.json({ ok: false, error: "Voucher tidak ada di section ini." }, { status: 400 });
    }

    const prevLinks =
      cfg && typeof cfg.voucherLinks === "object" && cfg.voucherLinks !== null ? (cfg.voucherLinks as Record<number, string>) : {};
    const voucherLinks: Record<number, string> = { ...prevLinks };

    if (mode === "category") {
      if (Number.isFinite(categoryId) && categoryId > 0) {
        voucherLinks[voucherId] = `category:${categoryId}`;
      } else {
        delete voucherLinks[voucherId];
      }
    } else if (mode === "manual") {
      if (link) {
        voucherLinks[voucherId] = link;
      } else {
        delete voucherLinks[voucherId];
      }
    }

    await prisma.homepageSectionDraft.update({
      where: { id: sectionId },
      data: { config: { ...cfg, voucherLinks } },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Gagal simpan link voucher." }, { status: 500 });
  }
}
