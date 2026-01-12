"use client";

import * as React from "react";

export default function ConfirmActionForm({
  action,
  themeKey,
  label,
  confirmMessage,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  themeKey: string;
  label: string;
  confirmMessage: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 12000,
    padding: 16,
  };

  const dialogStyle: React.CSSProperties = {
    width: "min(520px, 92vw)",
    background: "#fff",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.12)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    padding: 18,
    color: "#0b1c3f",
  };

  const actionsStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  };

  return (
    <div>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>

      {open ? (
        <div
          style={overlayStyle}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.currentTarget === e.target) setOpen(false);
          }}
        >
          <div style={dialogStyle}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Konfirmasi</div>
            <div style={{ fontSize: 14, opacity: 0.85 }}>{confirmMessage}</div>

            <div style={actionsStyle}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  border: "1px solid rgba(0,0,0,0.2)",
                  borderRadius: 10,
                  padding: "8px 12px",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <form action={action}>
                <input type="hidden" name="themeKey" value={themeKey} />
                <button type="submit" className={className}>
                  Ya, Hapus
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
