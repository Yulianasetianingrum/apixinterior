
import styles from "./page.module.css";

export default function Loading() {
    return (
        <div className={styles.loadingContainer} style={{ background: "#ffffff", minHeight: "100vh" }}>
            {/* Navbar Skeleton */}
            <div style={{ height: 80, borderBottom: "1px solid #eee", display: "flex", alignItems: "center", padding: "0 24px", justifyContent: "space-between" }}>
                <div className={styles.skeleton} style={{ width: 120, height: 32, borderRadius: 4 }} />
                <div style={{ display: "flex", gap: 24 }}>
                    <div className={styles.skeleton} style={{ width: 80, height: 20, borderRadius: 4 }} />
                    <div className={styles.skeleton} style={{ width: 80, height: 20, borderRadius: 4 }} />
                    <div className={styles.skeleton} style={{ width: 80, height: 20, borderRadius: 4 }} />
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                    <div className={styles.skeleton} style={{ width: 32, height: 32, borderRadius: 999 }} />
                    <div className={styles.skeleton} style={{ width: 32, height: 32, borderRadius: 999 }} />
                </div>
            </div>

            {/* Hero Skeleton (V1 Split) */}
            <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center", minHeight: 600 }}>
                {/* Text Side */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div className={styles.skeleton} style={{ width: "30%", height: 24, borderRadius: 4 }} />
                    <div className={styles.skeleton} style={{ width: "80%", height: 60, borderRadius: 8 }} />
                    <div className={styles.skeleton} style={{ width: "60%", height: 20, borderRadius: 4 }} />
                    <div className={styles.skeleton} style={{ width: 160, height: 48, borderRadius: 999, marginTop: 10 }} />
                </div>
                {/* Image Side */}
                <div className={styles.skeleton} style={{ width: "100%", height: 500, borderRadius: 24 }} />
            </div>

            {/* Grid Skeleton */}
            <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div className={styles.skeleton} style={{ width: "100%", aspectRatio: "4/5", borderRadius: 12 }} />
                        <div className={styles.skeleton} style={{ width: "60%", height: 20, borderRadius: 4 }} />
                    </div>
                ))}
            </div>
        </div>
    );
}
