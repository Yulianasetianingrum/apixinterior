import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: semua cabang
export async function GET() {
  try {
    const cabang = await prisma.cabangToko.findMany({
      orderBy: [{ urutan: "asc" }, { id: "asc" }],
    });
    return NextResponse.json({ cabang }, { status: 200 });
  } catch (error) {
    console.error("GET /informasi/cabang error:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data cabang" },
      { status: 500 }
    );
  }
}

// POST: tambah cabang
// body: { namaCabang, mapsUrl, urutan? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { namaCabang, mapsUrl, urutan } = body || {};

    if (!namaCabang || !mapsUrl) {
      return NextResponse.json(
        { message: "Nama cabang dan link Maps wajib diisi" },
        { status: 400 }
      );
    }

    const created = await prisma.cabangToko.create({
      data: {
        namaCabang,
        mapsUrl,
        urutan: urutan ? Number(urutan) : null,
      },
    });

    return NextResponse.json(
      { message: "Cabang berhasil ditambahkan", item: created },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /informasi/cabang error:", error);
    return NextResponse.json(
      { message: "Gagal menambahkan cabang" },
      { status: 500 }
    );
  }
}

// PUT: update cabang
// body: { id, namaCabang, mapsUrl, urutan? }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, namaCabang, mapsUrl, urutan } = body || {};
    const idNum = Number(id);

    if (!idNum || !namaCabang || !mapsUrl) {
      return NextResponse.json(
        { message: "ID, nama cabang dan link Maps wajib diisi" },
        { status: 400 }
      );
    }

    const updated = await prisma.cabangToko.update({
      where: { id: idNum },
      data: {
        namaCabang,
        mapsUrl,
        urutan: urutan ? Number(urutan) : null,
      },
    });

    return NextResponse.json(
      { message: "Cabang berhasil diupdate", item: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /informasi/cabang error:", error);
    return NextResponse.json(
      { message: "Gagal mengupdate cabang" },
      { status: 500 }
    );
  }
}

// DELETE: hapus cabang
// body: { id }
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body || {};
    const idNum = Number(id);

    if (!idNum) {
      return NextResponse.json(
        { message: "ID tidak valid" },
        { status: 400 }
      );
    }

    await prisma.cabangToko.delete({
      where: { id: idNum },
    });

    return NextResponse.json(
      { message: "Cabang berhasil dihapus" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /informasi/cabang error:", error);
    return NextResponse.json(
      { message: "Gagal menghapus cabang" },
      { status: 500 }
    );
  }
}
