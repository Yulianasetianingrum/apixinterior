// lib/saveUploadToDisk.ts
import { promises as fs } from "fs";
import path from "path";

/**
 * Menyimpan File (dari FormData) ke folder public/uploads
 * lalu mengembalikan path relatif yg bisa dipakai di <img src="/...">
 */
export async function saveUploadToDisk(file: File, folder = "uploads") {
  // ubah File → Buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // pastikan folder ada: /public/uploads
  const uploadDir = path.join(process.cwd(), "public", folder);
  await fs.mkdir(uploadDir, { recursive: true });

  // bikin nama file aman
  const original = file.name || "upload";
  const cleaned = original.replace(/\s+/g, "-").replace(/[^\w.-]/g, "");
  const extMatch = cleaned.match(/(\.[a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : "";
  const base = cleaned.replace(/(\.[a-zA-Z0-9]+)$/, "");

  const fileName = `${Date.now()}-${base}${ext}`;
  const filePath = path.join(uploadDir, fileName);

  // tulis file
  await fs.writeFile(filePath, buffer);

  // kembalikan path relatif utk disimpan di DB & dipakai di <img src={`/${relativePath}`}/>
  return `${folder}/${fileName}`;
}
