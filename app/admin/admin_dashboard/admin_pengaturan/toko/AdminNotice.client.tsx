"use client";

import { useEffect, useState } from "react";

interface AdminNoticeProps {
    notice?: string;
    error?: string;
    closeNoticeUrl: string;
    closeErrorUrl: string;
}

export default function AdminNotice({ notice, error, closeNoticeUrl, closeErrorUrl }: AdminNoticeProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (!notice && !error) return;

        const timer = setTimeout(() => {
            setVisible(false);
            // Update URL silently to remove query params so refresh doesn't show it again
            const newUrl = notice ? closeNoticeUrl : closeErrorUrl;
            if (newUrl) {
                window.history.replaceState({}, "", newUrl);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [notice, error, closeNoticeUrl, closeErrorUrl]);

    if (!visible) return null;
    if (!notice && !error) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 18,
                right: 18,
                zIndex: 10000,
                display: "grid",
                gap: 10,
                width: "min(640px, 92vw)",
            }}
        >
            {notice && (
                <div
                    role="status"
                    style={{
                        background: "linear-gradient(180deg, #fff9e8 0%, #ffffff 100%)",
                        border: "1px solid rgba(212,175,55,0.75)",
                        borderRadius: 14,
                        padding: "12px 14px",
                        boxShadow: "0 18px 36px rgba(2,6,23,0.25)",
                        color: "#0b1c3f",
                        position: "relative",
                    }}
                >
                    <div style={{ fontWeight: 900 }}>Berhasil</div>
                    <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.45 }}>{notice}</div>
                    <a
                        href={closeNoticeUrl}
                        aria-label="Tutup"
                        style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            border: "1px solid rgba(0,0,0,0.12)",
                            background: "white",
                            color: "#111",
                            fontWeight: 900,
                            cursor: "pointer",
                            textDecoration: "none",
                            display: "grid",
                            placeItems: "center",
                        }}
                    >
                        x
                    </a>
                </div>
            )}

            {error && (
                <div
                    role="alert"
                    style={{
                        background: "linear-gradient(180deg, #ffecec 0%, #ffffff 100%)",
                        border: "1px solid rgba(211,47,47,0.6)",
                        borderRadius: 14,
                        padding: "12px 14px",
                        boxShadow: "0 18px 36px rgba(2,6,23,0.25)",
                        color: "#611a15",
                        position: "relative",
                    }}
                >
                    <div style={{ fontWeight: 900 }}>Error</div>
                    <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.45 }}>{error}</div>
                    <a
                        href={closeErrorUrl}
                        aria-label="Tutup"
                        style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            border: "1px solid rgba(0,0,0,0.12)",
                            background: "white",
                            color: "#111",
                            fontWeight: 900,
                            cursor: "pointer",
                            textDecoration: "none",
                            display: "grid",
                            placeItems: "center",
                        }}
                    >
                        x
                    </a>
                </div>
            )}
        </div>
    );
}
