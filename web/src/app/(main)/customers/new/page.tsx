'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Select from '@/components/Select';
import { SOURCE_LABELS, STATUS_LABELS, SourceEnum } from '@/lib/types';

const sourceOptions = [
    { value: '', label: 'Select source' },
    ...Object.entries(SOURCE_LABELS).map(([k, v]) => ({ value: k, label: v })),
];

const statusOptions = Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }));

export default function NewCustomerPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [source, setSource] = useState('');
    const [status, setStatus] = useState('INTERESTED');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');
    const [photos, setPhotos] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async () => {
        if (!name.trim() || !source) {
            setError('Name and source are required');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, source, status, phone, email, notes }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to create customer');
                setSubmitting(false);
                return;
            }

            const customer = await res.json();

            // Upload photos if any
            for (const photo of photos) {
                const formData = new FormData();
                formData.append('file', photo);
                await fetch(`/api/customers/${customer.id}/photos`, {
                    method: 'POST',
                    body: formData,
                });
            }

            router.push('/customers');
        } catch {
            setError('Network error');
            setSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPhotos((prev) => [...prev, ...Array.from(e.target.files!)]);
            e.target.value = '';
        }
    };

    return (
        <div className="mx-auto max-w-2xl">
            <div className="rounded-xl border border-[#E5E5E5] p-8">
                <div className="space-y-5">
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
                    )}
                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Customer Name <span className="text-red-500">*</span></label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-black placeholder-neutral-300 hover:border-neutral-400 focus:border-black focus:outline-none" placeholder="Enter customer name" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Source <span className="text-red-500">*</span></label>
                        <Select options={sourceOptions} value={source} onChange={setSource} placeholder="Select source" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Status</label>
                        <Select options={statusOptions} value={status} onChange={setStatus} />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Phone</label>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-black placeholder-neutral-300 hover:border-neutral-400 focus:border-black focus:outline-none" placeholder="(000) 000-0000" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-black placeholder-neutral-300 hover:border-neutral-400 focus:border-black focus:outline-none" placeholder="email@example.com" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Notes</label>
                        <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-black placeholder-neutral-300 hover:border-neutral-400 focus:border-black focus:outline-none" placeholder="Budget, style preference, measurements, etc." />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Photos / Screenshots</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5E5E5] p-8 transition-colors hover:border-black"
                        >
                            <svg className="mb-3 h-8 w-8 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="mb-1 text-sm text-neutral-500">Drop images here or click to upload</p>
                            <p className="text-[11px] text-neutral-400">JPG, PNG, HEIC up to 10MB each</p>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                        {photos.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {photos.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[12px] text-neutral-500">
                                        <span>📷</span>
                                        <span className="flex-1 truncate">{f.name}</span>
                                        <button onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                        <button onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-lg bg-black px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50">
                            {submitting ? 'Saving...' : 'Save Customer'}
                        </button>
                        <Link href="/customers">
                            <button className="rounded-lg border border-[#E5E5E5] bg-white px-6 py-3 text-sm font-medium text-neutral-600 hover:border-black hover:text-black">Cancel</button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
