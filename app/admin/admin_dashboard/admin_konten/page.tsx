"use client";

import { useRouter } from "next/navigation";
import styles from "../admin_dashboard.module.css";

export default function AdminKontenPage() {
    const router = useRouter();

    return (
        <>
            <div className={styles.mainHeader}>
                <h2 className={styles.pageTitle}>Konten</h2>
                <p className={styles.pageSubtitle}>Kelola postingan blog, artikel, dan konten lainnya.</p>
            </div>

            <section className={styles.cardsGrid}>
                <article className={styles.card}>
                    <h3 className={styles.cardTitle}>Postingan</h3>
                    <ul className={styles.cardList}>
                        <li>
                            <button className={styles.cardLink} onClick={() => router.push("/admin/admin_dashboard/admin_konten/postingan")}>
                                Daftar Postingan
                            </button>
                        </li>
                    </ul>
                </article>
            </section>
        </>
    );
}
