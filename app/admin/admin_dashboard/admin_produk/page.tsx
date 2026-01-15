"use client";

import { useRouter } from "next/navigation";
// pakai CSS yang sama dengan dashboard
import styles from "../admin_dashboard.module.css";

const produkSubMenus = [
  {
    key: "tambah",
    title: "Tambah produk",
    description: "Buat produk baru dan atur detailnya.",
    href: "/admin/admin_dashboard/admin_produk/tambah_produk",
  },
  {
    key: "daftar",
    title: "Daftar produk",
    description: "Lihat dan kelola semua produk yang sudah dibuat.",
    href: "/admin/admin_dashboard/admin_produk/daftar_produk",
  },
  {
    key: "kategori",
    title: "Kategori produk",
    description: "Kelola kategori dan pengelompokkan produk.",
    href: "/admin/admin_dashboard/admin_produk/kategori_produk",
  },
];

export default function AdminProdukPage() {
  const router = useRouter();

  const goToSubMenu = (href: string) => {
    router.push(href);
  };

  return (
    <>
      <div className={styles.mainHeader}>
        <h2 className={styles.pageTitle}>Produk</h2>
        <p className={styles.pageSubtitle}>
          Pilih salah satu submenu di bawah untuk mengelola produk.
        </p>
      </div>

      {/* CARD-CARD SUBMENU PRODUK */}
      <section className={styles.cardsGrid} aria-label="Submenu produk">
        {produkSubMenus.map((item) => (
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
