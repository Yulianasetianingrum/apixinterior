"use client";

import * as React from "react";
import ConfirmActionForm from "./ConfirmActionForm.client";
import styles from "./toko.module.css";

export default function FloatingPreviewActions({
  themeKey,
  previewHref,
  resetAction,
  deleteThemeAction,
  autoGenerateAction,
  previewClassName,
  saveClassName,
  dangerClassName,
  autoGenerateClassName,
}: {
  themeKey: string;
  previewHref: string;
  resetAction: (formData: FormData) => void | Promise<void>;
  deleteThemeAction: (formData: FormData) => void | Promise<void>;
  autoGenerateAction: (formData: FormData) => void | Promise<void>;
  previewClassName: string;
  saveClassName: string;
  dangerClassName: string;
  autoGenerateClassName: string;
}) {
  const handleSave = React.useCallback(() => {
    try {
      window.sessionStorage.setItem("toko-scroll-y", String(window.scrollY || 0));
    } catch {
      // ignore storage errors
    }
    try {
      const lastFormId = window.sessionStorage.getItem("toko-last-form-id");
      if (lastFormId) {
        const form = document.getElementById(lastFormId) as HTMLFormElement | null;
        if (form && form.getAttribute("data-section-form") === "1") {
          if (typeof form.requestSubmit === "function") {
            form.requestSubmit();
          } else {
            form.submit();
          }
          return;
        }
      }

      const sections = Array.from(document.querySelectorAll('article[id^="section-"]'));
      let pickedForm: HTMLFormElement | null = null;
      let best = Number.POSITIVE_INFINITY;
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
        const dist = Math.abs(rect.top);
        if (dist < best) {
          const form = section.querySelector('form[data-section-form="1"]') as HTMLFormElement | null;
          if (form) {
            best = dist;
            pickedForm = form;
          }
        }
      });

      if (!pickedForm && sections.length) {
        const form = sections[0]?.querySelector('form[data-section-form="1"]') as HTMLFormElement | null;
        if (form) pickedForm = form;
      }

      if (pickedForm) {
        if (typeof pickedForm.requestSubmit === "function") {
          pickedForm.requestSubmit();
        } else {
          pickedForm.submit();
        }
        return;
      }
    } catch {
      // ignore storage errors
    }

    const url = new URL(window.location.href);
    url.searchParams.set("r", String(Date.now()));
    window.location.href = url.toString();
  }, []);

  return (
    <div className={styles.floatingActions}>
      <a className={previewClassName} href={previewHref} style={{ textDecoration: "none" }}>
        Preview
      </a>

      <button type="button" className={saveClassName} onClick={handleSave}>
        Simpan
      </button>

      <ConfirmActionForm
        action={deleteThemeAction}
        themeKey={themeKey}
        label="Hapus Theme"
        confirmMessage={`Yakin ingin menghapus theme "${themeKey}" selamanya? Tindakan ini tidak bisa dibatalkan.`}
        className={dangerClassName}
      />

      <ConfirmActionForm
        action={resetAction}
        themeKey={themeKey}
        label="Drop All Sections"
        confirmMessage="Hapus semua section draft di theme ini? Tindakan ini tidak bisa dibatalkan."
        className={dangerClassName}
      />

      <form action={autoGenerateAction}>
        <input type="hidden" name="themeKey" value={themeKey} />
        <button type="submit" className={autoGenerateClassName}>
          Auto Generate
        </button>
      </form>
    </div>
  );
}
