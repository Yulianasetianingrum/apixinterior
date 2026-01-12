import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const nextIsPromo = Boolean(body?.isPromo);

    const updated = await prisma.kategoriProduk.update({
      where: { id },
      data: { isPromo: nextIsPromo },
    });

    return NextResponse.json({ ok: true, kategori: updated });
  } catch (err: any) {
    // kalau record gak ketemu dsb
    return NextResponse.json(
      { error: err?.message || "Failed to update kategori promo" },
      { status: 500 }
    );
  }
}
