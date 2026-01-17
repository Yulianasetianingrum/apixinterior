
import Navbar from "@/app/navbar/Navbar";
import CartPageClient from "./CartPage.client";
import { prisma } from "@/lib/prisma";

export const metadata = {
    title: "Keranjang Belanja - Apix Interior",
    description: "Lihat dan checkout produk pilihan Anda",
};

export default async function CartPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <CartPageClient />
        </div>
    );
}
