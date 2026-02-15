
import Navbar from "@/app/navbar/Navbar";
import FavoritePageClient from "./FavoritePage.client";
import { getGlobalShowPrice } from "@/lib/product-price-visibility";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Favorite - Apix Interior",
    description: "Produk yang Anda sukai",
};

export default async function FavoritePage() {
    const showPrice = await getGlobalShowPrice();

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <FavoritePageClient showPrice={showPrice} />
        </div>
    );
}
