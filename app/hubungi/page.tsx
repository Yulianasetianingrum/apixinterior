import { prisma } from "@/lib/prisma";
import Navbar from "@/app/navbar/Navbar";
import GlobalFooter from "@/app/components/GlobalFooter";
import Link from "next/link";
import {
  SiInstagram,
  SiFacebook,
  SiWhatsapp,
  SiTiktok,
  SiYoutube,
  SiLinkedin,
  SiX,
  SiGooglemaps,
} from "react-icons/si";
import { FaStar } from "react-icons/fa6";

export const dynamic = "force-dynamic";

// ============ Helpers ============

function buildWaLink(nomor: string, text?: string) {
  const clean = nomor.replace(/[^0-9]/g, "");
  if (!clean) return "#";
  const base = `https://wa.me/${clean}`;
  if (!text) return base;
  const encoded = encodeURIComponent(text);
  return `${base}?text=${encoded}`;
}

const sosmedIconMap: Record<string, React.ComponentType<{ className?: string, size?: number }>> = {
  instagram: SiInstagram,
  facebook: SiFacebook,
  whatsapp: SiWhatsapp,
  tiktok: SiTiktok,
  youtube: SiYoutube,
  linkedin: SiLinkedin,
  x: SiX,
};

// ============ Data loader ============

async function getHubungiData() {
  const informasiToko = await prisma.informasiToko.findUnique({
    where: { id: 1 },
  });

  const utama = await prisma.hubungi.findFirst({
    where: { prioritas: true },
    orderBy: { id: "asc" },
  });

  const mediaSosial = await prisma.mediaSosial.findMany({
    orderBy: [{ prioritas: "desc" }, { id: "asc" }],
  });

  const cabangToko = await prisma.cabangToko.findMany({
    orderBy: [{ urutan: "asc" }, { id: "asc" }],
  });

  return { informasiToko, utama, mediaSosial, cabangToko };
}

// ============ Page ============

export default async function HubungiPage() {
  const { informasiToko, utama, mediaSosial, cabangToko } = await getHubungiData();

  const namaToko = informasiToko?.namaToko ?? "Apix Interior";

  // WA Logic
  const nomorWA = utama?.nomor ?? "";
  const waUtamaUrl = nomorWA
    ? buildWaLink(
      nomorWA,
      "Halo, saya tertarik dengan produk dan layanan Apix Interior."
    )
    : "#";

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh", fontFamily: "Inter, sans-serif", paddingTop: "90px" }}>
      <Navbar />

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 24px" }}>

        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: "80px" }}>
          <h1 style={{
            fontSize: "clamp(40px, 5vw, 56px)",
            fontWeight: "800",
            color: "#0f172a",
            marginBottom: "20px",
            letterSpacing: "-0.02em",
            lineHeight: "1.1"
          }}>
            Mari Bicara <br />
            <span style={{ color: "#d97706" }}>Tentang Impianmu.</span>
          </h1>
          <p style={{ fontSize: "18px", color: "#64748b", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
            Konsultasikan kebutuhan interior Anda secara gratis. Tim kami siap membantu mewujudkan ruang idaman Anda.
          </p>
        </header>

        {/* 1. Location / Cabang - Moved to top */}
        {cabangToko.length > 0 && (
          <section style={{ marginBottom: "80px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
              <div style={{ height: "1px", flex: 1, background: "#e2e8f0" }}></div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px" }}>Lokasi Toko</h2>
              <div style={{ height: "1px", flex: 1, background: "#e2e8f0" }}></div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
              {cabangToko.map((cabang: any) => (
                <a
                  key={cabang.id}
                  href={cabang.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: "none", color: "inherit",
                    padding: "24px", borderRadius: "16px", background: "#fff",
                    border: "1px solid #f1f5f9", transition: "all 0.2s",
                    display: "flex", alignItems: "flex-start", gap: "16px"
                  }}
                >
                  <div style={{ color: "#ea580c", marginTop: "2px" }}>
                    <SiGooglemaps size={24} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: "700", fontSize: "16px", color: "#0f172a", marginBottom: "4px" }}>{cabang.namaCabang}</h4>

                    {/* Fake Rating for Demo/Aesthetic */}
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px", fontSize: "14px" }}>
                      <span style={{ fontWeight: "700", color: "#0f172a" }}>5.0</span>
                      <div style={{ display: "flex", color: "#f59e0b" }}>
                        <FaStar size={14} fill="#f59e0b" />
                        <FaStar size={14} fill="#f59e0b" />
                        <FaStar size={14} fill="#f59e0b" />
                        <FaStar size={14} fill="#f59e0b" />
                        <FaStar size={14} fill="#f59e0b" />
                      </div>
                      <span style={{ color: "#64748b" }}>(86)</span>
                    </div>

                    <span style={{ fontSize: "14px", color: "#64748b", textDecoration: "underline" }}>Lihat di Google Maps &rarr;</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "40px", marginBottom: "100px" }}>

          {/* 2. Fast Action: WhatsApp */}
          <div style={{
            background: "#f8fafc",
            borderRadius: "24px",
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "1px solid #e2e8f0"
          }}>
            <div>
              <div style={{ width: 56, height: 56, background: "#dcfce7", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", color: "#16a34a" }}>
                <SiWhatsapp size={28} />
              </div>
              <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", marginBottom: "12px" }}>Chat WhatsApp</h3>
              <p style={{ color: "#64748b", lineHeight: "1.6", marginBottom: "32px" }}>
                Respon tercepat. Diskusikan proyek, tanya harga, atau sekadar konsultasi awal langsung dengan tim ahli kami.
              </p>
            </div>
            {nomorWA ? (
              <a
                href={waUtamaUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block", textAlign: "center", padding: "16px",
                  background: "#16a34a", color: "white", fontWeight: "700",
                  borderRadius: "12px", textDecoration: "none", fontSize: "16px",
                  transition: "transform 0.2s",
                  boxShadow: "0 4px 6px -1px rgba(22, 163, 74, 0.2)"
                }}
              >
                Hubungi via WhatsApp
              </a>
            ) : (
              <div style={{ padding: "16px", background: "#e2e8f0", color: "#64748b", textAlign: "center", borderRadius: "12px", fontSize: "14px" }}>
                Belum tersedia
              </div>
            )}
          </div>

          {/* 3. Social Media List */}
          <div style={{
            background: "#fff",
            borderRadius: "24px",
            padding: "40px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)" // subtle elevation
          }}>
            <div style={{ width: 56, height: 56, background: "#f1f5f9", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", color: "#334155" }}>
              <span style={{ fontSize: "24px" }}>@</span>
            </div>
            <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", marginBottom: "12px" }}>Media Sosial</h3>
            <p style={{ color: "#64748b", lineHeight: "1.6", marginBottom: "32px" }}>
              Ikuti keseharian kami dan dapatkan inspirasi desain terbaru di platform favorit Anda.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {mediaSosial.map((m: any) => {
                const Icon = sosmedIconMap[m.iconKey] ?? null;
                return (
                  <a
                    key={m.id}
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "10px",
                      padding: "10px 20px", borderRadius: "99px",
                      border: "1px solid #e2e8f0", color: "#334155",
                      textDecoration: "none", fontWeight: "600", fontSize: "14px",
                      background: "#fff"
                    }}
                  >
                    {Icon && <Icon />}
                    {m.nama}
                  </a>
                )
              })}
            </div>
          </div>
        </div>


      </main>
      <GlobalFooter />
    </div>
  );
}

