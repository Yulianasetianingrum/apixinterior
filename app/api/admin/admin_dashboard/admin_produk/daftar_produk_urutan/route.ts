// app/api/admin/admin_dashboard/admin_produk/daftar_produk_urutan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ====== UPDATE URUTAN PRODUK (UNTUK DRAG & DROP) ======
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Body kosong" },
        { status: 400 }
      );
    }

    let orderedIds: number[] = [];

    // Beberapa bentuk payload yang mungkin:
    // 1) { orderedIds: [1,2,3] }
    // 2) { items: [{id:1}, {id:2}] }
    // 3) [1,2,3]
    if (Array.isArray(body)) {
      orderedIds = body.map((v) => Number(v)).filter((v) => Number.isFinite(v));
    } else if (Array.isArray(body.orderedIds)) {
      orderedIds = body.orderedIds
        .map((v: any) => Number(v))
        .filter((v: number) => Number.isFinite(v));
    } else if (Array.isArray(body.items)) {
      orderedIds = body.items
        .map((item: any) => Number(item.id))
        .filter((v: number) => Number.isFinite(v));
    } else {
      return NextResponse.json(
        { error: "Format body tidak dikenali" },
        { status: 400 }
      );
    }

    if (!orderedIds.length) {
      return NextResponse.json(
        { error: "Tidak ada ID yang dikirim" },
        { status: 400 }
      );
    }

    // Update urutan: index array + 1
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.produk.update({
          where: { id },
          data: { urutan: index + 1 },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /daftar_produk_urutan error:", err);
    return NextResponse.json(
      { error: "Gagal mengupdate urutan produk" },
      { status: 500 }
    );
  }
}

// Optional: GET cuma buat cek route hidup
export async function GET() {
  return NextResponse.json({
    message: "Gunakan method PUT untuk meng-update urutan produk.",
  });
}
