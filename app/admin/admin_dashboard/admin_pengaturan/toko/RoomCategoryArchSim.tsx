'use client';

import { useMemo, useState } from "react";
import styles from "./toko.module.css";

type FitMode = "cover" | "contain";

export default function RoomArchCropSim(props: {
  cardKey: string;
  imageUrl: string;
  title: string;
  defaultCropY: number;
  defaultZoom: number;
  defaultFit: FitMode;
}) {
  const [cropY, setCropY] = useState<number>(
    Number.isFinite(props.defaultCropY) ? Math.max(0, Math.min(100, props.defaultCropY)) : 50
  );
  const [zoom, setZoom] = useState<number>(
    Number.isFinite(props.defaultZoom) ? Math.max(1, Math.min(3, props.defaultZoom)) : 1
  );
  const [fit, setFit] = useState<FitMode>(props.defaultFit === "contain" ? "contain" : "cover");

  const hasTitle = useMemo(() => String(props.title ?? "").trim().length > 0, [props.title]);

  return (
    <div className={styles.roomArchSimWrap}>
      <div className={styles.roomArchSim} aria-label="Simulasi shape Arch">
        {props.imageUrl ? (
          <img
            className={styles.roomArchImg}
            src={props.imageUrl}
            alt={props.title || "room"}
            style={{
              objectFit: fit,
              objectPosition: `center ${cropY}%`,
              transform: `scale(${zoom})`,
              transformOrigin: "center",
            }}
          />
        ) : (
          <div className={styles.roomArchPlaceholder}>
            Belum ada gambar. Pilih gambar dulu untuk melihat simulasi arch.
          </div>
        )}

        {hasTitle ? <div className={styles.roomArchTitle}>{props.title}</div> : null}
      </div>

      <div className={styles.roomArchControls}>
        <div className={styles.roomArchControl}>
          <label className={styles.label} htmlFor={`cropY_${props.cardKey}`}>
            Crop Vertikal ({cropY}%)
          </label>
          <input
            id={`cropY_${props.cardKey}`}
            name={`cropY_${props.cardKey}`}
            className={styles.roomArchRange}
            type="range"
            min={0}
            max={100}
            step={1}
            value={cropY}
            onChange={(e) => setCropY(Number(e.target.value))}
          />
          <div className={styles.roomArchControlHint}>Atur fokus atas/bawah gambar.</div>
        </div>

        <div className={styles.roomArchControl}>
          <label className={styles.label} htmlFor={`zoom_${props.cardKey}`}>
            Zoom ({zoom.toFixed(2)}x)
          </label>
          <input
            id={`zoom_${props.cardKey}`}
            name={`zoom_${props.cardKey}`}
            className={styles.roomArchRange}
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
          <div className={styles.roomArchControlHint}>Perbesar/perkecil untuk pas di arch.</div>
        </div>

        <div className={styles.roomArchControl} style={{ gridColumn: "1 / -1" }}>
          <label className={styles.label} htmlFor={`fit_${props.cardKey}`}>
            Fit Mode
          </label>
          <select
            id={`fit_${props.cardKey}`}
            name={`fit_${props.cardKey}`}
            className={styles.select}
            value={fit}
            onChange={(e) => setFit(e.target.value === "contain" ? "contain" : "cover")}
          >
            <option value="cover">cover (crop)</option>
            <option value="contain">contain (tanpa crop)</option>
          </select>
          <div className={styles.roomArchControlHint}>
            Kalau judul kosong, sebaiknya tetap <strong>cover</strong> biar penuh. Pakai{" "}
            <strong>contain</strong> kalau gambar penting tidak boleh terpotong.
          </div>
        </div>
      </div>
    </div>
  );

}