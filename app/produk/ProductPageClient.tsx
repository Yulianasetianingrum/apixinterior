"use client";

import { useState, cloneElement, ReactElement } from "react";
import styles from "./page.module.css";
import { FaFilter } from "react-icons/fa6";

export default function ProductPageClient({
    title,
    sidebarSlot,
    children
}: {
    title: string;
    sidebarSlot: ReactElement;
    children: React.ReactNode
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div style={{ background: "#ffffff", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
            {/* Navbar is in page.tsx layout but outside this wrapper usually, or passed as children? 
           Based on page.tsx, Navbar was directly in the component. 
           We will let page.tsx render Navbar OUTSIDE or INSIDE this wrapper. 
           Actually page.tsx has: <Navbar/> then <main>. 
           We will treat this component as the <main> wrapper basically or the container inside main.
           Let's match the original structure:
           <Navbar />
           <main className={styles.container}> ... </main>
           
           So this component matches the CONTENT of <main>.
       */}
            <main className={styles.container}>
                <h1 className={styles.title}>{title}</h1>

                {/* New Filter Button (Mobile Only) */}
                <button
                    className={styles.mobileFilterButton}
                    onClick={() => setIsOpen(true)}
                >
                    <FaFilter style={{ marginRight: 8 }} />
                    Filter Produk
                </button>

                <div className={styles.layout}>
                    <aside className={styles.sidebar}>
                        {cloneElement(sidebarSlot as ReactElement<any>, { isOpen, setIsOpen })}
                    </aside>
                    <div className={styles.mainContent}>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
