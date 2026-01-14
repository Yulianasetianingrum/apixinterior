'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import layoutStyles from '../../admin_dashboard.module.css';
import styles from './kolase_foto.module.css';

type Gambar = {
  id: number;
  url: string;
  title: string | null;
  tags: string;
  createdAt: string;
  category?: { id: number; name: string } | null;
  subcategory?: { id: number; name: string; categoryId: number } | null;
};

export default function KolaseFotoPage() {
  const router = useRouter();

  const [data, setData] = useState<Gambar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [droppingAll, setDroppingAll] = useState(false);
  const [deletingOne, setDeletingOne] = useState(false);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmKind, setConfirmKind] = useState<'deleteOne' | 'dropAll' | 'deleteSelected' | null>(null);
  const [confirmTargetId, setConfirmTargetId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [previewItem, setPreviewItem] = useState<Gambar | null>(null);
  const [previewMeta, setPreviewMeta] = useState<{
    loading: boolean;
    width?: number;
    height?: number;
    bytes?: number;
    error?: string;
  }>({ loading: false });


  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  async function loadData() {
    setLoading(true);
    const res = await fetch(
      '/api/admin/admin_dashboard/admin_galeri/list_gambar'
    );
    const json = await res.json();
    setData(json.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function doDeleteOne(id: number) {
    const res = await fetch(
      '/api/admin/admin_dashboard/admin_galeri/delete_gambar',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? 'Gagal menghapus');
      return;
    }

    setData((prev) => prev.filter((g) => g.id !== id));
  }

  function requestDeleteOne(id: number) {
    setConfirmKind('deleteOne');
    setConfirmTargetId(id);
    setConfirmTitle('Hapus gambar?');
    setConfirmMessage('Yakin hapus gambar ini?');
    setConfirmOpen(true);
  }

  function requestDeleteSelected() {
    if (selectedIds.length === 0) {
      alert('Pilih gambar terlebih dahulu.');
      return;
    }
    setConfirmKind('deleteSelected');
    setConfirmTitle(`Hapus ${selectedIds.length} gambar?`);
    setConfirmMessage('Gambar terpilih akan dihapus permanen.');
    setConfirmOpen(true);
  }

  function requestDropAll() {
    const count = data.length;
    if (count === 0) {
      alert('Belum ada gambar untuk dihapus.');
      return;
    }
    setConfirmKind('dropAll');
    setConfirmTargetId(null);
    setConfirmTitle(`Hapus semua gambar?`);
    setConfirmMessage(`Yakin hapus SEMUA gambar (${count})?\n\nIni akan menghapus semua foto di galeri.`);
    setConfirmOpen(true);
  }

  function closeConfirm() {
    if (droppingAll || deletingOne || deletingSelected) return;
    setConfirmOpen(false);
    setConfirmKind(null);
    setConfirmTargetId(null);
    setConfirmTitle('');
    setConfirmMessage('');
  }

  async function onConfirm() {
    if (confirmKind === 'deleteOne') {
      if (confirmTargetId == null) return;
      setDeletingOne(true);
      try {
        await doDeleteOne(confirmTargetId);
        setConfirmOpen(false);
      } finally {
        setDeletingOne(false);
      }
      return;
    }

    if (confirmKind === 'deleteSelected') {
      if (selectedIds.length === 0) return;
      setDeletingSelected(true);
      try {
        await doDeleteSelected(selectedIds);
        setConfirmOpen(false);
      } finally {
        setDeletingSelected(false);
      }
      return;
    }

    if (confirmKind === 'dropAll') {
      try {
        await doDropAll();
        setConfirmOpen(false);
      } finally {
        // droppingAll state di-handle oleh doDropAll
      }
      return;
    }
  }

  async function doDropAll() {
    if (droppingAll) return;

    const ids = data.map((g) => g.id);
    if (ids.length === 0) {
      alert('Belum ada gambar untuk dihapus.');
      return;
    }

    setDroppingAll(true);
    try {
      // Hapus satu-per-satu biar lebih aman (nggak nge-spam request barengan)
      for (const id of ids) {
        const res = await fetch(
          '/api/admin/admin_dashboard/admin_galeri/delete_gambar',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          alert(err?.error ?? `Gagal menghapus (id: ${id})`);
          // stop biar user tau ada yang gagal
          break;
        }
      }

      // Refresh list biar state bener-bener sinkron
      await loadData();
    } finally {
      setDroppingAll(false);
    }
  }

  async function doDeleteSelected(ids: number[]) {
    if (ids.length === 0) return;
    for (const id of ids) {
      const res = await fetch(
        '/api/admin/admin_dashboard/admin_galeri/delete_gambar',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(err?.error ?? `Gagal menghapus (id: ${id})`);
        break;
      }
    }
    setData((prev) => prev.filter((g) => !ids.includes(g.id)));
    setSelectedIds([]);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return data;
    return data.filter((g) => {
      const combined =
        [
          g.title ?? '',
          g.tags,
          g.category?.name ?? '',
          g.subcategory?.name ?? '',
        ]
          .join(' ')
          .toLowerCase() || '';
      return combined.includes(q);
    });
  }, [data, search]);

  function handleBack() {
    router.push('/admin/admin_dashboard/admin_galeri');
    setSidebarOpen(false);
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function isSelected(id: number) {
    return selectedIds.includes(id);
  }

  function formatBytes(num?: number) {
    if (!num || num <= 0) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    let n = num;
    let u = 0;
    while (n >= 1024 && u < units.length - 1) {
      n /= 1024;
      u++;
    }
    return `${n.toFixed(n >= 10 ? 0 : 1)} ${units[u]}`;
  }

  async function openPreview(g: Gambar) {
    setPreviewItem(g);
    setPreviewMeta({ loading: true });

    const loadDims = () =>
      new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () =>
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => reject(new Error('Gagal memuat gambar'));
        img.src = g.url;
      });

    const fetchSize = async () => {
      try {
        const res = await fetch(g.url, { method: 'HEAD' });
        const len = res.headers.get('content-length');
        return len ? Number(len) : undefined;
      } catch {
        return undefined;
      }
    };

    try {
      const [dims, bytes] = await Promise.all([loadDims(), fetchSize()]);
      setPreviewMeta({
        loading: false,
        width: dims.width,
        height: dims.height,
        bytes,
      });
    } catch (err: any) {
      setPreviewMeta({
        loading: false,
        error: err?.message || 'Gagal memuat info gambar',
      });
    }
  }

  function closePreview() {
    setPreviewItem(null);
    setPreviewMeta({ loading: false });
  }

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
          className={`${styles.topRightBrand} ${darkMode ? styles.topRightBrandNight : ''
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

      {/* SIDEBAR */}
      <aside
        className={`${layoutStyles.sidebar} ${sidebarOpen ? layoutStyles.sidebarOpen : ''
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

        {/* MENU */}
        <div className={layoutStyles.menu}>
          <button
            type="button"
            className={`${layoutStyles.menuItem} ${layoutStyles.menuItemActive}`}
            onClick={() =>
              router.push('/admin/admin_dashboard/admin_galeri/kolase_foto')
            }
          >
            Kolase Foto
          </button>
          <button
            type="button"
            className={layoutStyles.menuItem}
            onClick={() =>
              router.push('/admin/admin_dashboard/admin_galeri/upload_foto')
            }
          >
            Upload Foto
          </button>
        </div>

        {/* SWITCH MODE */}
        <div className={layoutStyles.themeSwitchWrapper}>
          <span className={layoutStyles.themeLabel}>
            Mode tombol: {darkMode ? 'Malam' : 'Siang'}
          </span>
          <button
            type="button"
            className={`${layoutStyles.themeSwitch} ${darkMode ? layoutStyles.themeSwitchOn : ''
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
            className={`${styles.desktopBrand} ${darkMode ? styles.desktopBrandNight : ''
              }`}
          >
            APIX INTERIOR
          </span>
        </div>

        <header className={layoutStyles.mainHeader}>
          <h1
            className={`${layoutStyles.pageTitle} ${styles.pageTitleOutside}`}
          >
            Kolase Gambar
          </h1>
          <p
            className={`${layoutStyles.pageSubtitle} ${styles.pageSubtitleOutside}`}
          >
            Lihat dan kelola semua foto yang sudah diupload ke galeri.
          </p>
        </header>

        {/* AREA CARD + GRID */}
        <div
          className={`${styles.cardArea} ${darkMode ? styles.cardAreaNight : styles.cardAreaDay
            }`}
        >
          <div className={styles.cardWrapper}>
            <div
              className={`${layoutStyles.card} ${styles.card} ${darkMode ? styles.cardNight : styles.cardDay
                } ${styles.noCardHover}`}
            >
              {/* Search bar */}
              <div className={styles.toolbar}>
                <input
                  type="text"
                  placeholder="Cari berdasarkan judul, tag, kategori..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={styles.searchInput}
                />
                <div className={styles.toolbarActions}>
                  <button
                    type="button"
                    className={`${styles.deleteBtn} ${darkMode ? styles.deleteBtnDark : styles.deleteBtnLight
                      }`}
                    onClick={requestDeleteSelected}
                    disabled={
                      loading || deletingSelected || selectedIds.length === 0
                    }
                    title="Hapus gambar terpilih"
                  >
                    {deletingSelected
                      ? 'Menghapus...'
                      : `Hapus terpilih (${selectedIds.length || 0})`}
                  </button>

                  <button
                    type="button"
                    className={`${styles.deleteBtn} ${darkMode ? styles.deleteBtnDark : styles.deleteBtnLight
                      }`}
                    onClick={requestDropAll}
                    disabled={loading || droppingAll || data.length === 0}
                    title="Hapus semua gambar"
                  >
                    {droppingAll ? 'Menghapus...' : 'DROP ALL'}
                  </button>
                </div>
              </div>

              {/* Status */}
              {loading && (
                <p className={styles.statusText}>Memuat data...</p>
              )}
              {!loading && filtered.length === 0 && (
                <p className={styles.statusText}>Belum ada gambar.</p>
              )}

              {/* Grid */}
              <div className={styles.galleryGrid}>
                {filtered.map((g) => (
                  <div
                    key={g.id}
                    className={`${styles.galleryCard} ${darkMode
                      ? styles.galleryCardNight
                      : styles.galleryCardDay
                      }`}
                  >
                    <div className={`${styles.galleryCheckbox} ${isSelected(g.id) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isSelected(g.id)}
                        onChange={() => toggleSelect(g.id)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </div>
                    <div className={styles.imageWrapper}>
                      <img
                        src={g.url}
                        alt={g.title ?? ''}
                        className={styles.galleryImage}
                        onClick={() => openPreview(g)}
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/400x300?text=No+Image";
                          e.currentTarget.onerror = null;
                        }}
                      />
                      {/* Metadata removed from grid for iPhone look */}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CONFIRM MODAL (custom - bisa di-style) */}
        {confirmOpen && (
          <div className={styles.modalOverlay} onClick={closeConfirm}>
            <div
              className={`${styles.modalCard} ${darkMode ? styles.modalCardNight : styles.modalCardDay
                }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>{confirmTitle}</div>
              <div className={styles.modalBody}>{confirmMessage}</div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={`${styles.modalBtn} ${darkMode ? styles.modalBtnSecondaryNight : styles.modalBtnSecondaryDay
                    } ${droppingAll || deletingOne ? styles.modalBtnDisabled : ''}`}
                  onClick={closeConfirm}
                  disabled={droppingAll || deletingOne}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className={`${styles.modalBtn} ${darkMode ? styles.modalBtnDangerNight : styles.modalBtnDangerDay
                    } ${droppingAll || deletingOne || deletingSelected ? styles.modalBtnDisabled : ''}`}
                  onClick={onConfirm}
                  disabled={droppingAll || deletingOne || deletingSelected}
                >
                  {droppingAll || deletingOne || deletingSelected ? 'Menghapus...' : 'OK'}
                </button>
              </div>
            </div>
          </div>
        )}

        {previewItem && (
          <div className={styles.modalOverlay} onClick={closePreview}>
            <div
              className={`${styles.modalCard} ${darkMode ? styles.modalCardNight : styles.modalCardDay
                }`}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: 'min(820px, 96vw)',
                width: '100%',
                maxHeight: '92vh',
                overflowY: 'auto',
              }}
            >
              <div className={styles.modalHeader}>
                {previewItem.title || 'Preview Gambar'}
              </div>
              <div className={styles.previewLayout}>
                <div className={styles.previewImageBox}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewItem.url}
                    alt={previewItem.title ?? ''}
                    className={styles.previewImage}
                  />
                </div>
                <div className={styles.previewInfo}>
                  <div><b>ID:</b> {previewItem.id}</div>
                  <div><b>Tags:</b> {previewItem.tags || '-'}</div>
                  {previewItem.category && (
                    <div>
                      <b>Kategori:</b> {previewItem.category.name}
                      {previewItem.subcategory
                        ? ` / ${previewItem.subcategory.name}`
                        : ''}
                    </div>
                  )}
                  {previewMeta.loading ? (
                    <div>Memuat info...</div>
                  ) : previewMeta.error ? (
                    <div style={{ color: '#e11d48' }}>{previewMeta.error}</div>
                  ) : (
                    <>
                      <div>
                        <b>Dimensi:</b>{' '}
                        {previewMeta.width && previewMeta.height
                          ? `${previewMeta.width} x ${previewMeta.height}px`
                          : '-'}
                      </div>
                      <div>
                        <b>Ukuran file:</b> {formatBytes(previewMeta.bytes)}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={`${styles.modalBtn} ${darkMode ? styles.modalBtnSecondaryNight : styles.modalBtnSecondaryDay
                    }`}
                  onClick={closePreview}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
