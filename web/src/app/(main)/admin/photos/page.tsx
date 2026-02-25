'use client';

import { useState, useEffect } from 'react';

interface StaffPhotos {
    name: string;
    count: number;
    photos: Array<{
        id: string;
        storageUrl: string;
        filename: string;
        customerName: string;
        createdAt: string;
    }>;
}

interface PhotosData {
    month: string;
    staff: StaffPhotos[];
}

export default function PhotoManagementPage() {
    const [data, setData] = useState<PhotosData | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('/api/admin/photos')
            .then((r) => r.json())
            .then((res) => {
                setData(res);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const res = await fetch('/api/admin/photos/download', { method: 'POST' });
            if (!res.ok) {
                const err = await res.json();
                setMessage(err.error || 'Download failed');
                setDownloading(false);
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `photos_${data?.month?.replace('-', '_')}.zip`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            setMessage('Download failed');
        }
        setDownloading(false);
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch('/api/admin/photos', { method: 'DELETE' });
            const result = await res.json();
            setMessage(`Deleted ${result.deletedCount} photos successfully.`);
            setData({ ...data!, staff: [] });
            setShowDeleteConfirm(false);
        } catch {
            setMessage('Delete failed');
        }
        setDeleting(false);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">Loading...</div>;
    }

    const totalPhotos = data?.staff?.reduce((sum, s) => sum + s.count, 0) || 0;
    const staffList = data?.staff || [];
    const activeStaff = staffList[activeTab];

    const monthLabel = data?.month
        ? new Date(data.month + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' })
        : '';

    return (
        <div className="space-y-6">
            {/* Warning Banner */}
            {totalPhotos > 0 && (
                <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
                    <p className="text-sm text-neutral-700">
                        ⚠️ {monthLabel} photos are pending review. Please download and confirm deletion.
                    </p>
                </div>
            )}

            {message && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <p className="text-sm text-green-700">{message}</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
                <button
                    onClick={handleDownload}
                    disabled={downloading || totalPhotos === 0}
                    className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    {downloading ? 'Downloading...' : `Download All (${totalPhotos} photos)`}
                </button>
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={totalPhotos === 0}
                    className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-500 hover:border-red-400 hover:text-red-600 disabled:opacity-50"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Delete All {monthLabel} Photos
                </button>
            </div>

            {/* Delete confirmation dialog */}
            {showDeleteConfirm && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                    <p className="mb-4 text-sm text-red-700">
                        Are you sure you want to delete all <strong>{totalPhotos}</strong> photos from {monthLabel}?
                        This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                        >
                            {deleting ? 'Deleting...' : 'Yes, Delete All'}
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="rounded-lg border border-[#E5E5E5] px-4 py-2 text-sm font-medium text-neutral-600 hover:border-black hover:text-black"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Staff Tabs */}
            {staffList.length > 0 && (
                <>
                    <div className="flex gap-1 rounded-xl bg-[#F5F5F5] p-1">
                        {staffList.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveTab(i)}
                                className={`flex-1 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${activeTab === i
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-neutral-400 hover:text-neutral-600'
                                    }`}
                            >
                                {s.name} ({s.count})
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {activeStaff?.photos.map((photo) => (
                            <div key={photo.id} className="group overflow-hidden rounded-xl border border-[#E5E5E5] bg-white transition-all hover:shadow-md">
                                <div className="aspect-square">
                                    <img src={photo.storageUrl} alt={photo.filename} className="h-full w-full object-cover" />
                                </div>
                                <div className="p-3">
                                    <p className="truncate text-[12px] font-medium text-black">{photo.customerName}</p>
                                    <p className="mt-0.5 text-[11px] text-neutral-400">{new Date(photo.createdAt).toLocaleDateString('en-US')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {staffList.length === 0 && !loading && (
                <div className="flex h-[240px] items-center justify-center rounded-xl border-2 border-dashed border-[#E5E5E5]">
                    <p className="text-sm text-neutral-400">No photos for {monthLabel || 'this period'}</p>
                </div>
            )}
        </div>
    );
}
