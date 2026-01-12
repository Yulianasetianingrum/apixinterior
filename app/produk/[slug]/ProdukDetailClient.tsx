"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import styles from "./produk-detail.module.css";

type Props = {
  productId: number;
  productName: string;
  productSlug: string;
  compact?: boolean; // untuk CTA bar mobile
};

function buildWaLink(waNumber: string, text: string) {
  const clean = waNumber.replace(/[^\d]/g, "");
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${clean}?text=${encoded}`;
}

export default function ProdukDetailClient({
  productId,
  productName,
  productSlug,
  compact = false,
}: Props) {
  // Set di .env: NEXT_PUBLIC_WA_NUMBER=62812xxxxxxx
  const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER || "";

  // Pastikan ikon ini ada di: public/uploads/WA_gold.png
  const waIcon = "/uploads/WA_gold.png";

  const waText = useMemo(() => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    return `Halo, saya mau pesan produk: ${productName}\nSlug: ${productSlug}\nLink: ${url}`;
  }, [productName, productSlug]);

  // tracking view 1x per session/tab
  useEffect(() => {
    const key = `viewed_product_${productId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}

    fetch("/api/track/produk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, event: "view" }),
    }).catch(() => {});
  }, [productId]);

  const onPesanSekarang = () => {
    fetch("/api/track/produk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, event: "cta_click" }),
    }).catch(() => {});

    if (!waNumber) {
      alert("Nomor WhatsApp belum diset. Isi NEXT_PUBLIC_WA_NUMBER di .env");
      return;
    }

    window.open(buildWaLink(waNumber, waText), "_blank");
  };

  return (
    <div className={compact ? styles.ctaRowCompact : styles.ctaRow}>
      <button
        onClick={onPesanSekarang}
        className={compact ? styles.waBtnCompact : styles.waBtn}
      >
        <span className={styles.waIcon}>
          <Image src={waIcon} alt="WhatsApp" width={20} height={20} />
        </span>
        <span>Pesan Sekarang</span>
      </button>
    </div>
  );
}
