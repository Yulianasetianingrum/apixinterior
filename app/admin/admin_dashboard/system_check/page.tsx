'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SystemCheckPage() {
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/system_check')
            .then(res => res.json())
            .then(data => setReport(data))
            .catch(err => setReport({ error: err.message }))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>System Health Check</h1>
            <button onClick={() => router.push('/admin/admin_dashboard')} style={{ marginBottom: '20px', padding: '8px 16px', background: '#e2e8f0', borderRadius: '4px' }}>Back to Dashboard</button>

            {loading && <div>Running diagnostics...</div>}

            {report && !loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* SHARP */}
                    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', background: report.sharp?.status === 'ok' ? '#f0fdf4' : '#fef2f2' }}>
                        <h2 style={{ fontWeight: 'bold', marginBottom: '10px' }}>1. Image Processor (Sharp)</h2>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: report.sharp?.status === 'ok' ? '#16a34a' : '#dc2626' }}>
                            {report.sharp?.status?.toUpperCase()}
                        </div>
                        <p style={{ marginTop: '5px' }}>{report.sharp?.message}</p>
                    </div>

                    {/* FILESYSTEM */}
                    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', background: report.filesystem?.status === 'ok' ? '#f0fdf4' : '#fef2f2' }}>
                        <h2 style={{ fontWeight: 'bold', marginBottom: '10px' }}>2. Storage Permission (public/uploads)</h2>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: report.filesystem?.status === 'ok' ? '#16a34a' : '#dc2626' }}>
                            {report.filesystem?.status?.toUpperCase()}
                        </div>
                        <p style={{ marginTop: '5px' }}>Path: {report.filesystem?.path}</p>
                        <p style={{ marginTop: '5px' }}>{report.filesystem?.message}</p>
                    </div>

                    <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                        <h3 style={{ fontWeight: 'bold' }}>Recommendation:</h3>
                        <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                            {report.sharp?.status !== 'ok' && (
                                <li style={{ marginBottom: '5px' }}>⚠️ <b>Sharp Missing:</b> Jalankan `npm install --platform=linux --arch=x64 sharp` di VPS. Namun fallback system sudah aktif, jadi upload tetap akan berjalan (tanpa kompresi).</li>
                            )}
                            {report.filesystem?.status !== 'ok' && (
                                <li style={{ marginBottom: '5px', color: 'red' }}>❌ <b>Permission Error:</b> Server tidak bisa menulis gambar. Cek permission folder `public` di VPS (chmod 777 public/uploads).</li>
                            )}
                            {report.sharp?.status === 'ok' && report.filesystem?.status === 'ok' && (
                                <li style={{ marginBottom: '5px', color: 'green' }}>✅ <b>All Systems Go:</b> Upload harusnya berjalan lancar. Jika masih error, coba clear cache browser.</li>
                            )}
                        </ul>
                    </div>

                </div>
            )}
        </div>
    );
}
