// app/admin/admin_dashboard/admin_pengaturan/toko/TokoDashboardClient.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import type { HomepageSectionType, NavbarPosition } from "@prisma/client";
import {
  createHomepageSection,
  updateHomepageSection,
  deleteHomepageSection,
  reorderHomepageSections,
  createNavbarItem,
  updateNavbarItem,
  deleteNavbarItem,
  reorderNavbarItems,
  createAdminMenuItem,
  updateAdminMenuItem,
  deleteAdminMenuItem,
  reorderAdminMenuItems,
} from "./actions";

type BrandColorKey = "gold" | "navy" | "white" | "black";

type HomepageSectionDTO = {
  id: number;
  type: HomepageSectionType;
  title: string;
  slug: string;
  enabled: boolean;
  sortOrder: number;
  config: any;
};

type NavbarItemDTO = {
  id: number;
  label: string;
  href: string;
  position: NavbarPosition;
  enabled: boolean;
  sortOrder: number;
  isExternal: boolean;
  iconKey: string | null;
  showSearch: boolean;
};

type AdminMenuItemDTO = {
  id: number;
  label: string;
  path: string;
  iconKey: string | null;
  parentId: number | null;
  enabled: boolean;
  sortOrder: number;
};

type Props = {
  initialSections: HomepageSectionDTO[];
  initialNavbarItems: NavbarItemDTO[];
  initialAdminMenuItems: AdminMenuItemDTO[];
};

const brandColorOptions: { key: BrandColorKey; label: string }[] = [
  { key: "gold", label: "Bright Gold" },
  { key: "navy", label: "Navy Blue" },
  { key: "white", label: "White" },
  { key: "black", label: "Black" },
];

