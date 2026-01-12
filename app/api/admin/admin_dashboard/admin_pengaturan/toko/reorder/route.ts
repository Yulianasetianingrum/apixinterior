// app/api/admin/admin_dashboard/admin_pengaturan/toko/reorder/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Reorder SECTION DRAFT (homepagesectiondraft)
 * Ini TIDAK menyentuh navbar sama sekali.
 *
 * Body: { ids: number[] }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const idsRaw = body?.ids as unknown;

    const ids =
      Array.isArray(idsRaw) && idsRaw.length
        ? idsRaw
            .map((v) => (typeof v === "number" ? v : Number(v)))
            .filter((v) => Number.isFinite(v))
        : [];

    if (!ids.length) {
      return NextResponse.json({ error: "Invalid ids" }, { status: 400 });
    }

    // Pastikan semua id memang ada di DRAFT
    const existing = await prisma.homepageSectionDraft.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    const existingSet = new Set(existing.map((x) => x.id));
    const missing = ids.filter((id) => !existingSet.has(id));
    if (missing.length) {
      return NextResponse.json(
        { error: "Some ids not found in draft", missing },
        { status: 404 },
      );
    }

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.homepageSectionDraft.update({
          where: { id },
          data: { sortOrder: index + 1 },
        }),
      ),
    );

    // Refresh halaman CMS & preview
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");

    // Website utama membaca Published, jadi reorder draft tidak perlu revalidate "/"
    // tapi aman kalau kamu mau:
    // revalidatePath("/");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error reorder homepage draft sections:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
