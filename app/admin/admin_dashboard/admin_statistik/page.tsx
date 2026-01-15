"use client";

import { useRouter } from "next/navigation";
import styles from "../admin_dashboard.module.css";

const statistikSubMenus = [
  {
    key: "pengunjung",
    title: "Total pengunjung",
    description: "Lihat total pengunjung website (bisa sambung analytics).",
    href: "/admin/admin_dashboard/admin_statistik/total_pengunjung",
  },
  {
    key: "topItem",
    title: "Top item",
    description:
      'Barang yang paling sering diklik "hubungi sekarang".',
    href: "/admin/admin_dashboard/admin_statistik/top_item",
  },
];

export default function AdminStatistikPage() {
  const router = useRouter();

  const goToSubMenu = (href: string) => {
    router.push(href);
  };

  return (
    <>
      <div className={styles.mainHeader}>
        <h2 className={styles.pageTitle}>Statistik</h2>
        <p className={styles.pageSubtitle}>
          Lihat ringkasan performa dan data pengunjung.
        </p>
      </div>

      <section className={styles.cardsGrid} aria-label="Submenu statistik">
        {statistikSubMenus.map((item) => (
          <article key={item.key} className={styles.card}>
            <h3 className={styles.cardTitle}>{item.title}</h3>
            <button
              className={styles.cardLink}
              onClick={() => goToSubMenu(item.href)}
            >
              {item.description}
            </button>
          </article>
        ))}
      </section>
    </>
  );
}
