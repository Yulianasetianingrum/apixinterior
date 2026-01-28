import type { Metadata } from "next";
import "./globals.css";
import "./theme.css";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import PageViewTracker from "./components/analytics/PageViewTracker.client";

// Use system font stack to avoid Google Font download issues during Docker build
const inter = {
  className: "",
  variable: "",
};

export const metadata: Metadata = {
  title: {
    default: "Apix Interior - Ahlinya Desain Interior & Furniture Custom Terbaik",
    template: "%s | Apix Interior - Interior & Furniture"
  },
  description: "Apix Interior: Jasa Desain Interior & Furniture Custom No. 1. Spesialis Kitchen Set, Lemari, Renovasi Rumah & Dekorasi Interior Modern di Jabodetabek.",
  keywords: [
    // PRIMARY KEYWORDS (User Request - High Priority)
    "interior", "jasa interior", "desain interior", "interior design",
    "furniture", "furniture custom", "toko furniture", "mebel",
    "dekorasi rumah", "home decor", "aksesoris rumah",
    "desain rumah", "jasa desain rumah", "renovasi rumah",

    // LOCATION BASED (High Intent)
    "jasa interior jakarta", "interior design jakarta", "furniture jakarta",
    "custom furniture tangerang", "kurasi interior", "kontraktor interior",

    // PRODUCT SPECIFIC
    "kitchen set custom", "lemari pakaian custom", "meja makan mewah",
    "sofa minimalis", "backdrop tv", "partisi ruangan",

    // BRANDING
    "apix interior", "apix furniture", "tukang furniture profesional"
  ],
  authors: [{ name: "Apix Interior", url: "https://apixinterior.com" }],
  creator: "Apix Interior",
  publisher: "Apix Interior",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://apixinterior.com"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/logo/logo_apixinterior_golden.png.png", type: "image/png" },
      { url: "/logo/logo_apixinterior_biru.png.png", sizes: "192x192", type: "image/png" },
      { url: "/logo/logo_apixinterior_biru.png.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/logo/logo_apixinterior_golden.png.png", sizes: "180x180", type: "image/png" }
    ],
    shortcut: "/logo/logo_apixinterior_golden.png.png"
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://apixinterior.com",
    siteName: "Apix Interior",
    title: "Apix Interior - Jasa Desain Interior & Furniture Custom Terbaik",
    description: "Wujudkan rumah impian dengan Jasa Desain Interior & Furniture Custom terbaik. Kualitas premium, harga kompetitif, dan hasil memuaskan.",
    images: [
      {
        url: "/logo/logo_apixinterior_golden.png.png",
        width: 1200,
        height: 630,
        alt: "Apix Interior - Jasa Desain Interior & Furniture",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Apix Interior - Jasa Desain Interior & Furniture Custom",
    description: "Jasa Desain Interior & Furniture Custom No. 1. Spesialis Kitchen Set, Lemari, & Dekorasi Rumah Modern.",
    images: ["/logo/logo_apixinterior_golden.png.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

import { prisma } from "@/lib/prisma";
import { SettingsProvider } from "./context/SettingsContext";

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch priority WhatsApp number
  // Fetch priority WhatsApp number
  // EXPLICIT FILTER: Ignore known dummy number '81234567890'
  // Fetch ALL candidate numbers
  const allWaItems = await prisma.hubungi.findMany({
    orderBy: [{ prioritas: "desc" }, { id: "asc" }]
  });

  // Helper: Strip non-digits
  const clean = (s: string) => s.replace(/[^\d]/g, "");

  // Filter out ghost number "081234567890" or "6281234567890" regardless of formatting
  const validWaItems = allWaItems.filter(item => {
    const c = clean(item.nomor);
    return !c.includes("81234567890");
  });

  // Pick priority if exists (already sorted by desc prioritas, so first valid is best candidate)
  const waNumber = validWaItems[0]?.nomor ?? "";

  return (
    <html lang="id" className={inter.variable}>
      <head>
        <link rel="icon" href="/logo/logo_apixinterior_golden.png.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo/logo_apixinterior_golden.png.png" type="image/png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Apix Interior",
              "url": "https://apixinterior.com",
              "logo": "https://apixinterior.com/logo/logo_apixinterior_golden.png.png",
              "image": "https://apixinterior.com/logo/logo_apixinterior_golden.png.png",
              "description": "Jasa Desain Interior & Furniture Custom No. 1. Spesialis Kitchen Set, Lemari, Renovasi Rumah & Dekorasi Interior Modern di Jabodetabek.",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Jakarta",
                "addressRegion": "DKI Jakarta",
                "addressCountry": "ID"
              },
              "sameAs": [
                "https://www.facebook.com/apixinterior",
                "https://www.instagram.com/apixinterior"
              ]
            })
          }}
        />
      </head>
      <body className={`bg-white ${inter.className}`}>
        <SettingsProvider waNumber={waNumber}>
          <CartProvider>
            <WishlistProvider>
              <PageViewTracker />
              {children}
            </WishlistProvider>
          </CartProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
