"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import layoutStyles from "../../admin_dashboard.module.css";
import styles from "./hubungi.module.css";

type HubungiItem = {
  id: number;
  nomor: string;
  prioritas: boolean;
};

// =======================================
// Helper input
// =======================================
function cleanForDisplay(value: string) {
  return value.replace(/[^\d]/g, "");
}

function normalizeWaNumber(value: string) {
  let digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  if (!digits.startsWith("62")) digits = "62" + digits;
  return digits;
}

function formatForDisplay(value: string) {
  if (!value) return "";
  if (value.startsWith("62")) return "+62 " + value.slice(2);
  return value;
}

export default function HubungiPage() {
  const router = useRouter();

  // state sidebar & tema — SAMA KAYA KOLASE FOTO
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // state data nomor WA
  const [items, setItems] = useState<HubungiItem[]>([]);
  const [inputNumber, setInputNumber] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const max = 5;

  // ================== DATA API ==================
  async function loadData() {
    try {
      const res = await fetch(
        "/api/admin/admin_dashboard/admin_pengaturan/hubungi",
        { method: "GET" }
      );
      const json = await res.json();
      if (res.ok) {
        setItems(json.items ?? []);
      } else {
        alert(json.message ?? "Gagal memuat data");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal memuat data");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ================== HANDLER ==================
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputNumber(cleanForDisplay(e.target.value));
  };

  const handleSave = async () => {
    if (!inputNumber) {
      alert("Nomor WA tidak boleh kosong");
      return;
    }

    setLoading(true);
    try {
      const normalized = normalizeWaNumber(inputNumber);
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(
        "/api/admin/admin_dashboard/admin_pengaturan/hubungi",
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            editingId
              ? { id: editingId, waNumber: normalized }
              : { waNumber: normalized }
          ),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        alert(data.message ?? "Gagal menyimpan nomor");
      } else {
        setInputNumber("");
        setEditingId(null);
        await loadData();
        alert(editingId ? "Nomor berhasil diupdate" : "Nomor berhasil ditambahkan");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: HubungiItem) => {
    setEditingId(item.id);
    setInputNumber(cleanForDisplay(item.nomor));
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus nomor ini?")) return;

    setLoading(true);
    try {
      const res = await fetch(
        "/api/admin/admin_dashboard/admin_pengaturan/hubungi",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.message ?? "Gagal menghapus nomor");
      } else {
        if (editingId === id) {
          setEditingId(null);
          setInputNumber("");
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
        "/api/admin/admin_dashboard/admin_pengaturan/hubungi",
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

  const handleBack = () => {
    router.push("/admin/admin_dashboard");
    setSidebarOpen(false);
  };

  const isFull = items.length >= max;

  // ================== UI ==================
  return (
    <div className={layoutStyles.dashboard}>
      {/* TOP BAR HP/TABLET */}
      <div className={layoutStyles.mobileTopBar}>
        <button
          type="button"
          className={layoutStyles.mobileMenuButton}
          onClick={() => setSidebarOpen(true)}
        >
          =
        </button>
        <div className={layoutStyles.mobileTitle}></div>
        <div
          className={`${styles.topRightBrand} ${darkMode ? styles.topRightBrandNight : ""
            }`}
        >
          APIX INTERIOR
        </div>
      </div>

      {/* OVERLAY HP/TABLET */}
      {sidebarOpen && (
        <div
          className={layoutStyles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR SAMA PERSIS SEPERTI KOLASE_FOTO, CUMA MENU DIGANTI */}
      <aside
        className={`${layoutStyles.sidebar} ${sidebarOpen ? layoutStyles.sidebarOpen : ""
          }`}
      >
        <div className={layoutStyles.sidebarHeader}>
          <div className={layoutStyles.brand}>
            <div className={layoutStyles.brandLogo}>A</div>
            <div className={layoutStyles.brandText}>
              <span className={layoutStyles.brandTitle}>APIX INTERIOR</span>
              <span className={layoutStyles.brandSubtitle}>
                Admin Dashboard
              </span>
            </div>
          </div>

          {/* tombol X (HP/TABLET) */}
          <button
            type="button"
            className={styles.closeSidebarButton}
            onClick={() => setSidebarOpen(false)}
          >
            ×
          </button>
        </div>

        {/* MENU ADMIN_PENGATURAN */}
        <div className={layoutStyles.menu}>
          <button
            type="button"
            className={`${layoutStyles.menuItem} ${layoutStyles.menuItemActive}`}
            onClick={() =>
              router.push("/admin/admin_dashboard/admin_pengaturan/hubungi")
            }
          >
            Hubungi
          </button>
          <button
            type="button"
            className={layoutStyles.menuItem}
            onClick={() =>
              router.push("/admin/admin_dashboard/admin_pengaturan/informasi")
            }
          >
            Informasi
          </button>
          <button
            type="button"
            className={layoutStyles.menuItem}
            onClick={() =>
              router.push(
                "/admin/admin_dashboard/admin_pengaturan/media_sosial"
              )
            }
          >
            Media Sosial
          </button>
          <button
            type="button"
            className={layoutStyles.menuItem}
            onClick={() =>
              router.push("/admin/admin_dashboard/admin_pengaturan/toko")
            }
          >
            Atur Toko
          </button>
          <button
            type="button"
            className={layoutStyles.menuItem}
            onClick={() =>
              router.push("/admin/admin_dashboard/admin_pengaturan/faq")
            }
          >
            Menu FAQ & DLL
          </button>
        </div>

        {/* SWITCH MODE (SAMA) */}
        <div className={layoutStyles.themeSwitchWrapper}>
          <span className={layoutStyles.themeLabel}>
            Mode tombol: {darkMode ? "Malam" : "Siang"}
          </span>
          <button
            type="button"
            className={`${layoutStyles.themeSwitch} ${darkMode ? layoutStyles.themeSwitchOn : ""
              }`}
            onClick={() => setDarkMode((prev) => !prev)}
          >
            <div className={layoutStyles.themeThumb} />
          </button>
        </div>

        {/* TOMBOL KEMBALI */}
        <div className={styles.sidebarBackWrapper}>
          <button
            type="button"
            className={styles.sidebarBackButton}
            onClick={handleBack}
          >
            KEMBALI
          </button>
        </div>

        <div className={layoutStyles.sidebarFooter} />
      </aside>

      {/* MAIN CONTENT */}
      <main
        className={`${layoutStyles.main} ${darkMode ? styles.mainNight : styles.mainDay
          }`}
      >
        {/* Brand kanan atas desktop */}
        <div className={styles.desktopTopBar}>
          <span
            className={`${styles.desktopBrand} ${darkMode ? styles.desktopBrandNight : ""
              }`}
          >
            APIX INTERIOR
          </span>
        </div>

        <header className={layoutStyles.mainHeader}>
          <h1
            className={`${layoutStyles.pageTitle} ${styles.pageTitleOutside}`}
          >
            Pengaturan Nomor WhatsApp
          </h1>
          <p
            className={`${layoutStyles.pageSubtitle} ${styles.pageSubtitleOutside}`}
          >
            Kelola hingga 5 nomor WhatsApp, pilih salah satu sebagai nomor
            prioritas untuk redirect di website utama.
          </p>
        </header>

        {/* CARD KUNING BESAR (PERSIS STYLE KOLOSE) */}
        <div
          className={`${styles.cardArea} ${darkMode ? styles.cardAreaNight : styles.cardAreaDay
            }`}
        >
          <div className={styles.cardWrapper}>
            <div
              className={`${layoutStyles.card} ${styles.card} ${darkMode ? styles.cardNight : styles.cardDay
                } ${styles.noCardHover}`}
            >
              <div className={styles.settingsInner}>
                {/* FORM INPUT */}
                <div className={styles.formRow}>
                  <input
                    type="text"
                    placeholder="0821xxxxx / +62821xxxxx"
                    value={inputNumber}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={loading || (!editingId && isFull)}
                  />
                  <button
                    type="button"
                    className={styles.button}
                    onClick={handleSave}
                    disabled={loading || (!editingId && isFull)}
                  >
                    {editingId ? "Update" : "Tambah"}
                  </button>
                </div>

                <p className={styles.infoText}>
                  Nomor boleh diawali 0 atau +62 dan boleh ditempel langsung
                  dari WhatsApp. Tanda hubung, spasi, dll akan otomatis
                  dibersihkan. Maksimal {max} nomor (saat ini {items.length}/
                  {max}).
                </p>

                {editingId && (
                  <p className={styles.editingInfo}>
                    Sedang mengedit nomor dengan ID: {editingId}
                  </p>
                )}

                {/* LIST NOMOR */}
                <div className={styles.listWrapper}>
                  <h2 className={styles.listTitle}>Daftar Nomor WhatsApp</h2>
                  {items.length === 0 && (
                    <p className={styles.statusText}>
                      Belum ada nomor yang disimpan.
                    </p>
                  )}
                  <ul className={styles.list}>
                    {items.map((item) => (
                      <li key={item.id} className={styles.listItem}>
                        <div className={styles.listMain}>
                          <span className={styles.listNumber}>
                            {formatForDisplay(item.nomor)}
                          </span>
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
                              name="prioritasWa"
                              checked={item.prioritas}
                              onChange={() => handleSetPriority(item.id)}
                            />
                            Jadikan prioritas
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
      </main>
    </div>
  );
}
