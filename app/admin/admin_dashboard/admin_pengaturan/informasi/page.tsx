"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import layoutStyles from "../../admin_dashboard.module.css";
import styles from "./informasi.module.css";
import { useAdminTheme } from "../../AdminThemeContext";


type InformasiToko = {
  id: number;
  namaToko: string;
  deskripsi: string;
  logoUrl: string | null;
};

type CabangToko = {
  id: number;
  namaCabang: string;
  mapsUrl: string;
  urutan: number | null;
};

const normalizeMapsUrl = (raw: string, fallbackName?: string) => {
  const input = String(raw || "").trim();
  if (!input) return "";
  const cleaned = input.replace(/,+\s*$/g, "");
  if (cleaned.includes("<iframe")) {
    const match = cleaned.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) return match[1].trim();
  }

  try {
    const u = new URL(cleaned);
    const host = u.host.toLowerCase();
    const isGoogle = host.includes("google.") || host.includes("maps.");
    const isEmbedPath = u.pathname.includes("/maps/embed");
    const pb = u.searchParams.get("pb");
    const output = u.searchParams.get("output");

    if (isEmbedPath && pb && pb.length > 20) return cleaned;
    if (isEmbedPath && output === "embed") return cleaned;
    if (output === "embed") return cleaned;

    if (isGoogle) {
      const q =
        u.searchParams.get("q") ||
        u.searchParams.get("query") ||
        u.searchParams.get("search") ||
        "";
      const query = q || fallbackName || "";
      if (!query) return cleaned;
      return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    }
  } catch {
    // ignore invalid URLs
  }

  return cleaned;
};

