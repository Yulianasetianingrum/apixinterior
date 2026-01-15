import Link from "next/link";
import ui from "./CategoryGridPreview.module.css";

export type CategoryGridPreviewItem = {
    categoryId: number;
    title: string;
    href: string;
    imageUrl?: string | null;
    subtitle?: string | null;
};

export type CategoryGridPreviewData = {
    title?: string | null;
    columns?: number;
    items: CategoryGridPreviewItem[];
};

export function CategoryGridPreview({ data }: { data: CategoryGridPreviewData }) {
    const cols = clampInt(data.columns ?? 3, 2, 6);
    const colsTablet = Math.min(cols, 3);
    const colsMobile = Math.min(cols, 2);

    return (
        <section className={ui.section}>
            {data.title ? (
                <div className={ui.header}>
                    <h2 className={ui.title} style={{ color: 'var(--cg-title-color, var(--cg-element, inherit))' }}>{data.title}</h2>
                </div>
            ) : null}

            <div
                className={ui.grid}
                style={{
                    ["--cols" as any]: cols,
                    ["--colsTablet" as any]: colsTablet,
                    ["--colsMobile" as any]: colsMobile,
                }}
            >
                {data.items.map((it) => (
                    <Link key={String(it.categoryId)} href={it.href} className={ui.card}>
                        <div className={ui.media}>
                            {it.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img className={ui.img} src={it.imageUrl} alt={it.title} />
                            ) : (
                                <div className={ui.imgPlaceholder} />
                            )}
                        </div>

                        <div className={ui.body}>
                            <div className={ui.cardTitle}>{it.title}</div>
                            {it.subtitle ? <div className={ui.sub}>{it.subtitle}</div> : null}
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

function clampInt(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, Math.floor(n)));
}