export function TokoDashboardClient({
  initialSections,
  initialNavbarItems,
  initialAdminMenuItems,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"sections" | "navbar" | "sidebar">("sections");
  const [isPending, startTransition] = useTransition();

  const [sections, setSections] = useState<HomepageSectionDTO[]>(initialSections);
  const [navbarItems, setNavbarItems] =
    useState<NavbarItemDTO[]>(initialNavbarItems);
  const [adminMenuItems, setAdminMenuItems] =
    useState<AdminMenuItemDTO[]>(initialAdminMenuItems);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    if (result.source.droppableId === "sections") {
      const updated = Array.from(sections);
      const [moved] = updated.splice(result.source.index, 1);
      updated.splice(result.destination.index, 0, moved);

      const reordered = updated.map((s, idx) => ({
        id: s.id,
        sortOrder: idx * 10,
      }));

      setSections(updated);
      startTransition(async () => {
        await reorderHomepageSections(reordered);
        router.refresh();
      });
      return;
    }

    if (result.source.droppableId.startsWith("navbar-")) {
      const position = result.source.droppableId.split("navbar-")[1] as NavbarPosition;
      const allForPos = navbarItems
        .filter((n) => n.position === position)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const others = navbarItems.filter((n) => n.position !== position);

      const updated = Array.from(allForPos);
      const [moved] = updated.splice(result.source.index, 1);
      updated.splice(result.destination.index, 0, moved);

      const reordered = updated.map((n, idx) => ({
        id: n.id,
        sortOrder: idx * 10,
      }));

      const merged = [...others, ...updated];
      setNavbarItems(merged);

      startTransition(async () => {
        await reorderNavbarItems(reordered);
        router.refresh();
      });
      return;
    }

    if (result.source.droppableId === "admin-menu-root") {
      const updated = Array.from(
        adminMenuItems
          .filter((m) => m.parentId === null)
          .sort((a, b) => a.sortOrder - b.sortOrder)
      );
      const others = adminMenuItems.filter((m) => m.parentId !== null);

      const [moved] = updated.splice(result.source.index, 1);
      updated.splice(result.destination.index, 0, moved);

      const reordered = updated.map((m, idx) => ({
        id: m.id,
        sortOrder: idx * 10,
      }));

      const merged = [...others, ...updated];
      setAdminMenuItems(merged);

      startTransition(async () => {
        await reorderAdminMenuItems(reordered);
        router.refresh();
      });
    }
  };

  // ============================
  // FORM HANDLERS
  // ============================

  const onCreateSection = (formData: FormData) => {
    const type = formData.get("type") as HomepageSectionType;
    const title = (formData.get("title") as string) || "";
    const slug = (formData.get("slug") as string) || undefined;

    if (!title) return;

    startTransition(async () => {
      await createHomepageSection({ type, title, slug });
      router.refresh();
    });
  };

  const onCreateNavbarItem = (formData: FormData) => {
    const label = (formData.get("label") as string) || "";
    const href = (formData.get("href") as string) || "/";
    const position = formData.get("position") as NavbarPosition;

    if (!label) return;

    startTransition(async () => {
      await createNavbarItem({
        label,
        href,
        position,
      });
      router.refresh();
    });
  };

  const onCreateAdminMenuItem = (formData: FormData) => {
    const label = (formData.get("label") as string) || "";
    const path = (formData.get("path") as string) || "/";
    const parentIdValue = formData.get("parentId") as string;
    const parentId =
      parentIdValue && parentIdValue.trim().length > 0
        ? Number(parentIdValue)
        : null;

    if (!label) return;

    startTransition(async () => {
      await createAdminMenuItem({ label, path, parentId });
      router.refresh();
    });
  };

  // ============================
  // RENDER
  // ============================

  return (
    <div className="mt-6 rounded-xl border bg-white shadow-sm">
      <div className="border-b px-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Control Panel Toko</h2>
          {isPending && (
            <span className="text-xs text-gray-500">Menyimpan</span>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("sections")}
            className={`rounded-full px-3 py-1 text-sm ${
              tab === "sections"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Section Homepage
          </button>
          <button
            type="button"
            onClick={() => setTab("navbar")}
            className={`rounded-full px-3 py-1 text-sm ${
              tab === "navbar"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Navbar User
          </button>
          <button
            type="button"
            onClick={() => setTab("sidebar")}
            className={`rounded-full px-3 py-1 text-sm ${
              tab === "sidebar"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Menu Admin / Sidebar
          </button>
        </div>
      </div>

      <div className="p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          {tab === "sections" && (
            <TabSections
              sections={sections}
              setSections={setSections}
              onCreateSection={onCreateSection}
            />
          )}
          {tab === "navbar" && (
            <TabNavbar
              navbarItems={navbarItems}
              setNavbarItems={setNavbarItems}
              onCreateNavbarItem={onCreateNavbarItem}
            />
          )}
          {tab === "sidebar" && (
            <TabSidebar
              adminMenuItems={adminMenuItems}
              setAdminMenuItems={setAdminMenuItems}
              onCreateAdminMenuItem={onCreateAdminMenuItem}
            />
          )}
        </DragDropContext>
      </div>
    </div>
  );
}

// ============================
// TAB 1  SECTIONS
// ============================

function TabSections({
  sections,
  setSections,
  onCreateSection,
}: {
  sections: HomepageSectionDTO[];
  setSections: (s: HomepageSectionDTO[]) => void;
  onCreateSection: (fd: FormData) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Form tambah section */}
      <form
        action={onCreateSection}
        className="flex flex-wrap items-end gap-3 rounded-lg border bg-gray-50 p-3"
      >
        <div>
          <label className="block text-xs font-medium text-gray-600">
            Tipe Section
          </label>
          <select
            name="type"
            className="mt-1 rounded-md border px-2 py-1 text-sm"
            defaultValue="HERO"
          >
            <option value="HERO">Hero</option>
            <option value="CATEGORY_GRID">Category Grid</option>
            <option value="FEATURED_COLLECTIONS">Featured Collections</option>
            <option value="PRODUCT_LIST">Product List</option>
            <option value="GALLERY">Gallery</option>
            <option value="INFO">Info</option>
            <option value="CONTACT">Contact</option>
            <option value="CUSTOM_TEXT">Custom Text</option>
          </select>
        </div>
        <div className="min-w-[180px]">
          <label className="block text-xs font-medium text-gray-600">
            Judul
          </label>
          <input
            name="title"
            className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
            placeholder="Contoh: Hero Utama"
          />
        </div>
        <div className="min-w-[180px]">
          <label className="block text-xs font-medium text-gray-600">
            Slug (opsional)
          </label>
          <input
            name="slug"
            className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
            placeholder="hero-utama"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white"
        >
          + Tambah Section
        </button>
      </form>

      {/* List + drag & drop */}
      <Droppable droppableId="sections">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-3"
          >
            {sections
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((section, index) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  index={index}
                  setSections={setSections}
                />
              ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

function SectionCard({
  section,
  index,
  setSections,
}: {
  section: HomepageSectionDTO;
  index: number;
  setSections: (s: HomepageSectionDTO[]) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const config = (section.config || {}) as {
    bgColor?: BrandColorKey;
    titleColor?: BrandColorKey;
    textColor?: BrandColorKey;
    buttonColor?: BrandColorKey;
    maxItems?: number;
  };

  const handleBasicUpdate = (patch: Partial<HomepageSectionDTO>) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === section.id
          ? {
              ...s,
              ...patch,
            }
          : s
      )
    );

    startTransition(async () => {
      await updateHomepageSection({
        id: section.id,
        title: patch.title,
        slug: patch.slug,
        enabled: patch.enabled,
      });
    });
  };

  const handleConfigChange = (patch: Partial<typeof config>) => {
    const nextConfig = { ...config, ...patch };
    setSections((prev) =>
      prev.map((s) =>
        s.id === section.id
          ? {
              ...s,
              config: nextConfig,
            }
          : s
      )
    );

    startTransition(async () => {
      await updateHomepageSection({
        id: section.id,
        config: nextConfig,
      });
    });
  };

  const handleDelete = () => {
    if (!confirm("Hapus section ini?")) return;
    startTransition(async () => {
      await deleteHomepageSection(section.id);
    });
  };

  return (
    <Draggable draggableId={`section-${section.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          className={`flex flex-col gap-3 rounded-lg border p-3 text-sm ${
            snapshot.isDragging ? "bg-gray-100" : "bg-white"
          }`}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-1 items-start gap-2">
              <div
                className="mt-1 cursor-grab text-gray-400"
                {...provided.dragHandleProps}
              >
                
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase text-gray-600">
                    {section.type}
                  </span>
                  <input
                    className="flex-1 rounded border px-2 py-1 text-xs"
                    value={section.title}
                    onChange={(e) =>
                      handleBasicUpdate({ title: e.target.value })
                    }
                  />
                  <label className="flex items-center gap-1 text-[11px] text-gray-600">
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={(e) =>
                        handleBasicUpdate({ enabled: e.target.checked })
                      }
                    />
                    Aktif
                  </label>
                </div>
                <input
                  className="w-full rounded border px-2 py-1 text-xs"
                  value={section.slug}
                  onChange={(e) =>
                    handleBasicUpdate({ slug: e.target.value })
                  }
                  placeholder="slug-section"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-md bg-red-50 px-2 py-1 text-[11px] text-red-600"
            >
              Hapus
            </button>
          </div>

          {/* Picker warna */}
          <div className="grid gap-2 md:grid-cols-4">
            <ColorSelect
              label="Background"
              value={config.bgColor || "white"}
              onChange={(v) =>
                handleConfigChange({ bgColor: v as BrandColorKey })
              }
            />
            <ColorSelect
              label="Judul"
              value={config.titleColor || "black"}
              onChange={(v) =>
                handleConfigChange({ titleColor: v as BrandColorKey })
              }
            />
            <ColorSelect
              label="Teks"
              value={config.textColor || "black"}
              onChange={(v) =>
                handleConfigChange({ textColor: v as BrandColorKey })
              }
            />
            <ColorSelect
              label="Tombol"
              value={config.buttonColor || "gold"}
              onChange={(v) =>
                handleConfigChange({ buttonColor: v as BrandColorKey })
              }
            />
          </div>

          {/* Sedikit behaviour generik */}
          {(section.type === "PRODUCT_LIST" ||
            section.type === "CATEGORY_GRID" ||
            section.type === "FEATURED_COLLECTIONS" ||
            section.type === "GALLERY") && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">
                Max items (opsional):
              </label>
              <input
                type="number"
                className="w-20 rounded border px-2 py-1 text-xs"
                value={config.maxItems ?? ""}
                onChange={(e) =>
                  handleConfigChange({
                    maxItems:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  })
                }
              />
            </div>
          )}

          {section.type === "CUSTOM_TEXT" && (
            <p className="text-[11px] text-gray-500">
              Konten lengkap custom text bisa kamu simpan di config nanti
              (misalnya field <code>body</code>). Untuk sekarang fokus dulu ke
              urutan & warna section.
            </p>
          )}

          {isPending && (
            <span className="text-[10px] text-gray-500">Menyimpan</span>
          )}
        </div>
      )}
    </Draggable>
  );
}

function ColorSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: BrandColorKey;
  onChange: (v: BrandColorKey) => void;
}) {
  return (
    <div className="space-y-1">
      <span className="block text-[11px] text-gray-600">{label}</span>
      <select
        className="w-full rounded border px-2 py-1 text-xs"
        value={value}
        onChange={(e) => onChange(e.target.value as BrandColorKey)}
      >
        {brandColorOptions.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================
// TAB 2  NAVBAR
// ============================

function TabNavbar({
  navbarItems,
  setNavbarItems,
  onCreateNavbarItem,
}: {
  navbarItems: NavbarItemDTO[];
  setNavbarItems: (items: NavbarItemDTO[]) => void;
  onCreateNavbarItem: (fd: FormData) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const groups: NavbarPosition[] = ["MAIN", "BOTTOM", "FOOTER"];

  const handleToggle = (item: NavbarItemDTO, patch: Partial<NavbarItemDTO>) => {
    const next = { ...item, ...patch };
    setNavbarItems((prev) =>
      prev.map((n) => (n.id === item.id ? next : n))
    );

    startTransition(async () => {
      await updateNavbarItem({
        id: item.id,
        enabled: patch.enabled,
        label: patch.label,
        href: patch.href,
        isExternal: patch.isExternal,
        showSearch: patch.showSearch,
      });
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Hapus item navbar ini?")) return;
    startTransition(async () => {
      await deleteNavbarItem(id);
    });
  };

  return (
    <div className="space-y-4">
      {/* Form tambah navbar */}
      <form
        action={onCreateNavbarItem}
        className="flex flex-wrap items-end gap-3 rounded-lg border bg-gray-50 p-3"
      >
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-gray-600">
            Label
          </label>
          <input
            name="label"
            className="mt-1 w-full rounded-md border px-2 py-1 text-xs"
            placeholder="Beranda"
          />
        </div>
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-gray-600">
            Href
          </label>
          <input
            name="href"
            className="mt-1 w-full rounded-md border px-2 py-1 text-xs"
            placeholder="/"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">
            Posisi
          </label>
          <select
            name="position"
            className="mt-1 rounded-md border px-2 py-1 text-xs"
            defaultValue="MAIN"
          >
            <option value="MAIN">Main (atas)</option>
            <option value="BOTTOM">Bottom</option>
            <option value="FOOTER">Footer</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white"
        >
          + Tambah Item
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        {groups.map((pos) => {
          const items = navbarItems
            .filter((n) => n.position === pos)
            .sort((a, b) => a.sortOrder - b.sortOrder);

          return (
            <div key={pos} className="rounded-lg border p-3">
              <h3 className="mb-2 text-xs font-semibold text-gray-700">
                {pos === "MAIN"
                  ? "Main (Navbar atas)"
                  : pos === "BOTTOM"
                  ? "Bottom bar"
                  : "Footer"}
              </h3>

              <Droppable droppableId={`navbar-${pos}`}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2"
                  >
                    {items.map((item, index) => (
                      <Draggable
                        key={item.id}
                        draggableId={`navbar-${pos}-${item.id}`}
                        index={index}
                      >
                        {(provided2, snapshot2) => (
                          <div
                            ref={provided2.innerRef}
                            {...provided2.draggableProps}
                            className={`flex items-center gap-2 rounded border px-2 py-1 text-xs ${
                              snapshot2.isDragging ? "bg-gray-100" : "bg-white"
                            }`}
                          >
                            <div
                              className="cursor-grab text-gray-400"
                              {...provided2.dragHandleProps}
                            >
                              
                            </div>
                            <div className="flex-1 space-y-1">
                              <input
                                className="w-full rounded border px-2 py-1 text-xs"
                                value={item.label}
                                onChange={(e) =>
                                  handleToggle(item, {
                                    label: e.target.value,
                                  })
                                }
                              />
                              <input
                                className="w-full rounded border px-2 py-1 text-[11px]"
                                value={item.href}
                                onChange={(e) =>
                                  handleToggle(item, {
                                    href: e.target.value,
                                  })
                                }
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <label className="flex items-center gap-1 text-[10px] text-gray-600">
                                  <input
                                    type="checkbox"
                                    checked={item.enabled}
                                    onChange={(e) =>
                                      handleToggle(item, {
                                        enabled: e.target.checked,
                                      })
                                    }
                                  />
                                  Aktif
                                </label>
                                <label className="flex items-center gap-1 text-[10px] text-gray-600">
                                  <input
                                    type="checkbox"
                                    checked={item.showSearch}
                                    onChange={(e) =>
                                      handleToggle(item, {
                                        showSearch: e.target.checked,
                                      })
                                    }
                                  />
                                  Show search
                                </label>
                                <label className="flex items-center gap-1 text-[10px] text-gray-600">
                                  <input
                                    type="checkbox"
                                    checked={item.isExternal}
                                    onChange={(e) =>
                                      handleToggle(item, {
                                        isExternal: e.target.checked,
                                      })
                                    }
                                  />
                                  External
                                </label>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="rounded bg-red-50 px-2 py-1 text-[10px] text-red-600"
                            >
                              Hapus
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>

      {isPending && (
        <p className="text-[10px] text-gray-500">Menyimpan navbar</p>
      )}
    </div>
  );
}

// ============================
// TAB 3  ADMIN SIDEBAR
// ============================

function TabSidebar({
  adminMenuItems,
  setAdminMenuItems,
  onCreateAdminMenuItem,
}: {
  adminMenuItems: AdminMenuItemDTO[];
  setAdminMenuItems: (items: AdminMenuItemDTO[]) => void;
  onCreateAdminMenuItem: (fd: FormData) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const roots = adminMenuItems
    .filter((m) => m.parentId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const childrenByParent: Record<number, AdminMenuItemDTO[]> = {};
  adminMenuItems.forEach((item) => {
    if (item.parentId) {
      childrenByParent[item.parentId] ||= [];
      childrenByParent[item.parentId].push(item);
    }
  });
  Object.values(childrenByParent).forEach((list) =>
    list.sort((a, b) => a.sortOrder - b.sortOrder)
  );

  const handleToggle = (item: AdminMenuItemDTO, patch: Partial<AdminMenuItemDTO>) => {
    const next = { ...item, ...patch };
    setAdminMenuItems((prev) =>
      prev.map((m) => (m.id === item.id ? next : m))
    );

    startTransition(async () => {
      await updateAdminMenuItem({
        id: item.id,
        label: patch.label,
        path: patch.path,
        iconKey: patch.iconKey,
        enabled: patch.enabled,
      });
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Hapus menu ini? (children ikut hilang)")) return;
    startTransition(async () => {
      await deleteAdminMenuItem(id);
    });
  };

  return (
    <div className="space-y-4">
      {/* Form tambah menu */}
      <form
        action={onCreateAdminMenuItem}
        className="flex flex-wrap items-end gap-3 rounded-lg border bg-gray-50 p-3"
      >
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-gray-600">
            Label
          </label>
          <input
            name="label"
            className="mt-1 w-full rounded-md border px-2 py-1 text-xs"
            placeholder="Dashboard"
          />
        </div>
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-gray-600">
            Path
          </label>
          <input
            name="path"
            className="mt-1 w-full rounded-md border px-2 py-1 text-xs"
            placeholder="/admin"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">
            Parent ID (opsional)
          </label>
          <input
            name="parentId"
            className="mt-1 w-28 rounded-md border px-2 py-1 text-xs"
            placeholder="root"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white"
        >
          + Tambah Menu
        </button>
      </form>

      <Droppable droppableId="admin-menu-root">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-2"
          >
            {roots.map((item, index) => (
              <Draggable
                key={item.id}
                draggableId={`admin-root-${item.id}`}
                index={index}
              >
                {(provided2, snapshot2) => (
                  <div
                    ref={provided2.innerRef}
                    {...provided2.draggableProps}
                    className={`rounded border p-2 text-xs ${
                      snapshot2.isDragging ? "bg-gray-100" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="cursor-grab text-gray-400"
                        {...provided2.dragHandleProps}
                      >
                        
                      </div>
                      <input
                        className="flex-1 rounded border px-2 py-1 text-xs"
                        value={item.label}
                        onChange={(e) =>
                          handleToggle(item, { label: e.target.value })
                        }
                      />
                      <input
                        className="w-48 rounded border px-2 py-1 text-xs"
                        value={item.path}
                        onChange={(e) =>
                          handleToggle(item, { path: e.target.value })
                        }
                      />
                      <label className="flex items-center gap-1 text-[10px] text-gray-600">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(e) =>
                            handleToggle(item, { enabled: e.target.checked })
                          }
                        />
                        Aktif
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="rounded bg-red-50 px-2 py-1 text-[10px] text-red-600"
                      >
                        Hapus
                      </button>
                    </div>

                    {/* Children (tanpa drag dulu, simple list) */}
                    {(childrenByParent[item.id] || []).length > 0 && (
                      <div className="mt-2 space-y-1 border-l pl-3">
                        {childrenByParent[item.id].map((child) => (
                          <div
                            key={child.id}
                            className="flex items-center gap-2 text-[11px]"
                          >
                            <span className="text-gray-400"></span>
                            <input
                              className="flex-1 rounded border px-2 py-1 text-[11px]"
                              value={child.label}
                              onChange={(e) =>
                                handleToggle(child, {
                                  label: e.target.value,
                                })
                              }
                            />
                            <input
                              className="w-40 rounded border px-2 py-1 text-[11px]"
                              value={child.path}
                              onChange={(e) =>
                                handleToggle(child, {
                                  path: e.target.value,
                                })
                              }
                            />
                            <label className="flex items-center gap-1 text-[10px] text-gray-600">
                              <input
                                type="checkbox"
                                checked={child.enabled}
                                onChange={(e) =>
                                  handleToggle(child, {
                                    enabled: e.target.checked,
                                  })
                                }
                              />
                              Aktif
                            </label>
                            <button
                              type="button"
                              onClick={() => handleDelete(child.id)}
                              className="rounded bg-red-50 px-2 py-1 text-[10px] text-red-600"
                            >
                              Hapus
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {isPending && (
        <p className="text-[10px] text-gray-500">Menyimpan menu admin</p>
      )}
    </div>
  );
}

