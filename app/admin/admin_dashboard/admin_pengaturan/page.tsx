"use client";

import { useRouter } from "next/navigation";
import styles from "../admin_dashboard.module.css";

const pengaturanSubMenus = [
  {
    key: "info",
    title: "Informasi",
    description: "Atur informasi utama perusahaan di website.",
    href: "/admin/admin_dashboard/admin_pengaturan/informasi",
  },
  {
    key: "sosmed",
    title: "Media sosial",
    description: "Kelola link dan akun media sosial.",
    href: "/admin/admin_dashboard/admin_pengaturan/media_sosial",
  },
  {
    key: "hubungi",
    title: "Hubungi",
    description: "Atur informasi kontak & form hubungi.",
    href: "/admin/admin_dashboard/admin_pengaturan/hubungi",
  },
  {
    key: "toko",
    title: "Atur Toko",
    description: "Kelola website utama.",
    href: "/admin/admin_dashboard/admin_pengaturan/toko",
  },
  {
    key: "faq",
    title: "Menu FAQ & DLL",
    description: "Kelola pertanyaan umum dan menu tambahan.",
    href: "/admin/admin_dashboard/admin_pengaturan/faq",
  },
];

export default function AdminPengaturanPage() {
  const router = useRouter();

  const goToSubMenu = (href: string) => {
    router.push(href);
  };

  return (
    <>
      <div className={styles.mainHeader}>
        <h2 className={styles.pageTitle}>Pengaturan</h2>
        <p className={styles.pageSubtitle}>
          Atur informasi dan konfigurasi utama situs.
        </p>
      </div>

      <section className={styles.cardsGrid} aria-label="Submenu pengaturan">
        {pengaturanSubMenus.map((item) => (
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
