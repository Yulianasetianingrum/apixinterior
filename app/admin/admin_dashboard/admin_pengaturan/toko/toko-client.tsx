"use client";

import { useEffect } from "react";
import styles from "./toko.module.css";

/**
 * Client-side helpers ONLY.
 * - Hindari submit form tidak sengaja dari tombol kecil.
 * - Live preview select gambar.
 * - Drag-drop urutan section draft.
 * - Ordered picker untuk carousel.
 * - Auto-generate HERO presets.
 */
export default function TokoClient() {
  useEffect(() => {
    // ---- Auto-dismiss admin notice/error (3s) ----
    try {
      const noticeEl = document.querySelector('[data-admin-notice="1"]') as HTMLElement | null;
      if (noticeEl) {
        window.setTimeout(() => {
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete("notice");
            url.searchParams.delete("error");
            url.searchParams.delete("r");
            window.history.replaceState({}, "", url.toString());
            noticeEl.remove();
          } catch {
            // ignore URL errors
          }
        }, 3000);
      }
    } catch {
      // ignore
    }

    // ---- Utility: force buttons to be type="button" untuk kontrol non-submit ----
    try {
      const forceButtonType = (selector: string) => {
        document.querySelectorAll(selector).forEach((el) => {
          if (el instanceof HTMLButtonElement && !el.hasAttribute("type")) el.type = "button";
        });
      };

      forceButtonType("[data-add-product]");
      forceButtonType("[data-remove]");
      forceButtonType(".js-save-order");

      // ---- Live preview untuk <select> gambar_upload ----
      document.querySelectorAll(".js-image-select").forEach((el) => {
        const select = el as HTMLSelectElement;
        const previewId = select.getAttribute("data-preview-id");
        if (!previewId) return;

        const update = () => {
          const opt = select.selectedOptions?.[0] as HTMLOptionElement | undefined;
          const url = opt?.dataset?.url || "";
          const img = document.getElementById(previewId) as HTMLImageElement | null;
          if (!img) return;
          if (url) {
            img.src = url;
            img.style.display = "";
          } else {
            img.removeAttribute("src");
            img.style.display = "none";
          }
        };

        select.addEventListener("change", (e) => {
          e.preventDefault();
          e.stopPropagation();
          update();
        });

        update(); // initial
      });
    } catch (e) {
      console.error("TokoClient init (buttons/images) failed", e);
    }

    // ---- Custom Promo: auto-clear vouchers ketika mode diganti (tanpa pop up) ----
    try {
      document.querySelectorAll("select[data-cp-select='true']").forEach((sel) => {
        const select = sel as HTMLSelectElement;
        const handler = () => {
          const clearBtnId = select.getAttribute("data-clear-btn-id");
          const clearBtn = clearBtnId
            ? (document.querySelector(`[data-clear-vouchers-btn='${clearBtnId}']`) as HTMLButtonElement | null)
            : null;
          if (clearBtn && !clearBtn.disabled) clearBtn.click();
        };
        select.addEventListener("change", handler);
      });
    } catch (e) {
      console.error("TokoClient custom promo auto-clear failed", e);
    }

    // ---- DnD untuk urutan section draft ----
    const list = document.querySelector(".js-section-list-drag") as HTMLElement | null;
    if (list) {
      let draggingEl: HTMLElement | null = null;
      const isTabletOrMobile = window.matchMedia("(max-width: 1023px)").matches;

      let saveTimer: ReturnType<typeof setTimeout> | null = null;
      let saving = false;

      const collectIds = (): number[] => {
        const rows = list.querySelectorAll(".js-section-row") as NodeListOf<HTMLElement>;
        const ids: number[] = [];
        rows.forEach((el) => {
          const idStr = el.getAttribute("data-id");
          const id = idStr ? Number(idStr) : NaN;
          if (!Number.isNaN(id)) ids.push(id);
        });
        return ids;
      };

      const persistOrder = async (ids: number[]): Promise<boolean> => {
        if (!ids.length || saving) return false;
        saving = true;
        try {
          const res = await fetch("/api/admin/admin_dashboard/admin_pengaturan/toko/reorder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
          });

          if (res.ok) return true;

          const data = await res.json().catch(() => ({}));
          alert(data?.error || "Gagal simpan urutan.");
          return false;
        } catch (err) {
          console.error(err);
          alert("Gagal simpan urutan (network/server error).");
          return false;
        } finally {
          saving = false;
        }
      };

      const schedulePersist = () => {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(async () => {
          const ids = collectIds();
          const ok = await persistOrder(ids);
          // Tanpa reload: biarkan UI lokal tetap, server state sudah tersimpan.
          if (ok) return;
        }, 80);
      };

      const syncSectionOrderLabels = () => {
        const rows = list.querySelectorAll(".js-section-row") as NodeListOf<HTMLElement>;
        rows.forEach((row, idx) => {
          const orderEl = row.querySelector('[class*="sectionOrder"]') as HTMLElement | null;
          if (orderEl) orderEl.textContent = `#${idx + 1}`;
        });
      };

      const moveRowByButton = (row: HTMLElement, direction: "up" | "down") => {
        const sibling =
          direction === "up"
            ? (row.previousElementSibling as HTMLElement | null)
            : (row.nextElementSibling as HTMLElement | null);
        if (!sibling) return;

        if (direction === "up") {
          row.parentNode?.insertBefore(row, sibling);
        } else {
          row.parentNode?.insertBefore(sibling, row);
        }

        syncSectionOrderLabels();
        schedulePersist();
      };

      const setupRows = () => {
        const rows = list.querySelectorAll(".js-section-row") as NodeListOf<HTMLElement>;
        rows.forEach((row) => {
          row.draggable = !isTabletOrMobile;

          const upBtn = row.querySelector(".js-move-up") as HTMLButtonElement | null;
          const downBtn = row.querySelector(".js-move-down") as HTMLButtonElement | null;
          if (upBtn) {
            upBtn.type = "button";
            upBtn.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              moveRowByButton(row, "up");
            });
          }
          if (downBtn) {
            downBtn.type = "button";
            downBtn.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              moveRowByButton(row, "down");
            });
          }

          row.addEventListener("dragstart", (e) => {
            if (isTabletOrMobile) {
              e.preventDefault();
              return;
            }
            draggingEl = row;
            if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
          });

          row.addEventListener("dragover", (e) => {
            e.preventDefault();
            if (!draggingEl || draggingEl === row) return;

            const rect = row.getBoundingClientRect();
            const offset = e.clientY - rect.top;
            const halfway = rect.height / 2;

            if (offset < halfway) row.parentNode?.insertBefore(draggingEl, row);
            else row.parentNode?.insertBefore(draggingEl, row.nextSibling);
          });

          row.addEventListener("dragend", () => {
            draggingEl = null;
            // Auto-save urutan setelah drop (tanpa perlu klik "Simpan Urutan")
            syncSectionOrderLabels();
            schedulePersist();
          });
        });
      };

      setupRows();
      // Pastikan auto-save juga terpanggil pada event drop (lebih reliable di beberapa browser)
      list.addEventListener("drop", () => {
        syncSectionOrderLabels();
        schedulePersist();
      });


      const saveBtn = document.querySelector(".js-save-order") as HTMLButtonElement | null;
      if (saveBtn) {
        // Tidak perlu tombol lagi; auto-save berjalan saat drop.
        // Tombol disembunyikan tapi tetap jadi fallback (kalau mau ditampilkan lagi).
        saveBtn.style.display = "none";
        saveBtn.addEventListener("click", async (e) => {
          e.preventDefault();
          e.stopPropagation();

          const ids = collectIds();

          if (!ids.length) return;
const originalText = saveBtn.textContent || "";
          saveBtn.disabled = true;
          saveBtn.textContent = "Menyimpan...";

          try {
            await persistOrder(ids);
            syncSectionOrderLabels();
          } catch (err) {
            console.error(err);
            alert("Gagal simpan urutan (network/server error).");
          } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
          }
        });
      }

      syncSectionOrderLabels();
    }

    // ---- Ordered picker untuk PRODUCT_CAROUSEL ----
    const makeSortable = (ul: HTMLElement) => {
      let dragging: HTMLElement | null = null;

      ul.querySelectorAll(".js-sortable-item").forEach((li) => {
        const el = li as HTMLElement;
        el.addEventListener("dragstart", (e) => {
          dragging = el;
          if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
        });
        el.addEventListener("dragover", (e) => {
          e.preventDefault();
          if (!dragging || dragging === el) return;
          const rect = el.getBoundingClientRect();
          const offset = e.clientY - rect.top;
          const halfway = rect.height / 2;
          if (offset < halfway) el.parentNode?.insertBefore(dragging, el);
          else el.parentNode?.insertBefore(dragging, el.nextSibling);
        });
        el.addEventListener("dragend", () => {
          dragging = null;
          refreshHiddenInputs(ul);
        });
      });
    };

    const refreshHiddenInputs = (ul: HTMLElement) => {
      const name = ul.getAttribute("data-name") || "productIds";
      ul.querySelectorAll('input[type="hidden"]').forEach((inp) => inp.remove());
      ul.querySelectorAll(".js-sortable-item").forEach((li) => {
        const v = li.getAttribute("data-value");
        if (!v) return;
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = v;
        li.appendChild(input);
      });
    };

    try {
      document.querySelectorAll(".js-ordered-picker").forEach((block) => {
        const b = block as HTMLElement;
        const sourceId = b.getAttribute("data-source");
        const targetId = b.getAttribute("data-target");
        if (!sourceId || !targetId) return;

        const source = document.getElementById(sourceId);
        const target = document.getElementById(targetId) as HTMLElement | null;
        if (!source || !target) return;

        source.querySelectorAll("[data-add-product]").forEach((btn) => {
          const button = btn as HTMLButtonElement;
          button.type = "button";
          button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = button.getAttribute("data-add-product");
            if (!id) return;
            if (target.querySelector(`[data-value="${id}"]`)) return;
            const li = document.createElement("li");
            li.className = "js-sortable-item";
            li.draggable = true;
            li.setAttribute("data-value", id);
            li.style.display = "flex";
            li.style.alignItems = "center";
            li.style.justifyContent = "space-between";
            li.style.gap = "10px";
            li.style.padding = "8px 10px";
            li.style.border = "1px solid rgba(255,255,255,0.08)";
            li.style.borderRadius = "10px";
            li.style.marginBottom = "8px";

            const handle = document.createElement("span");
            handle.textContent = "";
            handle.style.cursor = "grab";
            handle.style.opacity = "0.8";

            const text = document.createElement("span");
            text.style.flex = "1";
            text.style.fontSize = "13px";
            text.textContent = `#${id}`;

            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "Hapus";
            remove.className = styles.dangerButton;
            remove.addEventListener("click", (e2) => {
              e2.preventDefault();
              e2.stopPropagation();
              li.remove();
              refreshHiddenInputs(target);
              makeSortable(target);
            });

            li.appendChild(handle);
            li.appendChild(text);
            li.appendChild(remove);
            target.appendChild(li);
            refreshHiddenInputs(target);
            makeSortable(target);
          });
        });

        target.querySelectorAll("[data-remove]").forEach((btn) => {
          const button = btn as HTMLButtonElement;
          button.type = "button";
          button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const li = button.closest(".js-sortable-item") as HTMLElement | null;
            li?.remove();
            refreshHiddenInputs(target);
            makeSortable(target);
          });
        });

        refreshHiddenInputs(target);
        makeSortable(target);
      });
    } catch (e) {
      console.error("TokoClient ordered-picker init failed", e);
    }

    // ---- HERO auto-generate (fill sample content) ----
    try {
      document.querySelectorAll(".js-hero-autofill").forEach((btn) => {
        const button = btn as HTMLButtonElement;
        button.type = "button";
        const formId = button.getAttribute("data-hero-form-id");
        const form = formId ? (document.getElementById(formId) as HTMLFormElement | null) : button.closest("form");
        if (!form) return;

        const presets = [
          {
            eyebrow: "Interior Essentials",
            headline: "Kurasi Furnitur & Dekor Premium",
            subheadline: "Belanja koleksi pilihan, siap pasang, siap kirim.",
            ctaLabel: "Belanja Sekarang",
            ctaHref: "/cari",
            badges: "Ready Stock\nKurasi Interior\nMaterial Premium\nPengiriman Cepat",
            highlights:
              "Gratis konsultasi styling\nPilihan warna netral hangat\nCocok untuk ruang kecil\nHarga transparan\nStylist siap bantu\nBisa COD",
            trustChips: "Pembayaran Aman\nGaransi\nSupport CS",
            miniTitle1: " 4.8",
            miniDesc1: "Rating pelanggan",
            miniTitle2: " 1.2k+",
            miniDesc2: "Produk tersedia",
            miniTitle3: " Fast",
            miniDesc3: "Respon CS",
            floatLookbookTitle: "Lookbook Minggu Ini",
            floatLookbookSubtitle: "Inspirasi ruang & koleksi pilihan",
            floatPromoTitle: "Promo",
            floatPromoText: "Gratis ongkir* untuk area tertentu",
          },
          {
            eyebrow: "Lookbook Pilihan",
            headline: "Ruang Modern Minimalis",
            subheadline: "Paket interior ramping, hemat waktu, siap kirim cepat.",
            ctaLabel: "Lihat Lookbook",
            ctaHref: "/lookbook",
            badges: "Ready Stock\nCustom ukuran\nDesain Gratis\nCicilan 0%",
            highlights:
              "Pemasangan kilat\nGratis konsultasi desainer\nFinishing premium\nGaransi 30 hari\nPengiriman terjadwal\nBisa COD",
            trustChips: "COD tersedia\nGaransi produk\nCS 7x24",
            miniTitle1: " 4.9",
            miniDesc1: "Ulasan puas",
            miniTitle2: " 900+",
            miniDesc2: "Item siap kirim",
            miniTitle3: " Express",
            miniDesc3: "Kirim & pasang",
            floatLookbookTitle: "Ide Minggu Ini",
            floatLookbookSubtitle: "Mix & match untuk ruang keluarga",
            floatPromoTitle: "Voucher",
            floatPromoText: "Diskon 10% khusus minggu ini",
          },
          {
            eyebrow: "Kurasi Interior",
            headline: "Upgrade Rumah Tanpa Ribet",
            subheadline: "Bundle furnitur & dekor siap dipakai, harga jujur.",
            ctaLabel: "Lihat Bundle",
            ctaHref: "/bundle",
            badges: "Siap Pasang\nMaterial Premium\nBonus Instalasi\nStylist On-Demand",
            highlights:
              "Bundle hemat curated\nWarna netral hangat\nFree styling call\nPilihan ukuran fleksibel\nGaransi tukar 7 hari\nPembayaran aman",
            trustChips: "Pembayaran aman\nGaransi tukar\nSupport CS",
            miniTitle1: " 4.7",
            miniDesc1: "Rating pelanggan",
            miniTitle2: " 1.5k+",
            miniDesc2: "Produk terkurasi",
            miniTitle3: " Cepat",
            miniDesc3: "Respon & kirim",
            floatLookbookTitle: "Lookbook Premium",
            floatLookbookSubtitle: "Inspirasi warna netral & aksen kayu",
            floatPromoTitle: "Promo",
            floatPromoText: "Gratis instalasi untuk bundle terpilih",
          },
          {
            eyebrow: "Promo Akhir Pekan",
            headline: "Diskon Furnitur & Sofa Minimalis",
            subheadline: "Sofa minimalis, rak dinding, kitchen set custom, siap kirim cepat.",
            ctaLabel: "Lihat Promo",
            ctaHref: "/promo",
            badges: "Diskon Hingga 20%\nBundling Ruang Tamu\nCicilan 0%\nGratis Ongkir",
            highlights:
              "Sofa minimalis ready stock\nRak dinding kokoh\nKitchen set custom ukuran\nBundle ruang tamu hemat\nPengiriman cepat\nSupport COD",
            trustChips: "Harga jujur\nGaransi retur\nCS responsif",
            miniTitle1: " 4.8",
            miniDesc1: "Rating pelanggan",
            miniTitle2: " 800+",
            miniDesc2: "Stok siap kirim",
            miniTitle3: " Same Day",
            miniDesc3: "Jabodetabek",
            floatLookbookTitle: "Lookbook Promo",
            floatLookbookSubtitle: "Ide ruang tamu hemat & rapi",
            floatPromoTitle: "Voucher",
            floatPromoText: "Potongan 200rb min. 1,5jt",
          },
          {
            eyebrow: "Desain Scandinavian",
            headline: "Styling Apartemen Estetik",
            subheadline: "Nuansa kayu terang, pencahayaan hangat, pas untuk ruang compact.",
            ctaLabel: "Mulai Styling",
            ctaHref: "/styling",
            badges: "Styling Online\nMoodboard Cepat\nSample Material\nKonsultasi Gratis",
            highlights:
              "Moodboard siap pakai\nFurnitur compact hemat ruang\nDekor natural & lembut\nWarna netral modern\nCahaya warm white cozy\nEstetika instagramable",
            trustChips: "Gratis konsultasi\nTim stylist\nGaransi revisi",
            miniTitle1: " 4.6",
            miniDesc1: "Pelanggan happy",
            miniTitle2: " 1k+",
            miniDesc2: "Produk scandi",
            miniTitle3: " Fast",
            miniDesc3: "Draft < 24 jam",
            floatLookbookTitle: "Lookbook Scandi",
            floatLookbookSubtitle: "Kayu terang & aksen putih",
            floatPromoTitle: "Bonus",
            floatPromoText: "Free konsultasi 30 menit",
          },
          {
            eyebrow: "Set Dapur & Pantry",
            headline: "Kitchen Set Modular Premium",
            subheadline: "Top table solid surface, soft close, aksesoris siap pasang.",
            ctaLabel: "Cek Paket Dapur",
            ctaHref: "/kitchen",
            badges: "Top Table Solid\nSoft Close\nGratis Ukur\nInstalasi Rapi",
            highlights:
              "Top table solid surface\nEngsel soft close\nKompartemen rapi\nPilihan warna matte\nInstalasi rapi\nGaransi servis",
            trustChips: "Gratis ukur\nTeknisi tersertifikasi\nGaransi 1 tahun",
            miniTitle1: " 4.9",
            miniDesc1: "Puas pelanggan",
            miniTitle2: " 700+",
            miniDesc2: "Paket terpasang",
            miniTitle3: " Cepat",
            miniDesc3: "Survey & pasang",
            floatLookbookTitle: "Lookbook Dapur",
            floatLookbookSubtitle: "Matte modern & aksen kayu",
            floatPromoTitle: "Promo",
            floatPromoText: "Gratis instalasi untuk paket lengkap",
          },
        ];

        button.addEventListener("click", () => {
          const setVal = (name: string, val: string) => {
            const input = form.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement | null;
            if (input) input.value = val;
          };
          const idx = Number(button.dataset.heroAutofillIdx || "0");
          const preset = presets[idx % presets.length];
          button.dataset.heroAutofillIdx = String((idx + 1) % presets.length);
          Object.entries(preset).forEach(([key, val]) => setVal(key, String(val ?? "")));
        });
      });
    } catch (e) {
      console.error("TokoClient hero autofill init failed", e);
    }

    // ---- TEXT_SECTION auto-generate ----
    try {
      const counters = new Map<string, number>();
      const nextIdx = (formId: string) => {
        const curr = counters.get(formId) ?? 0;
        const next = curr + 1;
        counters.set(formId, next);
        return next;
      };

      const slugify = (input: string) =>
        input
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");

      const templates = [
        (title: string) => ({
          subtitle: `Kurasi ${title} untuk mebel, interior, dan ruang rumah modern.`,
          body:
            `Temukan ${title} pilihan yang selaras dengan furnitur dan mebel rumah tangga, ` +
            `hingga kebutuhan office. Cocok untuk ruang tamu, dapur, kamar, maupun area bangunan lainnya.`,
          caption: `Tips: pilih material berkualitas agar ${title.toLowerCase()} lebih awet.`,
        }),
        (title: string) => ({
          subtitle: `Panduan singkat ${title} agar desain interior terasa rapi dan fungsional.`,
          body:
            `${title} ini dibuat untuk kebutuhan furnitur rumah dan office. ` +
            `Fokus pada kenyamanan, estetika, serta efisiensi ruang untuk mebel modern.`,
          caption: `Catatan: sesuaikan ukuran ${title.toLowerCase()} dengan luas ruangan.`,
        }),
        (title: string) => ({
          subtitle: `Inspirasi ${title} dengan gaya interior hangat dan minimal.`,
          body:
            `Kombinasikan ${title} dengan mebel dan furnitur pendukung agar ` +
            `tampilan ruangan tetap seimbang. Cocok untuk rumah, apartemen, hingga workspace.`,
          caption: `SEO: ${title} mebel interior rumah office.`,
        }),
      ];

      document.querySelectorAll(".js-text-autofill").forEach((btn) => {
        const button = btn as HTMLButtonElement;
        button.type = "button";
        const formId = button.getAttribute("data-text-form-id") || "";
        const form = formId ? (document.getElementById(formId) as HTMLFormElement | null) : null;
        if (!form) return;

        button.addEventListener("click", () => {
          const titleInput = form.querySelector('input[name="title"]') as HTMLInputElement | null;
          const titleRaw = titleInput?.value?.trim() || "Konten Interior";
          const title = titleRaw;

          const idx = nextIdx(formId) % templates.length;
          const t = templates[idx](title);
          const blocks = [
            { mode: "heading", text: title },
            { mode: "subtitle", text: t.subtitle },
            { mode: "body", text: t.body },
            { mode: "caption", text: t.caption },
          ];

          const slugInput = form.querySelector('input[name="slug"]') as HTMLInputElement | null;
          if (slugInput && !slugInput.value.trim()) {
            slugInput.value = slugify(titleRaw);
          }

          window.dispatchEvent(
            new CustomEvent("text-section-autofill", {
              detail: { formId, blocks },
            }),
          );
        });
      });
    } catch (e) {
      console.error("TokoClient text autofill init failed", e);
    }
  }, []);

  return null;
}

