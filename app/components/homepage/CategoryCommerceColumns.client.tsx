"use client";

import * as React from "react";
import Link from "next/link";
import SecureImage from "@/app/components/SecureImage";
import ui from "./CategoryCommerceColumns.module.css";

type CommerceItem = {
  id: number;
  name: string;
  href: string;
  imageUrl?: string | null;
  tabId?: string | null;
};

function resolveCols(width: number, total: number) {
  if (width < 768) return 2;
  if (width < 1024) return total <= 4 ? 2 : 3;
  if (total <= 4) return 2;
  if (total <= 6) return 3;
  return 4;
}

export default function CategoryCommerceColumns({
  items,
  fallbackUrl,
  mode = "clean",
  tabs = [],
  viewAllHref,
}: {
  items: CommerceItem[];
  fallbackUrl?: string | null;
  mode?: "clean" | "commerce" | "reverse";
  tabs?: Array<{ id: string; label: string }>;
  viewAllHref?: string | null;
}) {
  const [viewportWidth, setViewportWidth] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState<string>(tabs[0]?.id ?? "");

  React.useEffect(() => {
    if (!tabs.length) return;
    if (!tabs.find((t) => t.id === activeTab)) {
      setActiveTab(tabs[0]?.id ?? "");
    }
  }, [tabs, activeTab]);

  const filtered = mode === "reverse" && tabs.length
    ? items.filter((it) => (it.tabId ?? tabs[0]?.id ?? "") === activeTab)
    : items;
  const trimmed = filtered.slice(0, 16);
  const total = trimmed.length;

  React.useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const cols = React.useMemo(() => resolveCols(viewportWidth || 1200, total), [viewportWidth, total]);
  const rowsPerCol = cols > 0 ? Math.ceil(total / cols) : total;

  const columns = React.useMemo(() => {
    const out: CommerceItem[][] = [];
    for (let i = 0; i < cols; i += 1) {
      out.push(trimmed.slice(i * rowsPerCol, (i + 1) * rowsPerCol));
    }
    return out;
  }, [cols, rowsPerCol, trimmed]);

  const isCommerce = mode === "commerce" || mode === "reverse";
  const isReverse = mode === "reverse";
  const columnsClass = isCommerce ? `${ui.columns} ${ui.columnsCommerce}` : ui.columns;

  return (
    <div className={ui.root}>
      {mode === "reverse" && tabs.length ? (
        <div className={ui.tabs}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${ui.tabBtn} ${activeTab === t.id ? ui.tabActive : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className={columnsClass} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {columns.map((colItems, idx) => (
          <ul
            key={`col-${idx}`}
            className={isCommerce ? `${ui.columnList} ${ui.columnListCommerce}` : ui.columnList}
          >
            {colItems.map((c, itemIdx) => {
              const iconUrl = c.imageUrl || fallbackUrl || "";
              return (
                <li key={`${c.id}-${itemIdx}`} className={isCommerce ? `${ui.item} ${ui.itemCommerce}` : ui.item}>
                  <Link
                    href={c.href}
                    className={
                      isReverse
                        ? `${ui.link} ${ui.linkCommerce} ${ui.linkReverse}`
                        : isCommerce
                          ? `${ui.link} ${ui.linkCommerce}`
                          : ui.link
                    }
                  >
                    <span className={isCommerce ? `${ui.icon} ${ui.iconCommerce}` : ui.icon}>
                      {iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <SecureImage
                          src={iconUrl}
                          alt={`Kategori Interior ${c.name}`}
                          className={isCommerce ? `${ui.iconImg} ${ui.iconImgCommerce}` : ui.iconImg}
                        />
                      ) : null}
                    </span>
                    <span className={isCommerce ? `${ui.text} ${ui.textCommerce}` : ui.text} title={c.name}>
                      {c.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
      </div>

      {isReverse && viewAllHref ? (
        <div className={ui.viewAllWrap}>
          <Link href={viewAllHref} className={ui.viewAllLink}>
            Lihat Semua
          </Link>
        </div>
      ) : null}
    </div>
  );
}