export default function InformasiPage() {
  const router = useRouter();

  const { isDarkMode } = useAdminTheme();
  // removed local sidebar/darkmode
  // Informasi toko
  const [info, setInfo] = useState<InformasiToko | null>(null);
  const [namaToko, setNamaToko] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [savingInfo, setSavingInfo] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Cabang
  const [cabangList, setCabangList] = useState<CabangToko[]>([]);
  const [cabangNama, setCabangNama] = useState("");
  const [cabangMaps, setCabangMaps] = useState("");
  const [cabangUrutan, setCabangUrutan] = useState("");
  const [editingCabangId, setEditingCabangId] = useState<number | null>(null);
  const [savingCabang, setSavingCabang] = useState(false);

  // ===== LOAD DATA =====
  const loadInformasi = async () => {
    try {
      const res = await fetch(
        "/api/admin/admin_dashboard/admin_pengaturan/informasi"
      );
      const data = await res.json();
      if (res.ok && data.info) {
        setInfo(data.info);
        setNamaToko(data.info.namaToko);
        setDeskripsi(data.info.deskripsi);
        setLogoUrl(data.info.logoUrl);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadCabang = async () => {
    try {
      const res = await fetch(
        "/api/admin/admin_dashboard/admin_pengaturan/informasi/cabang"
      );
      const data = await res.json();
      if (res.ok) {
        setCabangList(data.cabang ?? []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInformasi();
    loadCabang();
  }, []);

  // ===== HANDLER INFORMASI TOKO =====
  const handleLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        "/api/admin/admin_dashboard/admin_pengaturan/informasi/logo",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.message ?? "Gagal upload logo");
      } else {
        setLogoUrl(data.url);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat upload logo");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleSaveInformasi = async () => {
    if (!namaToko || !deskripsi) {
      alert("Nama toko dan deskripsi wajib diisi");
      return;
    }

    setSavingInfo(true);
    try {
      const res = await fetch(
        "/api/admin/admin_dashboard/admin_pengaturan/informasi",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            namaToko,
            deskripsi,
            logoUrl, // pakai state logoUrl sekarang
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.message ?? "Gagal menyimpan informasi");
      } else {
        setInfo(data.info);
        alert("Informasi toko berhasil disimpan");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    } finally {
      setSavingInfo(false);
    }
  };


  // HAPUS LOGO (hanya set logoUrl = null, info tetap ada)
  const handleClearLogo = async () => {
    if (!namaToko || !deskripsi) {
      alert("Isi nama toko dan deskripsi dulu sebelum hapus logo.");
      return;
    }
    if (!confirm("Yakin ingin menghapus logo toko?")) return;

    setSavingInfo(true);
    try {
      const res = await fetch(
        "/api/admin/admin_dashboard/admin_pengaturan/informasi",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            namaToko,
            deskripsi,
            logoUrl: "", // kirim string kosong -> di API jadi null
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.message ?? "Gagal menghapus logo");
      } else {
        setLogoUrl(null); // langsung kosong di UI
        setInfo(data.info);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    } finally {
      setSavingInfo(false);
    }
  };


  // HAPUS INFORMASI TOKO (nama, deskripsi, logo)
  const handleDeleteInformasi = async () => {
    if (
      !confirm(
        "Yakin ingin menghapus semua informasi toko? Nama, deskripsi, dan logo akan dikosongkan."
      )
    )
      return;

    setSavingInfo(true);
    try {
      const res = await fetch(
        "/api/admin/admin_dashboard/admin_pengaturan/informasi",
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.message ?? "Gagal menghapus informasi");
      } else {
        setInfo(null);
        setNamaToko("");
        setDeskripsi("");
        setLogoUrl(null);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    } finally {
      setSavingInfo(false);
    }
  };



  // ===== HANDLER CABANG =====
  const resetCabangForm = () => {
    setCabangNama("");
    setCabangMaps("");
    setCabangUrutan("");
    setEditingCabangId(null);
  };

  const handleSaveCabang = async () => {
    if (!cabangNama || !cabangMaps) {
      alert("Nama cabang dan link Maps wajib diisi");
      return;
    }

    setSavingCabang(true);
    try {
      const normalizedMaps = normalizeMapsUrl(cabangMaps, cabangNama);
      const method = editingCabangId ? "PUT" : "POST";
      const body = editingCabangId
        ? {
          id: editingCabangId,
          namaCabang: cabangNama,
          mapsUrl: normalizedMaps,
          urutan: cabangUrutan ? Number(cabangUrutan) : null,
        }
        : {
          namaCabang: cabangNama,
          mapsUrl: normalizedMaps,
          urutan: cabangUrutan ? Number(cabangUrutan) : null,
        };

      const res = await fetch(
        "/api/admin/admin_dashboard/admin_pengaturan/informasi/cabang",
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.message ?? "Gagal menyimpan cabang");
      } else {
        await loadCabang();
        resetCabangForm();
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    } finally {
      setSavingCabang(false);
    }
  };

  const handleEditCabang = (item: CabangToko) => {
    setEditingCabangId(item.id);
    setCabangNama(item.namaCabang);
    setCabangMaps(item.mapsUrl);
    setCabangUrutan(item.urutan?.toString() ?? "");
  };

  const handleDeleteCabang = async (id: number) => {
    if (!confirm("Yakin ingin menghapus cabang ini?")) return;

    setSavingCabang(true);
    try {
      const res = await fetch(
        "/api/admin/admin_dashboard/admin_pengaturan/informasi/cabang",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.message ?? "Gagal menghapus cabang");
      } else {
        await loadCabang();
        if (editingCabangId === id) {
          resetCabangForm();
        }
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    } finally {
      setSavingCabang(false);
    }
  };

  // ===== SIDE BAR =====
  const handleBack = () => {
    router.push("/admin/admin_dashboard/admin_pengaturan");
  };

  // ===== UI =====
  return (
    <div className={isDarkMode ? styles.mainNight : styles.mainDay} style={{ minHeight: "100%", width: "100%" }}>
      <header className={layoutStyles.mainHeader}>
        <h1
          className={`${layoutStyles.pageTitle} ${styles.pageTitleOutside}`}
        >
          <button
            type="button"
            className={styles.infoDeleteButton}
            onClick={handleDeleteInformasi}
            disabled={savingInfo}
          >
            Hapus Informasi
          </button>
        </h1>
      </header>

      {/* INFORMASI TOKO */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Informasi Toko</h2>
        <div className={styles.formGroup}>
          <label className={styles.label}>Nama Toko</label>
          <input
            type="text"
            className={styles.textInput}
            value={namaToko}
            onChange={(e) => setNamaToko(e.target.value)}
            placeholder="Nama Toko Anda"
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Deskripsi Toko</label>
          <textarea
            className={styles.textArea}
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Deskripsi singkat tentang toko Anda"
            rows={4}
          ></textarea>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Logo Toko</label>
          <div className={styles.logoUploadContainer}>
            {logoUrl && (
              <div className={styles.logoPreviewWrapper}>
                <img src={logoUrl} alt="Logo Toko" className={styles.logoPreview} />
                <button
                  type="button"
                  className={styles.clearLogoButton}
                  onClick={handleClearLogo}
                  disabled={savingInfo}
                >
                  Hapus Logo
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              disabled={uploadingLogo}
              className={styles.fileInput}
            />
            {uploadingLogo && <p>Uploading...</p>}
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSaveInformasi}
            disabled={savingInfo}
          >
            {savingInfo ? "Menyimpan..." : "Simpan Informasi"}
          </button>
        </div>
      </section>


      {/* CABANG & MAPS */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cabang & Lokasi Maps</h2>

        <div className={styles.branchFormRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Nama Cabang</label>
            <input
              type="text"
              className={styles.textInput}
              value={cabangNama}
              onChange={(e) => setCabangNama(e.target.value)}
              placeholder="Contoh: Cabang 1 - Surabaya"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Link Google Maps</label>
            <input
              type="text"
              className={styles.textInput}
              value={cabangMaps}
              onChange={(e) => setCabangMaps(e.target.value)}
              placeholder="Paste link Google Maps di sini"
            />
          </div>
          <div className={styles.fieldGroupSmall}>
            <label className={styles.label}>Urutan</label>
            <input
              type="number"
              className={styles.textInput}
              value={cabangUrutan}
              onChange={(e) => setCabangUrutan(e.target.value)}
              placeholder="1"
            />
          </div>
          <button
            type="button"
            className={styles.branchButton}
            onClick={handleSaveCabang}
            disabled={savingCabang}
          >
            {editingCabangId ? "Update" : "Tambah"}
          </button>
        </div>

        {
          editingCabangId && (
            <p className={styles.editingInfo}>
              Sedang mengedit cabang ID: {editingCabangId}
            </p>
          )
        }

        <div className={styles.branchListWrapper}>
          <h3 className={styles.branchListTitle}>Daftar Cabang</h3>
          {cabangList.length === 0 && (
            <p className={styles.statusText}>
              Belum ada cabang yang ditambahkan.
            </p>
          )}
          <ul className={styles.branchList}>
            {cabangList.map((cabang) => (
              <li key={cabang.id} className={styles.branchItem}>
                <div className={styles.branchMain}>
                  <div className={styles.branchBadge}>
                    {cabang.urutan ?? "-"}
                  </div>
                  <div className={styles.branchText}>
                    <span className={styles.branchName}>
                      {cabang.namaCabang}
                    </span>
                    <a
                      href={cabang.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.branchMaps}
                    >
                      Lihat di Maps
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className={styles.submitWrapper} style={{ marginTop: '20px' }}>
        <button
          type="button"
          className={styles.sidebarBackButton}
          onClick={handleBack}
          style={{ color: isDarkMode ? '#f5c542' : '#0b1531', borderColor: isDarkMode ? '#f5c542' : '#0b1531', padding: '8px 24px' }}
        >
          KEMBALI KE PENGATURAN
        </button>
      </div>
    </div>
  );
}
