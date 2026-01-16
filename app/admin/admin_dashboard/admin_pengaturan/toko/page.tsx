import Link from "next/link";
import { redirect } from "next/navigation";

// Since we don't have the full TokoSettingsForm, we'll provide a landing page
// that directs the user to the Visual Preview/Editor which we know exists.

export default function TokoSettingsPage() {
    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Atur Toko (Homepage)</h1>
                <p className="text-gray-600">Kelola tampilan halaman utama website Anda.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition">
                    <h3 className="text-xl font-semibold mb-3">Visual Editor (Preview)</h3>
                    <p className="text-gray-500 mb-6">
                        Lihat dan edit tampilan homepage secara visual. Anda dapat mengatur urutan section,
                        memilih tema, dan mempublikasikan perubahan.
                    </p>
                    <Link
                        href="/admin/admin_dashboard/admin_pengaturan/toko/preview"
                        className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                        Buka Visual Editor &rarr;
                    </Link>
                </div>

                <div className="border rounded-xl p-6 bg-gray-50 border-dashed">
                    <h3 className="text-xl font-semibold mb-3 text-gray-400">Pengaturan Lanjutan</h3>
                    <p className="text-gray-400 mb-4">
                        Fitur pengaturan lanjutan (kode manual, reset, dll) sedang dalam pengembangan atau pemeliharaan.
                    </p>
                    <button disabled className="px-4 py-2 bg-gray-200 text-gray-400 rounded-lg cursor-not-allowed">
                        Segera Hadir
                    </button>
                </div>
            </div>
        </div>
    );
}
