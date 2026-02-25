'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Customer, SOURCE_LABELS, STATUS_LABELS, SourceEnum, StatusEnum } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import Select from '@/components/Select';

const statusOptions = Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }));

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch(`/api/customers/${params.id}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.error) {
                    router.push('/customers');
                    return;
                }
                setCustomer(data);
                setStatus(data.status);
                setLoading(false);
            })
            .catch(() => router.push('/customers'));
    }, [params.id, router]);

    const handleStatusChange = async (newStatus: string) => {
        setStatus(newStatus);
        await fetch(`/api/customers/${params.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);

        for (const file of Array.from(e.target.files)) {
            const formData = new FormData();
            formData.append('file', file);
            await fetch(`/api/customers/${params.id}/photos`, {
                method: 'POST',
                body: formData,
            });
        }

        // Refresh customer data
        const res = await fetch(`/api/customers/${params.id}`);
        const data = await res.json();
        setCustomer(data);
        setUploading(false);
        e.target.value = '';
    };

    if (loading || !customer) {
        return <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-black">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15l-5-5 5-5" /></svg>
                Back to Customers
            </button>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <div className="rounded-xl border border-[#E5E5E5] p-8">
                        <div className="space-y-5">
                            <div>
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Name</p>
                                <p className="text-lg font-semibold text-black">{customer.name}</p>
                            </div>
                            <div>
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Source</p>
                                <p className="text-sm text-neutral-700">{SOURCE_LABELS[customer.source as SourceEnum] || customer.source}</p>
                            </div>
                            <div>
                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Status</p>
                                <div className="flex items-center gap-3">
                                    <StatusBadge status={status.toLowerCase() as 'interested' | 'following_up' | 'quoted' | 'closed_won' | 'lost'} />
                                    <Select options={statusOptions} value={status} onChange={handleStatusChange} />
                                </div>
                            </div>
                            <div>
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Phone</p>
                                <p className="text-sm text-neutral-700">{customer.phone || '—'}</p>
                            </div>
                            <div>
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Email</p>
                                <p className="text-sm text-neutral-700">{customer.email || '—'}</p>
                            </div>
                            <div>
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Notes</p>
                                <p className="text-sm leading-relaxed text-neutral-600">{customer.notes || '—'}</p>
                            </div>
                            <div>
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Created By</p>
                                <p className="text-sm text-neutral-700">{customer.user?.name} on {new Date(customer.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="rounded-xl border border-[#E5E5E5] p-8">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Screenshots & Photos</p>
                        <div className="grid grid-cols-3 gap-3">
                            {customer.photos?.map((photo) => (
                                <div key={photo.id} className="group relative flex aspect-square cursor-pointer items-center justify-center rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] overflow-hidden transition-colors hover:border-black">
                                    <img src={photo.storageUrl} alt={photo.filename} className="h-full w-full object-cover" />
                                </div>
                            ))}
                            {(!customer.photos || customer.photos.length === 0) && (
                                <div className="col-span-3 py-8 text-center text-[12px] text-neutral-300">No photos yet</div>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="mt-4 w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-2 text-sm font-medium text-neutral-600 hover:border-black hover:text-black disabled:opacity-50"
                        >
                            {uploading ? 'Uploading...' : 'Upload More Photos'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
