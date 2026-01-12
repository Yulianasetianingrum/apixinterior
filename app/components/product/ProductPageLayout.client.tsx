"use client";

import { ReactNode } from "react";

interface ProductPageLayoutProps {
    sidebar: ReactNode;
    content: ReactNode;
}

export default function ProductPageLayout({ sidebar, content }: ProductPageLayoutProps) {
    return (
        <>
            <main className="product-page-main" style={{
                maxWidth: "1400px",
                margin: "0 auto",
                padding: "40px 24px",
                display: "flex",
                gap: "30px",
                alignItems: "flex-start"
            }}>
                {sidebar}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {content}
                </div>
            </main>

            <style jsx>{`
                @media (max-width: 968px) {
                    :global(.product-page-main) {
                        padding: 20px 0 !important;
                    }
                }
            `}</style>
        </>
    );
}
