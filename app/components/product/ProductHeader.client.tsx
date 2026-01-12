"use client";

interface ProductHeaderProps {
    title: string;
    description: string;
}

export default function ProductHeader({ title, description }: ProductHeaderProps) {
    return (
        <>
            <div className="product-header" style={{ marginBottom: 30 }}>
                <h1 style={{ fontSize: "clamp(28px, 4vw, 36px)", fontWeight: "800", color: "#0f172a", marginBottom: 8 }}>
                    {title}
                </h1>
                <p style={{ color: "#64748b", fontSize: 14 }}>
                    {description}
                </p>
            </div>

            <style jsx>{`
                @media (max-width: 968px) {
                    .product-header {
                        padding: 0 12px;
                    }
                }
            `}</style>
        </>
    );
}
