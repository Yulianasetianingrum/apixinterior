"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import layoutStyles from "../../admin_dashboard.module.css";
import styles from "./media_sosial.module.css";
import { useAdminTheme } from "../../AdminThemeContext";

import type { IconType } from "react-icons";
import {
  SiInstagram,
  SiFacebook,
  SiWhatsapp,
  SiTiktok,
  SiYoutube,
  SiLinkedin,
  SiX, // <-- pengganti SiTwitter
} from "react-icons/si";

type MediaSosialItem = {
  id: number;
  nama: string;
  iconKey: string;
  url: string;
  prioritas: boolean;
};

type PlatformOption = {
  key: string;
  label: string;
  Icon: IconType;
};

// daftar platform bawaan
const PLATFORM_OPTIONS: PlatformOption[] = [
  { key: "instagram", label: "Instagram", Icon: SiInstagram },
  { key: "facebook", label: "Facebook", Icon: SiFacebook },
  { key: "whatsapp", label: "WhatsApp", Icon: SiWhatsapp },
  { key: "tiktok", label: "TikTok", Icon: SiTiktok },
  { key: "youtube", label: "YouTube", Icon: SiYoutube },
  { key: "linkedin", label: "LinkedIn", Icon: SiLinkedin },
  { key: "x", label: "Twitter / X", Icon: SiX }, // <-- pakai SiX
];

const iconMap: Record<string, IconType> = PLATFORM_OPTIONS.reduce(
  (acc, p) => {
    acc[p.key] = p.Icon;
    return acc;
  },
  {} as Record<string, IconType>
);

function IconFromKey({ iconKey }: { iconKey: string }) {
  const IconComp = iconMap[iconKey];
  if (!IconComp) return <span className={styles.iconFallback}>🔗</span>;
  return <IconComp className={styles.iconSvg} />;
}

