// app/admin/admin_dashboard/admin_pengaturan/toko/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { HomepageSectionType, NavbarPosition } from "@prisma/client";

// ===============================
// Helper
// ===============================

function revalidateAll() {
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/");
  revalidatePath("/admin");
}

// ===============================
// HOMEPAGE SECTION ACTIONS
// ===============================

export async function createHomepageSection(input: {
  type: HomepageSectionType;
  title: string;
  slug?: string;
}) {
  const last = await prisma.homepageSection.findFirst({
    orderBy: { sortOrder: "desc" },
  });

  const sortOrder = (last?.sortOrder ?? 0) + 10;

  await prisma.homepageSection.create({
    data: {
      type: input.type,
      title: input.title,
      slug: input.slug || input.title.toLowerCase().replace(/\s+/g, "-"),
      sortOrder,
      config: {
        bgColor: "white",
        titleColor: "black",
        textColor: "black",
        buttonColor: "gold",
      },
    },
  });

  revalidateAll();
}

export async function updateHomepageSection(input: {
  id: number;
  title?: string;
  slug?: string;
  enabled?: boolean;
  sortOrder?: number;
  config?: any;
}) {
  const { id, ...rest } = input;

  await prisma.homepageSection.update({
    where: { id },
    data: {
      ...rest,
    },
  });

  revalidateAll();
}

export async function deleteHomepageSection(id: number) {
  await prisma.homepageSection.delete({
    where: { id },
  });

  revalidateAll();
}

export async function reorderHomepageSections(
  items: { id: number; sortOrder: number }[]
) {
  await prisma.$transaction(
    items.map((item) =>
      prisma.homepageSection.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  revalidateAll();
}

// ===============================
// NAVBAR ACTIONS
// ===============================

export async function createNavbarItem(input: {
  label: string;
  href: string;
  position: NavbarPosition;
  isExternal?: boolean;
  iconKey?: string;
  showSearch?: boolean;
}) {
  const last = await prisma.navbarItem.findFirst({
    where: { position: input.position },
    orderBy: { sortOrder: "desc" },
  });

  const sortOrder = (last?.sortOrder ?? 0) + 10;

  await prisma.navbarItem.create({
    data: {
      label: input.label,
      href: input.href,
      position: input.position,
      sortOrder,
      isExternal: input.isExternal ?? false,
      iconKey: input.iconKey,
      showSearch: input.showSearch ?? false,
    },
  });

  revalidateAll();
}

export async function updateNavbarItem(input: {
  id: number;
  label?: string;
  href?: string;
  position?: NavbarPosition;
  enabled?: boolean;
  isExternal?: boolean;
  iconKey?: string;
  showSearch?: boolean;
}) {
  const { id, ...rest } = input;

  await prisma.navbarItem.update({
    where: { id },
    data: rest,
  });

  revalidateAll();
}

export async function deleteNavbarItem(id: number) {
  await prisma.navbarItem.delete({
    where: { id },
  });

  revalidateAll();
}

export async function reorderNavbarItems(
  items: { id: number; sortOrder: number }[]
) {
  await prisma.$transaction(
    items.map((item) =>
      prisma.navbarItem.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  revalidateAll();
}

// ===============================
// ADMIN MENU ACTIONS
// ===============================

export async function createAdminMenuItem(input: {
  label: string;
  path: string;
  iconKey?: string;
  parentId?: number | null;
}) {
  const last = await prisma.adminMenuItem.findFirst({
    where: { parentId: input.parentId ?? null },
    orderBy: { sortOrder: "desc" },
  });

  const sortOrder = (last?.sortOrder ?? 0) + 10;

  await prisma.adminMenuItem.create({
    data: {
      label: input.label,
      path: input.path,
      iconKey: input.iconKey,
      parentId: input.parentId ?? null,
      sortOrder,
    },
  });

  revalidateAll();
}

export async function updateAdminMenuItem(input: {
  id: number;
  label?: string;
  path?: string;
  iconKey?: string;
  parentId?: number | null;
  enabled?: boolean;
}) {
  const { id, ...rest } = input;

  await prisma.adminMenuItem.update({
    where: { id },
    data: rest,
  });

  revalidateAll();
}

export async function deleteAdminMenuItem(id: number) {
  await prisma.adminMenuItem.delete({
    where: { id },
  });

  revalidateAll();
}

export async function reorderAdminMenuItems(
  items: { id: number; sortOrder: number }[]
) {
  await prisma.$transaction(
    items.map((item) =>
      prisma.adminMenuItem.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  revalidateAll();
}
