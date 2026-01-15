
import { getPromoConfig } from "./promo-actions";
import PromoSettingsForm from "./PromoSettingsForm";

export const dynamic = "force-dynamic";

export default async function PromoSettingsPage() {
    const config = await getPromoConfig();

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Pengaturan Promo Page</h1>
                <p className="text-gray-600">Atur konten halaman /promo, flash sale timer, dan voucher.</p>
            </div>

            <PromoSettingsForm config={config} />
        </div>
    );
}
