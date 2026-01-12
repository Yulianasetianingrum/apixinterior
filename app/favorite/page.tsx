
import Navbar from "@/app/navbar/Navbar";
import FavoritePageClient from "./FavoritePage.client";

export const metadata = {
    title: "Favorite - Apix Interior",
    description: "Produk yang Anda sukai",
};

export default function FavoritePage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <FavoritePageClient />
        </div>
    );
}
