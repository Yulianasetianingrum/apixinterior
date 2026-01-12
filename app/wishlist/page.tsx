
import Navbar from "@/app/navbar/page";
import GlobalFooter from "@/app/components/GlobalFooter";
import WishlistPageClient from "./WishlistPage.client";

export const metadata = {
    title: "Wishlist - Apix Interior",
    description: "Produk yang Anda sukai",
};

export default function WishlistPage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <Navbar />
            <main className="flex-grow pt-8 pb-16 px-4">
                <WishlistPageClient />
            </main>
            <GlobalFooter />
        </div>
    );
}
