import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "logos");
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split(".").pop() || "png";
    const filename = `${randomUUID()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const url = `/uploads/logos/${filename}`;

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error("UPLOAD LOGO error:", error);
    return NextResponse.json(
      { message: "Gagal mengupload logo" },
      { status: 500 }
    );
  }
}
