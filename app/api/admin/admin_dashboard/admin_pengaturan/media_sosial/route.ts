import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: ambil semua media sosial
export async function GET() {
  try {
    const items = await prisma.mediaSosial.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error("GET /media_sosial error:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data media sosial" },
      { status: 500 }
    );
  }
}

// POST: tambah media sosial
// body: { nama, iconKey, url }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, iconKey, url } = body || {};

    if (!nama || !iconKey || !url) {
      return NextResponse.json(
        { message: "Nama, icon, dan URL wajib diisi" },
        { status: 400 }
      );
    }

    const created = await prisma.mediaSosial.create({
      data: { nama, iconKey, url },
    });

    return NextResponse.json(
      { message: "Media sosial berhasil ditambahkan", item: created },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /media_sosial error:", error);
    return NextResponse.json(
      { message: "Gagal menambahkan media sosial" },
      { status: 500 }
    );
  }
}

// PUT: update media sosial
// body: { id, nama, iconKey, url }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, nama, iconKey, url } = body || {};
    const idNum = Number(id);

    if (!idNum || !nama || !iconKey || !url) {
      return NextResponse.json(
        { message: "ID, nama, icon, dan URL wajib diisi" },
        { status: 400 }
      );
    }

    const updated = await prisma.mediaSosial.update({
      where: { id: idNum },
      data: { nama, iconKey, url },
    });

    return NextResponse.json(
      { message: "Media sosial berhasil diupdate", item: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /media_sosial error:", error);
    return NextResponse.json(
      { message: "Gagal mengupdate media sosial" },
      { status: 500 }
    );
  }
}

// PATCH: set prioritas (hanya satu yang boleh prioritas)
export async function PATCH(req: NextRequest) {
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

    // matikan semua prioritas
    await prisma.mediaSosial.updateMany({
      data: { prioritas: false },
    });

    // nyalakan prioritas untuk satu id
    const updated = await prisma.mediaSosial.update({
      where: { id: idNum },
      data: { prioritas: true },
    });

    return NextResponse.json(
      { message: "Prioritas media sosial berhasil diubah", item: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /media_sosial error:", error);
    return NextResponse.json(
      { message: "Gagal mengubah prioritas media sosial" },
      { status: 500 }
    );
  }
}

// DELETE: hapus media sosial
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

    await prisma.mediaSosial.delete({
      where: { id: idNum },
    });

    return NextResponse.json(
      { message: "Media sosial berhasil dihapus" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /media_sosial error:", error);
    return NextResponse.json(
      { message: "Gagal menghapus media sosial" },
      { status: 500 }
    );
  }
}
