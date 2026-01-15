"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../../admin_dashboard.module.css";
import LogoutButton from "../../LogoutButton";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

type MenuKey = "home" | "produk" | "galeri" | "pengaturan" | "konten" | "statistik";

type ChartData = {
    label: string;
    current: number;
    previous: number;
    periodLabel?: string;
};

export default function TotalPengunjungPage() {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [activeMenu, setActiveMenu] = useState<MenuKey>("statistik");

    // Stats Cards
    const [stats, setStats] = useState({
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        total: 0,
    });

    // Chart State
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [period, setPeriod] = useState<"today" | "week" | "month" | "year">("today");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [chartLoading, setChartLoading] = useState(false);

    // Initial Fetch
    useEffect(() => {
        fetchStats();
        fetchChartData();
    }, []);

    // Fetch on filter change
    useEffect(() => {
        fetchChartData();
    }, [period, selectedYear]);

    async function fetchStats() {
        try {
            const res = await fetch("/api/admin/admin_dashboard/admin_statistik");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    }

    async function fetchChartData() {
        try {
            setChartLoading(true);
            const query = new URLSearchParams({
                period,
                year: selectedYear.toString()
            });

            const res = await fetch(`/api/admin/admin_dashboard/admin_statistik/chart?${query.toString()}`);
            if (res.ok) {
                const json = await res.json();
                setChartData(json.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch chart:", error);
        } finally {
            setChartLoading(false);
        }
    }

    const goHome = () => {
        setActiveMenu("home");
        setIsSidebarOpen(false);
        router.push("/admin/admin_dashboard");
    };

    const handleMenuClick = (menu: Exclude<MenuKey, "home">) => {
        setActiveMenu(menu);
        setIsSidebarOpen(false);

        switch (menu) {
            case "produk":
                router.push("/admin/admin_dashboard/admin_produk");
                break;
            case "galeri":
                router.push("/admin/admin_dashboard/admin_galeri");
                break;
            case "pengaturan":
                router.push("/admin/admin_dashboard/admin_pengaturan");
                break;
            case "statistik":
                router.push("/admin/admin_dashboard/admin_statistik");
                break;
        }
    };

    // Helper for labels
    const getPeriodLabel = () => {
        if (period === "today") return "Hari Ini (24 Jam)";
        if (period === "week") return "Minggu Ini (7 Hari)";
        if (period === "month") return "Bulan Ini (Harian)";
        if (period === "year") return `Tahun ${selectedYear} (Bulanan)`;
        return "";
    };

    const getComparisonLabel = () => {
        if (period === "today") return "Kemarin";
        if (period === "week") return "Minggu Lalu";
        if (period === "month") return "Bulan Lalu";
        if (period === "year") return `Tahun ${selectedYear - 1}`;
        return "Sebelumnya";
    };

    return (
        <div className={`${styles.dashboard} ${isDarkMode ? styles.dashboardDark : ""}`}>
            <header className={styles.mobileTopBar}>
                <button
                    className={styles.mobileMenuButton}
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label="Buka menu"
                >
                    =
                </button>
                <h1 className={styles.mobileTitle}>Total Pengunjung</h1>
            </header>

            {isSidebarOpen && (
                <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)} />
            )}

            <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
                <div className={styles.sidebarHeader}>
                    <button
                        className={styles.backButton}
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Tutup menu"
                    >
                        ←
                    </button>
                    <div className={styles.brand}>
                        <span className={styles.brandLogo}>A</span>
                        <div className={styles.brandText}>
                            <span className={styles.brandTitle}>APIX Interior</span>
                            <span className={styles.brandSubtitle}>Admin Panel</span>
                        </div>
                    </div>
                </div>

                <nav className={styles.menu}>
                    <button
                        className={`${styles.menuItem} ${activeMenu === "home" ? styles.menuItemActive : ""}`}
                        onClick={goHome}
                    >
                        Home
                    </button>
                    <button onClick={() => handleMenuClick("produk")} className={styles.menuItem}>Produk</button>
                    <button onClick={() => handleMenuClick("galeri")} className={styles.menuItem}>Galeri</button>
                    <button onClick={() => handleMenuClick("pengaturan")} className={styles.menuItem}>Pengaturan</button>
                    <button onClick={() => router.push("/admin/admin_dashboard/admin_konten")} className={styles.menuItem}>Konten</button>
                    <button onClick={() => handleMenuClick("statistik")} className={`${styles.menuItem} ${activeMenu === "statistik" ? styles.menuItemActive : ""}`}>Statistik</button>
                </nav>

                <div className={styles.themeSwitchWrapper}>
                    <span className={styles.themeLabel}>
                        Mode: {isDarkMode ? "Malam" : "Siang"}
                    </span>
                    <button
                        className={`${styles.themeSwitch} ${isDarkMode ? styles.themeSwitchOn : ""}`}
                        onClick={() => setIsDarkMode((prev) => !prev)}
                        aria-label="Toggle dark mode"
                    >
                        <span className={styles.themeThumb} />
                    </button>
                </div>

                <div className={styles.logoutInlineWrapper}>
                    <LogoutButton />
                </div>
            </aside>

            <main className={styles.main}>
                <div className={styles.mainHeader}>
                    <button
                        onClick={() => router.back()}
                        style={{
                            background: "transparent",
                            border: "none",
                            fontSize: "18px",
                            cursor: "pointer",
                            marginBottom: "10px",
                            display: "flex", alignItems: "center", gap: 8
                        }}
                    >
                        ← Kembali
                    </button>
                    <h2 className={styles.pageTitle}>Statistik Pengunjung</h2>
                </div>

                {/* INFO CARDS */}
                <section className={styles.cardsGrid}>
                    <article className={styles.card}>
                        <h3 className={styles.cardTitle}>Hari Ini</h3>
                        <div style={{ fontSize: "36px", fontWeight: "bold", color: "#0ea5e9", marginTop: "10px" }}>
                            {stats.today}
                        </div>
                    </article>

                    <article className={styles.card}>
                        <h3 className={styles.cardTitle}>Minggu Ini</h3>
                        <div style={{ fontSize: "36px", fontWeight: "bold", color: "#8b5cf6", marginTop: "10px" }}>
                            {stats.thisWeek}
                        </div>
                    </article>

                    <article className={styles.card}>
                        <h3 className={styles.cardTitle}>Bulan Ini</h3>
                        <div style={{ fontSize: "36px", fontWeight: "bold", color: "#f59e0b", marginTop: "10px" }}>
                            {stats.thisMonth}
                        </div>
                    </article>

                    <article className={styles.card}>
                        <h3 className={styles.cardTitle}>Total</h3>
                        <div style={{ fontSize: "36px", fontWeight: "bold", color: "#10b981", marginTop: "10px" }}>
                            {stats.total}
                        </div>
                    </article>
                </section>

                {/* CHART SECTION */}
                <section style={{
                    marginTop: "30px",
                    background: "#fff",
                    borderRadius: "12px",
                    padding: "24px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}>
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "10px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>
                            Trend Pengunjung: {getPeriodLabel()}
                        </h3>

                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            {period === 'year' && (
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    style={{
                                        padding: "8px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontWeight: 600
                                    }}
                                >
                                    {[2024, 2025, 2026, 2027].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            )}

                            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "8px", padding: "4px" }}>
                                {(['today', 'week', 'month', 'year'] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "6px",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            border: "none",
                                            cursor: "pointer",
                                            background: period === p ? "#0b1d3a" : "transparent",
                                            color: period === p ? "#fff" : "#64748b",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        {p === 'today' ? 'Hari Ini' :
                                            p === 'week' ? 'Minggu' :
                                                p === 'month' ? 'Bulan' : 'Tahun'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ width: "100%", height: 400 }}>
                        {chartLoading ? (
                            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                                Memuat Chart...
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0b1d3a" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#0b1d3a" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="label"
                                        stroke="#64748b"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />

                                    <Area
                                        type="monotone"
                                        dataKey="current"
                                        name={period === 'year' ? `Tahun ${selectedYear}` : "Periode Ini"}
                                        stroke="#0b1d3a"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorCurrent)"
                                        animationDuration={1000}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="previous"
                                        name={getComparisonLabel()}
                                        stroke="#94a3b8"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        fillOpacity={1}
                                        fill="url(#colorPrev)"
                                        animationDuration={1000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </section>

                <div style={{ marginTop: "40px", textAlign: "center", borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
                    <p style={{ marginBottom: "10px", color: "#ef4444", fontSize: "14px" }}>
                        Danger Zone
                    </p>
                    <button
                        onClick={async () => {
                            if (confirm("Yakin ingin menghapus SEMUA data statistik menjadi 0? Data tidak bisa dikembalikan.")) {
                                try {
                                    const res = await fetch("/api/admin/admin_dashboard/admin_statistik/reset", { method: "POST" });
                                    if (res.ok) {
                                        alert("Data berhasil di-reset jadi 0.");
                                        window.location.reload();
                                    }
                                } catch (e) {
                                    alert("Gagal reset data");
                                }
                            }
                        }}
                        style={{
                            background: "#fee2e2",
                            color: "#ef4444",
                            border: "1px solid #ef4444",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600"
                        }}
                    >
                        🗑️ Reset Semua Statistik ke 0
                    </button>
                    <p style={{ marginTop: "8px", fontSize: "12px", color: "#64748b" }}>
                        Gunakan ini jika Anda ingin memulai tracking dari awal bersih.
                    </p>
                </div>

            </main>
        </div>
    );
}
