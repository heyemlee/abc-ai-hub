'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { KBFile } from '@/lib/types';

const categories = [
    { key: 'case-photos', label: 'Case Photos', icon: '📸' },
    { key: 'onboarding', label: 'Onboarding', icon: '📋' },
    { key: 'catalogs', label: 'Catalogs', icon: '📙' },
    { key: 'training', label: 'Training', icon: '🎓' },
    { key: 'policies', label: 'Policies', icon: '📝' },
];

function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function KnowledgePage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'ADMIN';

    const [activeCategory, setActiveCategory] = useState('case-photos');
    const [photoTab, setPhotoTab] = useState<'cases' | 'showroom'>('cases');
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [files, setFiles] = useState<KBFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [lightboxFile, setLightboxFile] = useState<KBFile | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const isCasePhotos = activeCategory === 'case-photos';

    const fetchFiles = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams({ category: activeCategory });
        if (isCasePhotos) params.set('subCategory', photoTab);
        fetch(`/api/kb/files?${params}`)
            .then((r) => r.json())
            .then((data) => { setFiles(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [activeCategory, isCasePhotos, photoTab]);

    useEffect(() => { fetchFiles(); }, [fetchFiles]);

    const filtered = files.filter((f) => {
        if (!search) return true;
        return f.name.toLowerCase().includes(search.toLowerCase());
    });

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);

        for (const file of Array.from(e.target.files)) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', activeCategory);
            if (isCasePhotos) formData.append('subCategory', photoTab);
            await fetch('/api/kb/files', { method: 'POST', body: formData });
        }

        fetchFiles();
        setUploading(false);
        e.target.value = '';
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this file?')) return;
        await fetch(`/api/kb/files/${id}`, { method: 'DELETE' });
        fetchFiles();
    };

    return (
        <div className="space-y-6">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                    <button
                        key={cat.key}
                        onClick={() => { setActiveCategory(cat.key); setSearch(''); }}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-[13px] font-medium transition-all ${activeCategory === cat.key
                            ? 'border-black bg-black text-white'
                            : 'border-[#E5E5E5] bg-white text-neutral-600 hover:border-black hover:text-black'
                            }`}
                    >
                        <span>{cat.icon}</span> {cat.label}
                    </button>
                ))}
            </div>

            {/* Case Photo Sub-tabs */}
            {isCasePhotos && (
                <div className="flex gap-1 rounded-lg bg-[#F5F5F5] p-1 w-fit">
                    <button
                        onClick={() => setPhotoTab('cases')}
                        className={`rounded-md px-4 py-1.5 text-[12px] font-medium transition-all ${photoTab === 'cases' ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                        📁 Cases
                    </button>
                    <button
                        onClick={() => setPhotoTab('showroom')}
                        className={`rounded-md px-4 py-1.5 text-[12px] font-medium transition-all ${photoTab === 'showroom' ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                        🏠 Showroom
                    </button>
                </div>
            )}

            {/* Search & Actions */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search files..."
                        className="w-full rounded-lg border border-[#E5E5E5] bg-white py-2 pl-10 pr-4 text-sm text-black placeholder-neutral-400 focus:border-black focus:outline-none"
                    />
                </div>
                <div className="flex gap-1 rounded-lg border border-[#E5E5E5] p-0.5">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`rounded-md p-1.5 ${viewMode === 'grid' ? 'bg-black text-white' : 'text-neutral-400'}`}
                    >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1 1h6v6H1V1zm8 0h6v6H9V1zM1 9h6v6H1V9zm8 0h6v6H9V9z" /></svg>
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`rounded-md p-1.5 ${viewMode === 'list' ? 'bg-black text-white' : 'text-neutral-400'}`}
                    >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M2 4h12v1H2V4zm0 4h12v1H2V8zm0 4h12v1H2v-1z" /></svg>
                    </button>
                </div>
                {isAdmin && (
                    <>
                        <input ref={fileInputRef} type="file" accept={isCasePhotos ? 'image/*' : '.pdf,image/*'} multiple className="hidden" onChange={handleUpload} />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </>
                )}
            </div>

            {/* Files */}
            {loading ? (
                <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">Loading...</div>
            ) : filtered.length === 0 ? (
                <div className="flex h-[240px] items-center justify-center rounded-xl border-2 border-dashed border-[#E5E5E5]">
                    <p className="text-sm text-neutral-400">No files found</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {filtered.map((file) => (
                        <div
                            key={file.id}
                            className="group overflow-hidden rounded-xl border border-[#E5E5E5] bg-white transition-all hover:shadow-md"
                        >
                            <div
                                className="aspect-square cursor-pointer"
                                onClick={() => file.type === 'image' ? setLightboxFile(file) : window.open(`/api/kb/files/${file.id}/download`, '_blank')}
                            >
                                {file.type === 'image' ? (
                                    <img src={file.storageUrl} alt={file.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full items-center justify-center bg-[#FAFAFA]">
                                        <span className="text-3xl">📄</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                <p className="truncate text-[12px] font-medium text-black">{file.name}</p>
                                <div className="mt-1 flex items-center justify-between">
                                    <p className="text-[11px] text-neutral-400">{formatSize(file.sizeBytes)}</p>
                                    {isAdmin && (
                                        <button onClick={() => handleDelete(file.id)} className="text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-[#E5E5E5]">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#FAFAFA]">
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Name</th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Type</th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Size</th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Uploaded</th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((file) => (
                                <tr key={file.id} className="border-t border-[#E5E5E5] hover:bg-[#FAFAFA]">
                                    <td className="px-6 py-3 text-sm">
                                        <button
                                            onClick={() => file.type === 'image' ? setLightboxFile(file) : window.open(`/api/kb/files/${file.id}/download`, '_blank')}
                                            className="flex items-center gap-2 text-black hover:underline"
                                        >
                                            <span>{file.type === 'image' ? '🖼️' : '📄'}</span>
                                            {file.name}
                                        </button>
                                    </td>
                                    <td className="px-6 py-3 text-[12px] text-neutral-500 uppercase">{file.type}</td>
                                    <td className="px-6 py-3 text-[12px] text-neutral-500">{formatSize(file.sizeBytes)}</td>
                                    <td className="px-6 py-3 text-[12px] text-neutral-500">{new Date(file.uploadedAt).toLocaleDateString('en-US')}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex gap-2">
                                            <a href={`/api/kb/files/${file.id}/download`} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-black">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                </svg>
                                            </a>
                                            {isAdmin && (
                                                <button onClick={() => handleDelete(file.id)} className="text-neutral-400 hover:text-red-500">
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Lightbox */}
            {lightboxFile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setLightboxFile(null)}>
                    <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
                        <img src={lightboxFile.storageUrl} alt={lightboxFile.name} className="max-h-[85vh] rounded-lg object-contain" />
                        <button
                            onClick={() => setLightboxFile(null)}
                            className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-lg hover:bg-neutral-100"
                        >
                            ✕
                        </button>
                        <div className="mt-3 text-center">
                            <p className="text-sm font-medium text-white">{lightboxFile.name}</p>
                            <p className="text-[12px] text-neutral-400 mt-0.5">{formatSize(lightboxFile.sizeBytes)}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
