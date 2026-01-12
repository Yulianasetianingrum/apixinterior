'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import layoutStyles from '../../admin_dashboard.module.css';
import styles from './upload_foto.module.css';

type Category = {
  id: number;
  name: string;
};

type Subcategory = {
  id: number;
  name: string;
  categoryId: number;
};

export default function UploadFotoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // HP & tablet
  const [darkMode, setDarkMode] = useState(false); // style siang/malam

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [categoryInput, setCategoryInput] = useState('');
  const [subcategoryInput, setSubcategoryInput] = useState('');

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    // TODO: kalau nanti ada API kategori/subkategori, isi disini
  }, []);

  const availableSubcategories = useMemo(() => {
    const cat = categories.find(
      (c) => c.name.toLowerCase() === categoryInput.toLowerCase()
    );
    if (!cat) return subcategories;
    return subcategories.filter((s) => s.categoryId === cat.id);
  }, [categories, subcategories, categoryInput]);

  function addTag(text: string) {
    const clean = text.trim();
    if (!clean) return;
    if (tags.includes(clean)) return;
    if (tags.length >= 10) {
      alert('Maksimal 10 tag.');
      return;
    }
    setTags((prev) => [...prev, clean]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (tags.length === 0) {
      alert('Minimal 1 tag.');
      return;
    }

    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    formData.set('category', categoryInput);
    formData.set('subcategory', subcategoryInput);
    formData.set('tags', tags.join(', '));

    const res = await fetch(
      '/api/admin/admin_dashboard/admin_galeri/upload_foto',
      {
        method: 'POST',
        body: formData,
      }
    );

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? 'Gagal upload');
      return;
    }

    router.push('/admin/admin_dashboard/admin_galeri/kolase_foto');
  }

  function handleBack() {
    router.push('/admin/admin_dashboard/admin_galeri');
    setSidebarOpen(false);
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
        {/* kosong supaya tidak double judul */}
        <div className={layoutStyles.mobileTitle}></div>
        <div
          className={`${styles.topRightBrand} ${
            darkMode ? styles.topRightBrandNight : ''
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
        className={`${layoutStyles.sidebar} ${
          sidebarOpen ? layoutStyles.sidebarOpen : ''
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
            className={layoutStyles.menuItem}
            onClick={() =>
              router.push('/admin/admin_dashboard/admin_galeri/kolase_foto')
            }
          >
            Kolase Foto
          </button>
          <button
            type="button"
            className={`${layoutStyles.menuItem} ${layoutStyles.menuItemActive}`}
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
            className={`${layoutStyles.themeSwitch} ${
              darkMode ? layoutStyles.themeSwitchOn : ''
            }`}
            onClick={() => setDarkMode((prev) => !prev)}
          >
            <div className={layoutStyles.themeThumb} />
          </button>
        </div>

        {/* TOMBOL KEMBALI – SELALU ADA (HP, TABLET, DESKTOP) */}
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
        className={`${layoutStyles.main} ${
          darkMode ? styles.mainNight : styles.mainDay
        }`}
      >
        {/* Brand kanan atas desktop */}
        <div className={styles.desktopTopBar}>
          <span
            className={`${styles.desktopBrand} ${
              darkMode ? styles.desktopBrandNight : ''
            }`}
          >
            APIX INTERIOR
          </span>
        </div>

        <header className={layoutStyles.mainHeader}>
          <h1
            className={`${layoutStyles.pageTitle} ${styles.pageTitleOutside}`}
          >
            Upload Gambar Galeri
          </h1>
          <p
            className={`${layoutStyles.pageSubtitle} ${styles.pageSubtitleOutside}`}
          >
            Tambahkan foto baru ke kolase, lengkap dengan kategori &amp; tag.
          </p>
        </header>

        {/* AREA CARD – BEDAKAN BACKGROUND DAY/NIGHT */}
        <div
          className={`${styles.cardArea} ${
            darkMode ? styles.cardAreaNight : styles.cardAreaDay
          }`}
        >
          <div className={styles.cardWrapper}>
            <div
              className={`${layoutStyles.card} ${styles.card} ${
                darkMode ? styles.cardNight : styles.cardDay
              } ${styles.noCardHover}`}
            >
              <form
                onSubmit={handleSubmit}
                className={`${styles.form} ${
                  darkMode ? styles.formNight : styles.formDay
                }`}
              >
                <div className={styles.field}>
                  <label className={styles.label}>
                    Judul (opsional)
                    <input
                      type="text"
                      name="title"
                      className={styles.input}
                      placeholder="Contoh: Kitchen set minimalis klien Surabaya"
                    />
                  </label>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>
                    File Gambar
                    <input
                      type="file"
                      name="foto"
                      accept="image/*"
                      required
                      className={styles.inputFile}
                    />
                  </label>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>
                    Kategori Utama
                    <input
                      type="text"
                      placeholder="misal: Furniture Rumah"
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      className={styles.input}
                    />
                  </label>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>
                    Subkategori (opsional)
                    <input
                      type="text"
                      placeholder="misal: Lemari pakaian"
                      value={subcategoryInput}
                      onChange={(e) => setSubcategoryInput(e.target.value)}
                      className={styles.input}
                    />
                  </label>
                </div>

                {/* TAGS */}
                <div className={styles.field}>
                  <label className={styles.label}>Tags (wajib, maks 10)</label>
                  <div className={styles.tagsContainer}>
                    {tags.map((tag) => (
                      <span key={tag} className={styles.tagChip}>
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className={styles.tagRemove}
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          if (tagInput.trim()) addTag(tagInput);
                        }
                        if (
                          e.key === 'Backspace' &&
                          !tagInput &&
                          tags.length > 0
                        ) {
                          removeTag(tags[tags.length - 1]);
                        }
                      }}
                      placeholder="ketik tag lalu Enter, contoh: lemari, minimalis"
                      className={styles.tagInput}
                    />
                  </div>
                  <small className={styles.helpText}>
                    Contoh: kitchen, kabinet, minimalis, klien Surabaya
                  </small>
                </div>

                {/* TOMBOL UPLOAD DI TENGAH */}
                <div className={styles.submitWrapper}>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`${styles.submitBtn} ${
                      darkMode ? styles.submitBtnDark : styles.submitBtnLight
                    }`}
                  >
                    {loading ? 'Mengupload...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
