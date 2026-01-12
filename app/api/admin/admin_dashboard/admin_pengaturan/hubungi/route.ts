import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- util: normalisasi nomor WA ke format 62xxxxxxxxx ---
function normalizeWaNumber(value: string | undefined | null): string {
  if (!value) return "";

  // buang semua karakter selain angka
  let digits = value.replace(/[^\d]/g, "");

  if (!digits) return "";

  // kalau mulai dengan 0 -> ganti 0 jadi 62
  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  }

  // kalau belum mulai dengan 62 sama sekali -> tambahin 62 di depan
  if (!digits.startsWith("62")) {
    digits = "62" + digits;
  }

  return digits;
}

// GET -> ambil semua nomor
export async function GET() {
  try {
    const items = await prisma.hubungi.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json(
      {
        items,
        count: items.length,
        max: 5,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /hubungi error:", error);
    return NextResponse.json(
      { message: "Gagal mengambil daftar nomor WhatsApp" },
      { status: 500 }
    );
  }
}

// POST -> tambah nomor baru
// body: { waNumber: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawWa: string | undefined = body.waNumber;

    const normalized = normalizeWaNumber(rawWa);

    if (!normalized) {
      return NextResponse.json(
        { message: "Nomor WhatsApp tidak valid" },
        { status: 400 }
      );
    }

    const count = await prisma.hubungi.count();
    if (count >= 5) {
      return NextResponse.json(
        { message: "Maksimal 5 nomor WhatsApp" },
        { status: 400 }
      );
    }

    const record = await prisma.hubungi.create({
      data: {
        nomor: normalized,
      },
    });

    return NextResponse.json(
      { message: "Nomor WhatsApp berhasil ditambahkan", item: record },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /hubungi error:", error);
    return NextResponse.json(
      { message: "Gagal menambahkan nomor WhatsApp" },
      { status: 500 }
    );
  }
}

// PUT -> update nomor
// body: { id: number, waNumber: string }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = Number(body.id);
    const rawWa: string | undefined = body.waNumber;

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { message: "ID tidak valid" },
        { status: 400 }
      );
    }

    const normalized = normalizeWaNumber(rawWa);

    if (!normalized) {
      return NextResponse.json(
        { message: "Nomor WhatsApp tidak valid" },
        { status: 400 }
      );
    }

    const record = await prisma.hubungi.update({
      where: { id },
      data: { nomor: normalized },
    });

    return NextResponse.json(
      { message: "Nomor WhatsApp berhasil diupdate", item: record },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /hubungi error:", error);
    return NextResponse.json(
      { message: "Gagal mengupdate nomor WhatsApp" },
      { status: 500 }
    );
  }
}

// PATCH -> set prioritas
// body: { id: number }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = Number(body.id);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { message: "ID tidak valid" },
        { status: 400 }
      );
    }

    // matikan semua prioritas
    await prisma.hubungi.updateMany({
      data: { prioritas: false },
    });

    // aktifkan prioritas untuk satu id
    const record = await prisma.hubungi.update({
      where: { id },
      data: { prioritas: true },
    });

    return NextResponse.json(
      { message: "Nomor prioritas berhasil diubah", item: record },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /hubungi error:", error);
    return NextResponse.json(
      { message: "Gagal mengubah prioritas" },
      { status: 500 }
    );
  }
}

// DELETE -> hapus nomor
// body: { id: number }
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const id = Number(body.id);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { message: "ID tidak valid" },
        { status: 400 }
      );
    }

    await prisma.hubungi.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Nomor WhatsApp berhasil dihapus" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /hubungi error:", error);
    return NextResponse.json(
      { message: "Gagal menghapus nomor WhatsApp" },
      { status: 500 }
    );
  }
}
