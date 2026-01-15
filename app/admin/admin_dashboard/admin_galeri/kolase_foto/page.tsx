
'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import layoutStyles from '../../admin_dashboard.module.css';
import styles from './kolase_foto.module.css';
import { useAdminTheme } from "../../AdminThemeContext";

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

  // Delete / Drop States
  const [droppingAll, setDroppingAll] = useState(false);
  const [deletingOne, setDeletingOne] = useState(false);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmKind, setConfirmKind] = useState<'deleteOne' | 'dropAll' | 'deleteSelected' | null>(null);
  const [confirmTargetId, setConfirmTargetId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Preview State
  const [previewItem, setPreviewItem] = useState<Gambar | null>(null);
  const [previewMeta, setPreviewMeta] = useState<{
    loading: boolean;
    width?: number;
    height?: number;
    bytes?: number;
    error?: string;
  }>({ loading: false });

  // Add / Edit States
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<Gambar | null>(null);

  // Form State (Shared for Add/Edit)
  const [formFiles, setFormFiles] = useState<FileList | null>(null); // For Add only
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formTagInput, setFormTagInput] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addOpen && formFiles && formFiles.length > 0 && fileInputRef.current) {
      const dt = new DataTransfer();
      // Calculate limit to avoid performance issues if someone drops 1000 files, though DataTransfer is fast.
      // Copy files from state to DataTransfer
      for (let i = 0; i < formFiles.length; i++) {
        dt.items.add(formFiles[i]);
      }
      fileInputRef.current.files = dt.files;
    }
  }, [addOpen, formFiles]); // Sync whenever modal opens or files change

  const { isDarkMode } = useAdminTheme();
  // sidebarOpen & darkMode local removed

  // Load Data
  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/admin_dashboard/admin_galeri/list_gambar');
      const json = await res.json();
      setData(json.data ?? []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // --- ACTIONS ---

  // Add Model Logic
  function openAddModal() {
    setFormFiles(null);
    setFormTitle('');
    setFormCategory('');
    setFormSubcategory('');
    setFormTags([]);
    setFormTagInput('');
    setAddOpen(true);
  }

  function handleAutoGenerate(file: File) {
    if (!file) return;
    let name = file.name.replace(/\.[^/.]+$/, "");
    name = name.replace(/[-_]/g, " ");
    name = name.replace(/\b\w/g, (l) => l.toUpperCase());
    setFormTitle(name);

    const lowerName = name.toLowerCase();

    // Simple heuristics
    if (lowerName.includes("kitchen")) setFormCategory("Kitchen");
    else if (lowerName.includes("kamar") || lowerName.includes("bed")) setFormCategory("Kamar Tidur");
    else if (lowerName.includes("ruang tamu") || lowerName.includes("living")) setFormCategory("Ruang Tamu");
    else if (lowerName.includes("kantor") || lowerName.includes("office")) setFormCategory("Kantor");

    if (lowerName.includes("lemari")) setFormSubcategory("Lemari Pakaian");
    else if (lowerName.includes("meja")) setFormSubcategory("Meja Kerja");
    else if (lowerName.includes("kabinet")) setFormSubcategory("Kabinet");

    const stopWords = ["dan", "yang", "di", "ke", "dari", "ini", "itu", "untuk", "with", "and"];
    const potentialTags = lowerName.split(" ").map(w => w.trim()).filter(w => w && w.length > 2 && !stopWords.includes(w));
    setFormTags(potentialTags.slice(0, 7));
  }

  async function doAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formFiles || formFiles.length === 0) {
      alert("Pilih minimal satu foto.");
      return;
    }
    setFormSubmitting(true);

    let uploadSuccessCount = 0;
    let uploadFailCount = 0;
    const failedFilenames: string[] = [];

    for (let i = 0; i < formFiles.length; i++) {
      const file = formFiles[i];

      const formData = new FormData();
      formData.append('foto', file);
      formData.append('title', formTitle);
      formData.append('tags', formTags.join(', '));
      formData.append('category', formCategory);
      formData.append('subcategory', formSubcategory);

      try {
        const res = await fetch('/api/admin/admin_dashboard/admin_galeri/upload_foto', {
          method: 'POST',
          body: formData
        });
        if (!res.ok) {
          console.error(`Failed to upload ${file.name}`);
          uploadFailCount++;
          failedFilenames.push(file.name);
        } else {
          uploadSuccessCount++;
        }
      } catch (err) {
        console.error(err);
        uploadFailCount++;
        failedFilenames.push(file.name);
      }
    }

    setFormSubmitting(false);
    setAddOpen(false);
    loadData(); // Refresh

    if (uploadFailCount > 0) {
      alert(`Selesai.\nBerhasil: ${uploadSuccessCount}\nGagal: ${uploadFailCount}\n\nFile yang gagal:\n${failedFilenames.join('\n')}`);
    } else {
      alert(`Berhasil mengupload ${uploadSuccessCount} foto.`);
    }
  }

  // Edit Modal Logic
  function openEditModal(g: Gambar) {
    setEditItem(g);
    setFormTitle(g.title || '');
    setFormCategory(g.category?.name || '');
    setFormSubcategory(g.subcategory?.name || '');
    setFormTags(g.tags ? g.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
    setFormTagInput('');
    setEditOpen(true);
  }

  async function doEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;
    setFormSubmitting(true);

    try {
      const res = await fetch('/api/admin/admin_dashboard/admin_galeri/update_gambar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editItem.id,
          title: formTitle,
          tags: formTags.join(', '),
          categoryName: formCategory,
          subcategoryName: formSubcategory
        })
      });
      if (!res.ok) throw new Error('Update gagal');

      setEditOpen(false);
      setEditItem(null);
      loadData();
    } catch (err) {
      alert("Gagal update gambar.");
      console.error(err);
    } finally {
      setFormSubmitting(false);
    }
  }

  // Tag helper
  function addTag(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const t = formTagInput.trim();
      if (t && !formTags.includes(t)) {
        setFormTags([...formTags, t]);
      }
      setFormTagInput('');
    }
  }
  function removeTag(t: string) {
    setFormTags(formTags.filter(x => x !== t));
  }


  // --- DELETE LOGIC (Existing) ---

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

  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Drag Handlers
  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = e.dataTransfer.files;

      // Filter images only (optional but good UX)
      // For now just taking them all, backend validates too.

      setFormFiles(files);
      setFormTitle('');
      setFormCategory('');
      setFormSubcategory('');
      setFormTags([]);
      setFormTagInput('');

      if (files.length === 1) {
        handleAutoGenerate(files[0]);
      } else {
        // Maybe auto-generate from first file? Or leave blank?
        // Reuse handleAutoGenerate logic partially or just title from first?
        // Let's just use first file to guess category/tags if multiple, 
        // but blank title.
        handleAutoGenerate(files[0]); // This sets title too, might want to clear title if >1
        if (files.length > 1) setFormTitle('');
      }

      setAddOpen(true);
      e.dataTransfer.clearData();
    }
  }

  return (
    <div
      style={{ width: '100%', minHeight: '80vh' }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* DRAG OVERLAY */}
      {isDragging && (
        <div className={styles.dragOverlay}>
          <div className={styles.dragOverlayIcon}>📂</div>
          <div>Lepaskan file di sini untuk upload</div>
        </div>
      )}

      <header className={layoutStyles.mainHeader}>
        <h1
          className={`${layoutStyles.pageTitle} ${styles.pageTitleOutside}`}
        >
          Kolase Gambar
        </h1>
        <p
          className={`${layoutStyles.pageSubtitle} ${styles.pageSubtitleOutside}`}
        >
          Lihat, kelola, tambah, dan edit foto galeri Anda.
        </p>
      </header>

      {/* AREA CARD + GRID */}
      <div
        className={`${styles.cardArea} ${isDarkMode ? styles.cardAreaNight : styles.cardAreaDay
          }`}
      >
        <div className={styles.cardWrapper}>
          <div
            className={`${layoutStyles.card} ${styles.card} ${isDarkMode ? styles.cardNight : styles.cardDay
              } ${styles.noCardHover}`}
          >
            {/* Search bar & Actions */}
            <div className={styles.toolbar}>
              <input
                type="text"
                placeholder="Cari berdasarkan judul, tag, kategori..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
              <div className={styles.toolbarActions}>

                {/* ADD BUTTON */}
                <button
                  type="button"
                  className={`${styles.deleteBtn} ${isDarkMode ? styles.actionBtnDark : styles.actionBtnLight}`} // reused styles
                  onClick={openAddModal}
                  title="Upload Foto Baru"
                  style={{ backgroundColor: '#2563eb', color: 'white', borderColor: '#2563eb' }}
                >
                  + Tambah Foto
                </button>

                <button
                  type="button"
                  className={`${styles.deleteBtn} ${isDarkMode ? styles.deleteBtnDark : styles.deleteBtnLight
                    }`}
                  onClick={requestDeleteSelected}
                  disabled={
                    loading || deletingSelected || selectedIds.length === 0
                  }
                  title="Hapus gambar terpilih"
                >
                  {deletingSelected
                    ? '...'
                    : `Hapus (${selectedIds.length})`}
                </button>

                <button
                  type="button"
                  className={`${styles.deleteBtn} ${isDarkMode ? styles.deleteBtnDark : styles.deleteBtnLight
                    }`}
                  onClick={requestDropAll}
                  disabled={loading || droppingAll || data.length === 0}
                  title="Hapus semua gambar"
                >
                  {droppingAll ? '...' : 'DROP ALL'}
                </button>
              </div>
            </div>

            {/* Status */}
            {loading && (
              <p className={styles.statusText}>Memuat data...</p>
            )}
            {!loading && filtered.length === 0 && (
              <p className={styles.statusText}>Belum ada gambar. Silakan upload foto.</p>
            )}

            {/* Grid */}
            <div className={styles.galleryGrid}>
              {filtered.map((g) => (
                <div
                  key={g.id}
                  className={`${styles.galleryCard} ${isDarkMode
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

                  {/* EDIT BUTTON (Overlay) */}
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(g); }}
                    style={{
                      position: 'absolute', top: 8, right: 8, zIndex: 10,
                      background: 'rgba(255,255,255,0.9)',
                      border: '1px solid #ccc', borderRadius: '4px',
                      cursor: 'pointer', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold'
                    }}
                    title="Edit Gambar"
                  >
                    EDIT
                  </button>

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
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- ADD MODAL --- */}
      {addOpen && (
        <div className={styles.modalOverlay} onClick={() => setAddOpen(false)}>
          <div
            className={`${styles.modalCard} ${darkMode ? styles.modalCardNight : styles.modalCardDay}`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px' }}
          >
            <div className={styles.modalHeader}>Tambah Foto Baru</div>
            <form onSubmit={doAddSubmit} className={styles.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <label className={styles.label}>
                Pilih File (Bisa Banyak)
                <input
                  ref={fileInputRef}
                  type="file" multiple accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      setFormFiles(e.target.files);
                      // Auto-generate helper if simple single upload, else user types manually
                      if (e.target.files.length === 1) handleAutoGenerate(e.target.files[0]);
                    }
                  }}
                  style={{ display: 'block', marginTop: 4 }}
                  required
                />
              </label>

              <label className={styles.label}>
                Judul (Opsional)
                <input
                  type="text" className={styles.input}
                  value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Judul gambar..."
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label className={styles.label}>
                  Kategori
                  <input
                    type="text" className={styles.input}
                    value={formCategory} onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Contoh: Kitchen"
                  />
                </label>
                <label className={styles.label}>
                  Subkategori
                  <input
                    type="text" className={styles.input}
                    value={formSubcategory} onChange={(e) => setFormSubcategory(e.target.value)}
                    placeholder="Contoh: Kabinet"
                  />
                </label>
              </div>

              <label className={styles.label}>
                Tags
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4, padding: 4, border: '1px solid #ddd', borderRadius: 4 }}>
                  {formTags.map(t => (
                    <span key={t} style={{ background: '#eee', padding: '2px 6px', borderRadius: 4, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      #{t}
                      <button type="button" onClick={() => removeTag(t)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={formTagInput} onChange={(e) => setFormTagInput(e.target.value)}
                    onKeyDown={addTag}
                    placeholder={formTags.length === 0 ? "Ketik tag lalu Enter" : ""}
                    style={{ border: 'none', outline: 'none', flex: 1, minWidth: 60 }}
                  />
                </div>
              </label>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setAddOpen(false)}
                  className={`${styles.modalBtn} ${darkMode ? styles.modalBtnSecondaryNight : styles.modalBtnSecondaryDay}`}>
                  Batal
                </button>
                <button type="submit" disabled={formSubmitting}
                  className={`${styles.modalBtn}`} style={{ background: '#2563eb', color: 'white' }}>
                  {formSubmitting ? 'Mengupload...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {editOpen && editItem && (
        <div className={styles.modalOverlay} onClick={() => setEditOpen(false)}>
          <div
            className={`${styles.modalCard} ${darkMode ? styles.modalCardNight : styles.modalCardDay}`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px' }}
          >
            <div className={styles.modalHeader}>Edit Foto</div>
            <form onSubmit={doEditSubmit} className={styles.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div style={{ textAlign: 'center' }}>
                <img src={editItem.url} alt="Preview" style={{ maxHeight: 150, borderRadius: 8 }} />
              </div>

              <label className={styles.label}>
                Judul
                <input
                  type="text" className={styles.input}
                  value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label className={styles.label}>
                  Kategori
                  <input
                    type="text" className={styles.input}
                    value={formCategory} onChange={(e) => setFormCategory(e.target.value)}
                  />
                </label>
                <label className={styles.label}>
                  Subkategori
                  <input
                    type="text" className={styles.input}
                    value={formSubcategory} onChange={(e) => setFormSubcategory(e.target.value)}
                  />
                </label>
              </div>

              <label className={styles.label}>
                Tags
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4, padding: 4, border: '1px solid #ddd', borderRadius: 4 }}>
                  {formTags.map(t => (
                    <span key={t} style={{ background: '#eee', padding: '2px 6px', borderRadius: 4, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      #{t}
                      <button type="button" onClick={() => removeTag(t)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={formTagInput} onChange={(e) => setFormTagInput(e.target.value)}
                    onKeyDown={addTag}
                    placeholder={formTags.length === 0 ? "Ketik tag lalu Enter" : ""}
                    style={{ border: 'none', outline: 'none', flex: 1, minWidth: 60 }}
                  />
                </div>
              </label>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setEditOpen(false)}
                  className={`${styles.modalBtn} ${darkMode ? styles.modalBtnSecondaryNight : styles.modalBtnSecondaryDay}`}>
                  Batal
                </button>
                <button type="submit" disabled={formSubmitting}
                  className={`${styles.modalBtn}`} style={{ background: '#059669', color: 'white' }}>
                  {formSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRM MODAL (Existing) --- */}
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

      {/* --- PREVIEW MODAL (Existing) --- */}
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
                <div style={{ marginBottom: 12 }}>
                  <button
                    onClick={() => { closePreview(); openEditModal(previewItem); }}
                    style={{ width: '100%', padding: '8px', background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: 6, color: '#0369a1', fontWeight: 600, cursor: 'pointer' }}
                  >
                    ✏️ Edit Data Foto Ini
                  </button>
                </div>
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
          </div>
        </div >
    <div className={styles.submitWrapper} style={{ marginTop: '20px' }}>
      <button
        type="button"
        className={styles.sidebarBackButton}
        onClick={handleBack}
        style={{ color: isDarkMode ? '#f5c542' : '#0b1531', borderColor: isDarkMode ? '#f5c542' : '#0b1531', padding: '8px 24px' }}
      >
        KEMBALI KE GALERI
      </button>
    </div>
    </div >
  );
}
```
