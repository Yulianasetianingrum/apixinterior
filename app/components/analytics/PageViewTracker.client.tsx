"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function PageViewTracker() {
    const pathname = usePathname();
    const lastTracked = useRef<string | null>(null);

    useEffect(() => {
        // Avoid double tracking in React Strict Mode or rapid updates, though usually safe in useEffect dependency array
        if (lastTracked.current === pathname) return;

        const track = async () => {
            try {
                await fetch("/api/analytics/track", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path: pathname }),
                });
                lastTracked.current = pathname;
            } catch (err) {
                console.error("Tracking failed", err);
            }
        };

        // Debounce slightly or just run
        const timer = setTimeout(track, 500);
        return () => clearTimeout(timer);
    }, [pathname]);

    return null;
}
