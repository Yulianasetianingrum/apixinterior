'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import layoutStyles from '../../admin_dashboard.module.css';
import styles from './upload_foto.module.css';
import { useAdminTheme } from "../../AdminThemeContext";

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

  const { isDarkMode } = useAdminTheme();
  const [loading, setLoading] = useState(false);
  // sidebarOpen & darkMode local removed

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [categoryInput, setCategoryInput] = useState('');
  const [subcategoryInput, setSubcategoryInput] = useState('');

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ... inside component ...
  function handleAutoGenerate() {
    if (!selectedFile) {
      alert("Silakan pilih file gambar terlebih dahulu.");
      return;
    }
    // 1. Clean Filename -> Title
    let name = selectedFile.name.replace(/\.[^/.]+$/, ""); // remove extension
    name = name.replace(/[-_]/g, " "); // replace separators
    // Capitalize each word
    name = name.replace(/\b\w/g, (l) => l.toUpperCase());
    setTitle(name);

    // 2. Smart Categorization
    const lowerName = name.toLowerCase();

    // Find matching category
    const matchedCategory = categories.find(c =>
      lowerName.includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(lowerName)
    );

    if (matchedCategory) {
      setCategoryInput(matchedCategory.name);
    }
    // Fallback Heuristics for common terms if no direct match
    else if (lowerName.includes("kitchen")) setCategoryInput("Kitchen");
    else if (lowerName.includes("kamar") || lowerName.includes("bed")) setCategoryInput("Kamar Tidur");
    else if (lowerName.includes("ruang tamu") || lowerName.includes("living")) setCategoryInput("Ruang Tamu");
    else if (lowerName.includes("kantor") || lowerName.includes("office")) setCategoryInput("Kantor");

    // 3. Smart Subcategory (Heuristic)
    if (lowerName.includes("lemari")) setSubcategoryInput("Lemari Pakaian");
    else if (lowerName.includes("meja")) setSubcategoryInput("Meja Kerja");
    else if (lowerName.includes("kabinet")) setSubcategoryInput("Kabinet");
    else if (lowerName.includes("backdrop")) setSubcategoryInput("Backdrop TV");
    else setSubcategoryInput(""); // Reset if unknown

    // 4. Smart Tags
    // Split by space, filter short words/stopwords
    const stopWords = ["dan", "yang", "di", "ke", "dari", "ini", "itu", "untuk", "with", "and"];
    const potentialTags = lowerName
      .split(" ")
      .map(w => w.trim())
      .filter(w => w && w.length > 2 && !stopWords.includes(w));

    // Take max 5 tags
    setTags(potentialTags.slice(0, 7));
  }

  // Fetch Categories on Mount
  useEffect(() => {
    fetch('/api/admin/admin_dashboard/admin_produk/kategori_produk')
      .then((res) => res.json())
      .then((data) => {
        // API returns array of objects with { id, nama, ... }
        // We map to { id, name } for our local state
        if (Array.isArray(data)) {
          const mapped = data.map((d: any) => ({ id: d.id, name: d.nama }));
          setCategories(mapped);
        }
      })
      .catch((err) => console.error("Failed to fetch categories:", err));
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
    formData.set('title', title); // Ensure title is sent

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
  }

  return (
    <div style={{ width: '100%' }}>
      {/* HEADER */}
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
          className={`${styles.cardArea} ${isDarkMode ? styles.cardAreaNight : styles.cardAreaDay
            }`}
        >
          <div className={styles.cardWrapper}>
            <div
              className={`${layoutStyles.card} ${styles.card} ${isDarkMode ? styles.cardNight : styles.cardDay
                } ${styles.noCardHover}`}
            >
              <form
                onSubmit={handleSubmit}
                className={`${styles.form} ${isDarkMode ? styles.formNight : styles.formDay
                  }`}
              >
                <div className={styles.field}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className={styles.label} style={{ marginBottom: 0 }}>
                      Judul (opsional)
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoGenerate}
                      style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        backgroundColor: '#e2e8f0',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#475569',
                        fontWeight: 600
                      }}
                      title="Isi judul otomatis sesuai nama file"
                    >
                      ✨ Auto Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    name="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={styles.input}
                    placeholder="Contoh: Kitchen set minimalis klien Surabaya"
                  />
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
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
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
                    className={`${styles.submitBtn} ${isDarkMode ? styles.submitBtnDark : styles.submitBtnLight
                      }`}
                  >
                    {loading ? 'Mengupload...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
            </div>
          </div>
        </div>
      <div className={styles.submitWrapper} style={{ marginTop: '20px' }}>
          <button
            type="button"
            className={styles.sidebarBackButton}
            onClick={handleBack}
            style={{ color: isDarkMode ? '#f5c542' : '#0b1531', borderColor: isDarkMode ? '#f5c542' : '#0b1531' }}
          >
            KEMBALI KE GALERI
          </button>
      </div>

    </div >
  );
  );
}
