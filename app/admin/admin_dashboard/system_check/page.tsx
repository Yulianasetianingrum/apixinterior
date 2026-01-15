'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminTheme } from '../AdminThemeContext';

export default function SystemCheckPage() {
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { isDarkMode } = useAdminTheme();

    // Fallback if hook fails (e.g. context missing)
    // We can also just use a simple state check if needed, but let's try consistent theme.

    // Actually, explicit import is better.
    // import { useAdminTheme } from "../../AdminThemeContext"; is used in peers.

    useEffect(() => {
        fetch('/api/admin/system_check')
            .then(res => res.json())
            .then(data => setReport(data))
            .catch(err => setReport({ error: err.message }))
            .finally(() => setLoading(false));
    }, []);

    const bg = isDarkMode ? '#020617' : '#ffffff';
    const fg = isDarkMode ? '#e2e8f0' : '#111827';
    const cardBg = isDarkMode ? '#1e293b' : '#f8fafc';
    const cardBorder = isDarkMode ? '#334155' : '#ddd';

    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', background: bg, color: fg, minHeight: '100vh' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>System Health Check</h1>
            <button onClick={() => router.push('/admin/admin_dashboard')} style={{ marginBottom: '20px', padding: '8px 16px', background: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#fff' : '#000', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Back to Dashboard</button>

            {loading && <div>Running diagnostics...</div>}

            {report && !loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* SHARP */}
                    <div style={{ padding: '20px', border: `1px solid ${cardBorder}`, borderRadius: '8px', background: report.sharp?.status === 'ok' ? (isDarkMode ? '#064e3b' : '#f0fdf4') : (isDarkMode ? '#7f1d1d' : '#fef2f2') }}>
                        <h2 style={{ fontWeight: 'bold', marginBottom: '10px' }}>1. Image Processor (Sharp)</h2>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: report.sharp?.status === 'ok' ? (isDarkMode ? '#4ade80' : '#16a34a') : (isDarkMode ? '#f87171' : '#dc2626') }}>
                            {report.sharp?.status?.toUpperCase()}
                        </div>
                        <p style={{ marginTop: '5px' }}>{report.sharp?.message}</p>
                    </div>

                    {/* FILESYSTEM */}
                    <div style={{ padding: '20px', border: `1px solid ${cardBorder}`, borderRadius: '8px', background: report.filesystem?.status === 'ok' ? (isDarkMode ? '#064e3b' : '#f0fdf4') : (isDarkMode ? '#7f1d1d' : '#fef2f2') }}>
                        <h2 style={{ fontWeight: 'bold', marginBottom: '10px' }}>2. Storage (public/uploads)</h2>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: report.filesystem?.status === 'ok' ? (isDarkMode ? '#4ade80' : '#16a34a') : (isDarkMode ? '#f87171' : '#dc2626') }}>
                            {report.filesystem?.status?.toUpperCase()}
                        </div>
                        <p style={{ marginTop: '5px', fontFamily: 'monospace', background: isDarkMode ? '#0f172a' : '#eee', padding: '5px' }}>CWD: {report.cwd}</p>
                        <p style={{ marginTop: '5px', fontFamily: 'monospace', background: isDarkMode ? '#0f172a' : '#eee', padding: '5px' }}>Path: {report.filesystem?.path}</p>
                        <p style={{ marginTop: '5px' }}>{report.filesystem?.message}</p>

                        {report.filesystem?.files && report.filesystem.files.length > 0 && (
                            <div style={{ marginTop: '15px' }}>
                                <b>Recent Files Found in Server Folder:</b>
                                <ul style={{ fontSize: '12px', marginTop: '5px', fontFamily: 'monospace' }}>
                                    {report.filesystem.files.map((f: any) => (
                                        <li key={f.name}>{f.name} ({new Date(f.time).toLocaleString()})</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {report.filesystem?.files && report.filesystem.files.length === 0 && (
                            <p style={{ color: 'orange' }}>Folder exists but EMPTY (No files found).</p>
                        )}
                    </div>

                    <div style={{ marginTop: '20px', padding: '15px', background: cardBg, borderRadius: '8px', border: `1px solid ${cardBorder}` }}>
                        <h3 style={{ fontWeight: 'bold' }}>Recommendation:</h3>
                        <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                            {report.sharp?.status !== 'ok' && (
                                <li style={{ marginBottom: '5px' }}>⚠️ <b>Sharp Missing:</b> Jalankan `npm install --platform=linux --arch=x64 sharp` di VPS. Namun fallback system sudah aktif, jadi upload tetap akan berjalan (tanpa kompresi).</li>
                            )}
                            {report.filesystem?.status !== 'ok' && (
                                <li style={{ marginBottom: '5px', color: isDarkMode ? '#f87171' : 'red' }}>❌ <b>Permission Error:</b> Server tidak bisa menulis gambar. Cek permission folder `public` di VPS (chmod 777 public/uploads).</li>
                            )}
                            {report.sharp?.status === 'ok' && report.filesystem?.status === 'ok' && (
                                <li style={{ marginBottom: '5px', color: isDarkMode ? '#4ade80' : 'green' }}>✅ <b>All Systems Go:</b> Upload harusnya berjalan lancar. Jika masih error, coba clear cache browser.</li>
                            )}
                        </ul>
                    </div>

                </div>
            )}
        </div>
    );
}
