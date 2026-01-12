
import Navbar from "@/app/navbar/page";
import CartPageClient from "./CartPage.client";
import { prisma } from "@/lib/prisma";

export const metadata = {
    title: "Keranjang Belanja - Apix Interior",
    description: "Lihat dan checkout produk pilihan Anda",
};

export default async function CartPage() {
    // Fetch primary WhatsApp number from database
    const hubungi = await prisma.hubungi.findFirst({
        orderBy: { prioritas: 'desc' }
    });

    const waNumber = hubungi?.nomor || "628123456789"; // fallback

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <CartPageClient waNumber={waNumber} />
        </div>
    );
}