export default function MediaSosialPage() {
  const router = useRouter();

  const { isDarkMode } = useAdminTheme();

  const [items, setItems] = useState<MediaSosialItem[]>([]);
  const [nama, setNama] = useState("");
  const [iconKey, setIconKey] = useState("");
  const [url, setUrl] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [showSuggestions, setShowSuggestions] = useState(false);

  // ====== LOAD DATA ======
  const loadData = async () => {
    try {
      const res = await fetch(
        "/api/admin/admin_dashboard/admin_pengaturan/media_sosial"
      );
      const data = await res.json();
      if (res.ok) {
        setItems(data.items ?? []);
      } else {
        alert(data.message ?? "Gagal memuat media sosial");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal memuat media sosial");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ====== HANDLER FORM ======
  const handleNamaChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNama(value);
    setShowSuggestions(true);
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSelectPlatform = (option: PlatformOption) => {
    setNama(option.label);
    setIconKey(option.key);
    setShowSuggestions(false);

    if (!url) {
      if (option.key === "instagram") setUrl("https://instagram.com/");
      else if (option.key === "whatsapp") setUrl("https://wa.me/");
      else if (option.key === "tiktok") setUrl("https://www.tiktok.com/");
      else if (option.key === "youtube") setUrl("https://www.youtube.com/");
      else if (option.key === "linkedin")
        setUrl("https://www.linkedin.com/");
      else if (option.key === "facebook") setUrl("https://www.facebook.com/");
      else if (option.key === "x") setUrl("https://twitter.com/");
    }
  };

  const handleSave = async () => {
    if (!nama || !iconKey || !url) {
      alert("Nama platform, icon, dan URL wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId
        ? { id: editingId, nama, iconKey, url }
        : { nama, iconKey, url };

      const res = await fetch(
        "/api/admin/admin_dashboard/admin_pengaturan/media_sosial",
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        alert(data.message ?? "Gagal menyimpan media sosial");
      } else {
        setNama("");
        setIconKey("");
        setUrl("");
        setEditingId(null);
        await loadData();
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: MediaSosialItem) => {
    setEditingId(item.id);
    setNama(item.nama);
    setIconKey(item.iconKey);
    setUrl(item.url);
    setShowSuggestions(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus media sosial ini?")) return;

    setLoading(true);
    try {
      const res = await fetch(
        "/api/admin/admin_dashboard/admin_pengaturan/media_sosial",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        alert(data.message ?? "Gagal menghapus media sosial");
      } else {
        if (editingId === id) {
          setEditingId(null);
          setNama("");
          setIconKey("");
          setUrl("");
        }
        await loadData();
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPriority = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        "/api/admin/admin_dashboard/admin_pengaturan/media_sosial",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.message ?? "Gagal mengubah prioritas");
      } else {
        await loadData();
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const filteredSuggestions = PLATFORM_OPTIONS.filter((p) =>
    p.label.toLowerCase().includes(nama.toLowerCase())
  );

  // ====== UI ======
  return (
    <div
      className={isDarkMode ? styles.mainNight : styles.mainDay}
      style={{ minHeight: "100%", width: "100%" }}
    >
      <header className={layoutStyles.mainHeader}>
        <h1
          className={`${layoutStyles.pageTitle} ${styles.pageTitleOutside}`}
        >
          Pengaturan Media Sosial
        </h1>
        <p
          className={`${layoutStyles.pageSubtitle} ${styles.pageSubtitleOutside}`}
        >
          Tambahkan dan atur akun media sosial yang akan tampil di website.
        </p>
      </header>

      <div
        className={`${styles.cardArea} ${isDarkMode ? styles.cardAreaNight : styles.cardAreaDay}`}
      >
        <div className={styles.cardWrapper}>
          <div
            className={`${layoutStyles.card} ${styles.card} ${isDarkMode ? styles.cardNight : styles.cardDay} ${styles.noCardHover}`}
          >
            <div className={styles.contentInner}>
              {/* FORM */}
              <div className={styles.formRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Platform</label>
                  <div className={styles.platformWrapper}>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Contoh: Instagram, TikTok, LinkedIn"
                      value={nama}
                      onChange={handleNamaChange}
                      onFocus={() => setShowSuggestions(true)}
                    />
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <ul className={styles.suggestionList}>
                        {filteredSuggestions.map((p) => (
                          <li
                            key={p.key}
                            className={styles.suggestionItem}
                            onClick={() => handleSelectPlatform(p)}
                          >
                            <p.Icon className={styles.suggestionIcon} />
                            <span>{p.label}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>URL</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="https://instagram.com/apix_interior"
                    value={url}
                    onChange={handleUrlChange}
                  />
                </div>

                <button
                  type="button"
                  className={styles.button}
                  onClick={handleSave}
                  disabled={loading}
                >
                  {editingId ? "Update" : "Tambah"}
                </button>
              </div>

              {editingId && (
                <p className={styles.editingInfo}>
                  Sedang mengedit media sosial ID: {editingId}
                </p>
              )}

              {/* LIST */}
              <div className={styles.listWrapper}>
                <h2 className={styles.listTitle}>Daftar Media Sosial</h2>
                {items.length === 0 && (
                  <p className={styles.statusText}>
                    Belum ada akun media sosial yang disimpan.
                  </p>
                )}

                <ul className={styles.list}>
                  {items.map((item) => (
                    <li key={item.id} className={styles.listItem}>
                      <div className={styles.listMain}>
                        <div className={styles.iconBubble}>
                          <IconFromKey iconKey={item.iconKey} />
                        </div>
                        <div className={styles.listText}>
                          <span className={styles.listName}>
                            {item.nama}
                          </span>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.listUrl}
                          >
                            {item.url}
                          </a>
                        </div>
                        {item.prioritas && (
                          <span className={styles.priorityBadge}>
                            Prioritas
                          </span>
                        )}
                      </div>

                      <div className={styles.listActions}>
                        <label className={styles.priorityToggle}>
                          <input
                            type="radio"
                            name="prioritasSocial"
                            checked={item.prioritas}
                            onChange={() => handleSetPriority(item.id)}
                          />
                          Prioritas
                        </label>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => handleEdit(item)}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.dangerButton}
                          onClick={() => handleDelete(item.id)}
                          disabled={loading}
                        >
                          Hapus
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
