"use client";

import { useRouter } from "next/navigation";
import styles from "../admin_dashboard.module.css";

const galeriSubMenus = [
  {
    key: "upload",
    title: "Upload foto",
    description: "Tambah foto baru ke galeri APIX Interior.",
    href: "/admin/admin_dashboard/admin_galeri/upload_foto",
  },
  {
    key: "kolase",
    title: "Kolase foto",
    description: "Atur foto menjadi kolase menarik.",
    href: "/admin/admin_dashboard/admin_galeri/kolase_foto",
  },
];

export default function AdminGaleriPage() {
  const router = useRouter();

  const goToSubMenu = (href: string) => {
    router.push(href);
  };

  return (
    <>
      <div className={styles.mainHeader}>
        <h2 className={styles.pageTitle}>Galeri</h2>
        <p className={styles.pageSubtitle}>
          Kelola foto dan konten visual APIX Interior.
        </p>
      </div>

      <section className={styles.cardsGrid} aria-label="Submenu galeri">
        {galeriSubMenus.map((item) => (
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
