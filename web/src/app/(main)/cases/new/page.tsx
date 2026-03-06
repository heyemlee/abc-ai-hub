'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewCasePage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError('Case title is required');
            return;
        }
        if (!clientName.trim()) {
            setError('Client name is required');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/cases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    clientName: clientName.trim(),
                    clientPhone: clientPhone.trim() || null,
                    clientEmail: clientEmail.trim() || null,
                    description: description.trim() || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to create case');
                setSubmitting(false);
                return;
            }

            const newCase = await res.json();
            router.push(`/cases/${newCase.id}`);
        } catch {
            setError('Network error');
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl">
            <div className="mb-6">
                <button onClick={() => router.push('/cases')} className="flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-black">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15l-5-5 5-5" /></svg>
                    Back to Cases
                </button>
            </div>

            <div className="rounded-xl border border-[#E5E5E5] p-8">
                <h1 className="mb-6 text-lg font-semibold text-black">Create New Case</h1>

                <div className="space-y-5">
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
                    )}

                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                            Case Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-black placeholder-neutral-300 hover:border-neutral-400 focus:border-black focus:outline-none"
                            placeholder="e.g. Kitchen Remodel, Bathroom Vanity"
                        />
                    </div>

                    {/* Client Info Section */}
                    <div className="rounded-lg border border-[#E5E5E5] p-5 space-y-4">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Client Information</p>

                        <div>
                            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                                Client Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-black placeholder-neutral-300 hover:border-neutral-400 focus:border-black focus:outline-none"
                                placeholder="Client's name"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                                    Phone <span className="text-neutral-300">(optional)</span>
                                </label>
                                <input
                                    type="tel"
                                    value={clientPhone}
                                    onChange={(e) => setClientPhone(e.target.value)}
                                    className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-black placeholder-neutral-300 hover:border-neutral-400 focus:border-black focus:outline-none"
                                    placeholder="(000) 000-0000"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                                    Email <span className="text-neutral-300">(optional)</span>
                                </label>
                                <input
                                    type="email"
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                    className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-black placeholder-neutral-300 hover:border-neutral-400 focus:border-black focus:outline-none"
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                            Description <span className="text-neutral-300">(optional)</span>
                        </label>
                        <textarea
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-black placeholder-neutral-300 hover:border-neutral-400 focus:border-black focus:outline-none"
                            placeholder="Project details, scope, materials, style preferences, etc."
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 rounded-lg bg-black px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                        >
                            {submitting ? 'Creating...' : 'Create Case'}
                        </button>
                        <Link href="/cases">
                            <button className="rounded-lg border border-[#E5E5E5] bg-white px-6 py-3 text-sm font-medium text-neutral-600 hover:border-black hover:text-black">
                                Cancel
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
