'use client';

import { useState } from 'react';
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
    const [status, setStatus] = useState('ASKING_QUOTE');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');
    const [otherSource, setOtherSource] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!name.trim() || !source) {
            setError('Name and source are required');
            return;
        }

        if (source === 'OTHER' && !otherSource.trim()) {
            setError('Please specify the source');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name, source, status, phone, email,
                    notes: source === 'OTHER' && otherSource.trim()
                        ? `[Source: ${otherSource.trim()}] ${notes}`.trim()
                        : notes,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to create customer');
                setSubmitting(false);
                return;
            }

            router.push('/customers');
        } catch {
            setError('Network error');
            setSubmitting(false);
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
                        <Select options={sourceOptions} value={source} onChange={(v) => { setSource(v); if (v !== 'OTHER') setOtherSource(''); }} placeholder="Select source" />
                        {source === 'OTHER' && (
                            <input
                                type="text"
                                value={otherSource}
                                onChange={(e) => setOtherSource(e.target.value)}
                                className="mt-2 w-full rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2.5 text-sm text-black placeholder-neutral-400 focus:border-yellow-500 focus:outline-none"
                                placeholder="Please specify the source *"
                            />
                        )}
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
