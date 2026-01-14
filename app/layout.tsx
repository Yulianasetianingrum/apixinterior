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
    default: "Apix Interior - Jasa Interior, Furniture, Mebel & Dekorasi Rumah Terbaik",
    template: "%s | Apix Interior - Ahlinya Mebel & Dekorasi"
  },
  description: "Apix Interior menyediakan furniture berkualitas, mebel custom, dan jasa desain interior profesional untuk rumah, kantor, hotel, dan bangunan komersial. Melayani area Jabodetabek dengan harga terjangkau dan kualitas terbaik.",
  keywords: [
    // Priority Keywords (User Request)
    "interior", "furniture", "mebel", "dekorasi rumah", "tukang", "tukang furniture",
    "jasa interior", "jasa mebel", "jasa tukang", "dekorasi rumah mewah",
    // Secondary & Long-tail
    "furniture jakarta", "mebel jakarta", "furniture custom", "kitchen set custom",
    "lemari custom", "meja makan", "sofa minimalis", "design interior",
    "kontraktor interior", "tukang kayu profesional", "apix interior", "apix furniture"
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
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://apixinterior.com",
    siteName: "Apix Interior",
    title: "Apix Interior - Furniture, Mebel, & Desain Interior Terbaik",
    description: "Furniture berkualitas, mebel custom, dan jasa desain interior profesional untuk rumah, kantor, hotel. Melayani Jabodetabek.",
    images: [
      {
        url: "/logo/logo_apixinterior_biru.png.png",
        width: 1200,
        height: 630,
        alt: "Apix Interior - Furniture & Desain Interior",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Apix Interior - Furniture, Mebel, & Desain Interior",
    description: "Furniture berkualitas, mebel custom, dan jasa desain interior profesional. Melayani Jabodetabek.",
    images: ["/logo/logo_apixinterior_biru.png.png"],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body className={`bg-white ${inter.className}`}>
        <CartProvider>
          <WishlistProvider>
            <PageViewTracker />
            {children}
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
