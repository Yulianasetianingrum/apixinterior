import React from 'react';
import Link from 'next/link';
import SecureImage from "@/app/components/SecureImage";

export function CategoryGridPreview({ data }: { data: any }) {
    const { title, columns, items } = data || {};

    if (!items) return null;

    // CSS variables are expected to be set by the parent
    // --cg-card-bg, --cg-card-fg, --cg-element, --cg-card-border

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: `repeat(${columns || 3}, minmax(0, 1fr))`,
        gap: '16px',
    };

    return (
        <div className="category-grid-preview">
            {/* Title */}
            {title && (
                <h2 style={{
                    marginBottom: '16px',
                    fontSize: '22px',
                    fontWeight: 600,
                    color: 'var(--cg-title-color, inherit)'
                }}>
                    {title}
                </h2>
            )}

            {/* Grid */}
            <div style={gridStyle}>
                {items.map((item: any, idx: number) => {
                    const href = item.href || "#";

                    return (
                        <Link
                            key={item.categoryId || idx}
                            href={href}
                            style={{ textDecoration: 'none', display: 'block' }}
                        >
                            <div style={{
                                border: '1px solid var(--cg-card-border, rgba(0,0,0,0.1))',
                                backgroundColor: 'var(--cg-card-bg, #ffffff)',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                color: 'var(--cg-card-fg, inherit)',
                                transition: 'transform 0.2s',
                            }}>
                                {/* Media */}
                                <div style={{ position: 'relative', aspectRatio: '4/3', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                                    {item.imageUrl ? (
                                        <SecureImage
                                            src={item.imageUrl}
                                            alt={item.title || "Category"}
                                            style={{ objectFit: 'cover', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: 0.5,
                                            fontSize: '14px',
                                            padding: '8px',
                                            textAlign: 'center'
                                        }}>
                                            {item.title}
                                        </div>
                                    )}
                                </div>

                                {/* Body */}
                                <div style={{ padding: '16px' }}>
                                    <div style={{
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {item.title}
                                    </div>
                                    {item.subtitle && (
                                        <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '4px' }}>
                                            {item.subtitle}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
