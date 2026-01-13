// app/api/admin/admin_dashboard/admin_galeri/list_gambar/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const onlyPng = searchParams.get("png") === "1";

  const data = await prisma.gambarUpload.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: true, subcategory: true },
  });

  const filtered = onlyPng
    ? data.filter((it: any) => /\.png(\?|#|$)/i.test(String(it.url ?? "")))
    : data;

  return NextResponse.json({ data: filtered });
}
