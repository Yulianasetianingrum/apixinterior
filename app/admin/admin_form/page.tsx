// app/admin/admin_form/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./admin_form.module.css";

type Status = "idle" | "loading" | "error";

export default function AdminFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch("/api/admin_form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setStatus("error");
        setMessage(data?.message ?? "Username atau password salah");
        return;
      }

      // kalau ada ?from=... balikin ke situ, kalau nggak ke dashboard
      const redirectTo = from || "/admin/admin_dashboard";
      router.push(redirectTo);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("Terjadi kesalahan. Coba lagi.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className={styles.screen}>
      <main className={styles.card}>
        <h1 className={styles.title}>Admin Login</h1>
        <p className={styles.subtitle}>
          Masukkan username &amp; password admin untuk masuk dashboard.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Username */}
          <div>
            <div className={styles.labelText}>Username</div>
            <input
              type="text"
              placeholder="apixinterior"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div>
            <div className={styles.labelText}>Password</div>
            <div className={styles.passwordWrapper}>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Password admin"
                className={styles.passwordInput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeToggle}
                onClick={() => setShowPass((prev) => !prev)}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Tombol */}
          <button
            type="submit"
            className={styles.button}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Masuk..." : "Login"}
          </button>

          {/* Pesan */}
          {message && (
            <p
              className={`${styles.message} ${
                status === "error"
                  ? styles.messageError
                  : styles.messageSuccess
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </main>
    </div>
  );
}
