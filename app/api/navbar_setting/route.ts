// app/api/navbar_setting/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "NAVY_GOLD",
  "WHITE_GOLD",
  "NAVY_WHITE",
  "GOLD_NAVY",
  "GOLD_WHITE",
  "WHITE_NAVY",
]);

export async function GET() {
  const setting = await prisma.navbarSetting.findUnique({ where: { id: 1 } });
  return NextResponse.json({ theme: setting?.theme ?? "NAVY_GOLD" });
}

export async function POST(req: NextRequest) {
  let theme: string | null = null;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as any;
    theme = typeof body?.theme === "string" ? body.theme : null;
  } else {
    const form = await req.formData().catch(() => null);
    theme = typeof form?.get("theme") === "string" ? String(form.get("theme")) : null;
  }

  if (!theme || !ALLOWED.has(theme)) {
    return NextResponse.json(
      { error: "Invalid theme", allowed: Array.from(ALLOWED) },
      { status: 400 }
    );
  }

  await prisma.navbarSetting.upsert({
    where: { id: 1 },
    create: { id: 1, theme: theme as any },
    update: { theme: theme as any },
  });

  // balik lagi ke halaman asal (kalau ada) biar UX enak
  const referer = req.headers.get("referer");
  if (referer) {
    return NextResponse.redirect(referer, { status: 303 });
  }

  return NextResponse.json({ ok: true, theme });
}
