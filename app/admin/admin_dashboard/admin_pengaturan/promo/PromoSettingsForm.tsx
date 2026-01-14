"use client";

import { useState } from "react";
import { savePromoConfig } from "./promo-actions";

type Voucher = {
    code: string;
    value: string;
    label: string;
    min: string;
};

export default function PromoSettingsForm({ config }: { config: any }) {
    const [vouchers, setVouchers] = useState<Voucher[]>(
        Array.isArray(config.vouchers) ? config.vouchers : []
    );

    const addVoucher = () => {
        setVouchers([...vouchers, { code: "", value: "", label: "", min: "" }]);
    };

    const removeVoucher = (index: number) => {
        setVouchers(vouchers.filter((_, i) => i !== index));
    };

    const updateVoucher = (index: number, field: keyof Voucher, val: string) => {
        const newList = [...vouchers];
        newList[index] = { ...newList[index], [field]: val };
        setVouchers(newList);
    };

    // Convert flashSaleEnd to string (datetime-local format: YYYY-MM-DDTHH:mm)
    const defaultDate = config.flashSaleEnd
        ? new Date(config.flashSaleEnd).toISOString().slice(0, 16)
        : "";

    return (
        <form action={savePromoConfig} className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="space-y-6">
                {/* --- HERO SECTION --- */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Hero & Flash Sale</h3>
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Hero (Headline)</label>
                            <input
                                name="heroTitle"
                                defaultValue={config.heroTitle}
                                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ex: Luxury Flash Sale"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sub-judul</label>
                            <textarea
                                name="heroSubtitle"
                                defaultValue={config.heroSubtitle ?? ""}
                                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                rows={2}
                                placeholder="Ex: Kesempatan eksklusif..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Berakhir Flash Sale</label>
                            <input
                                type="datetime-local"
                                name="flashSaleEnd"
                                defaultValue={defaultDate}
                                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none max-w-xs"
                            />
                            <p className="text-xs text-gray-500 mt-1">Kosongkan jika tidak ada hitung mundur.</p>
                        </div>
                    </div>
                </div>

                {/* --- VOUCHERS SECTION --- */}
                <div>
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="text-lg font-bold text-gray-800">Daftar Voucher</h3>
                        <button
                            type="button"
                            onClick={addVoucher}
                            className="px-3 py-1 bg-green-50 text-green-700 rounded-md text-sm font-semibold hover:bg-green-100"
                        >
                            + Tambah Voucher
                        </button>
                    </div>

                    <input type="hidden" name="vouchers" value={JSON.stringify(vouchers)} />

                    <div className="grid gap-4">
                        {vouchers.map((v, i) => (
                            <div key={i} className="flex gap-2 items-start p-3 bg-gray-50 rounded-md border text-sm">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-grow">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Kode Voucher</div>
                                        <input
                                            value={v.code}
                                            onChange={(e) => updateVoucher(i, "code", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                            placeholder="CODE123"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Nilai (Diskon)</div>
                                        <input
                                            value={v.value}
                                            onChange={(e) => updateVoucher(i, "value", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                            placeholder="10% / 50rb"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Label Utama</div>
                                        <input
                                            value={v.label}
                                            onChange={(e) => updateVoucher(i, "label", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                            placeholder="Diskon Member"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Syarat (Min)</div>
                                        <input
                                            value={v.min}
                                            onChange={(e) => updateVoucher(i, "min", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                            placeholder="Min 200rb"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeVoucher(i)}
                                    className="mt-5 text-red-500 hover:text-red-700 px-2 font-bold"
                                    title="Hapus"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        {vouchers.length === 0 && (
                            <p className="text-center text-gray-400 italic text-sm py-4">Belum ada voucher. Tambahkan sekarang!</p>
                        )}
                    </div>
                </div>

                {/* --- SUBMIT --- */}
                <div className="pt-4 border-t flex justify-end">
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 transition shadow-sm">
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </form>
    );
}
