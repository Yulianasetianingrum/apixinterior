
import Navbar from "@/app/navbar/Navbar";
import CartPageClient from "./CartPage.client";
import { getGlobalShowPrice } from "@/lib/product-price-visibility";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Keranjang Belanja - Apix Interior",
    description: "Lihat dan checkout produk pilihan Anda",
};

export default async function CartPage() {
    const showPrice = await getGlobalShowPrice();

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <CartPageClient showPrice={showPrice} />
        </div>
    );
}
