'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Customer, SOURCE_LABELS, STATUS_LABELS, SourceEnum, StatusEnum, StatusHistoryItem } from '@/lib/types';
import StatusBadge, { BadgeStatus } from '@/components/StatusBadge';
import Select from '@/components/Select';

const statusOptions = Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }));

const sourceOptions = [
    { value: '', label: 'Select source' },
    ...Object.entries(SOURCE_LABELS).map(([k, v]) => ({ value: k, label: v })),
];

// Define the canonical flow order for the progress tracker
const STATUS_FLOW: StatusEnum[] = ['ASKING_QUOTE', 'DRAWING', 'IN_PROGRESS', 'ORDERED'];

function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        ASKING_QUOTE: '#F59E0B',
        DRAWING: '#3B82F6',
        IN_PROGRESS: '#10B981',
        KEEP_CONTACT: '#8B5CF6',
        ON_HOLD: '#EF4444',
        ORDERED: '#171717',
        OTHERS: '#6B7280',
    };
    return colors[status] || '#A3A3A3';
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [uploading, setUploading] = useState(false);
    const [statusNote, setStatusNote] = useState('');
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [pendingStatus, setPendingStatus] = useState('');
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Inline editing state
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editSource, setEditSource] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [saving, setSaving] = useState(false);

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

    const startEditing = () => {
        if (!customer) return;
        setEditName(customer.name);
        setEditSource(customer.source);
        setEditPhone(customer.phone || '');
        setEditEmail(customer.email || '');
        setEditNotes(customer.notes || '');
        setEditing(true);
    };

    const cancelEditing = () => {
        setEditing(false);
    };

    const saveEditing = async () => {
        if (!editName.trim() || !editSource) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/customers/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName.trim(),
                    source: editSource,
                    phone: editPhone.trim() || null,
                    email: editEmail.trim() || null,
                    notes: editNotes.trim() || null,
                }),
            });
            const data = await res.json();
            setCustomer(data);
            setEditing(false);
        } catch { /* ignore */ }
        setSaving(false);
    };

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === status) return;
        setPendingStatus(newStatus);
        setShowNoteInput(true);
    };

    const confirmStatusChange = async () => {
        const newStatus = pendingStatus;
        setStatus(newStatus);
        setShowNoteInput(false);

        const res = await fetch(`/api/customers/${params.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, statusNote: statusNote.trim() || null }),
        });
        const data = await res.json();
        setCustomer(data);
        setStatusNote('');
        setPendingStatus('');
    };

    const cancelStatusChange = () => {
        setShowNoteInput(false);
        setPendingStatus('');
        setStatusNote('');
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

        const res = await fetch(`/api/customers/${params.id}`);
        const data = await res.json();
        setCustomer(data);
        setUploading(false);
        e.target.value = '';
    };

    if (loading || !customer) {
        return <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">Loading...</div>;
    }

    // Determine which flow step the current status is at
    const currentFlowIndex = STATUS_FLOW.indexOf(customer.status as StatusEnum);
    const history = customer.statusHistory || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button onClick={() => router.push('/customers')} className="flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-black">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15l-5-5 5-5" /></svg>
                    Back to Customers
                </button>
            </div>

            {/* Customer Name & Current Status */}
            <div className="rounded-xl border border-[#E5E5E5] p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-black">{customer.name}</h1>
                        <p className="mt-1 text-sm text-neutral-500">
                            {SOURCE_LABELS[customer.source as SourceEnum] || customer.source} · Created by {customer.user?.name} on {new Date(customer.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <StatusBadge status={status.toLowerCase() as BadgeStatus} />
                </div>
            </div>

            {/* Progress Flow Tracker — only if status is part of the main flow */}
            {currentFlowIndex >= 0 && (
                <div className="rounded-xl border border-[#E5E5E5] p-6">
                    <p className="mb-5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Progress</p>
                    <div className="flex items-center">
                        {STATUS_FLOW.map((flowStatus, idx) => {
                            const isCompleted = idx <= currentFlowIndex;
                            const isCurrent = idx === currentFlowIndex;
                            const color = getStatusColor(flowStatus);

                            return (
                                <div key={flowStatus} className="flex flex-1 items-center">
                                    <div className="flex flex-col items-center gap-2 flex-1">
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${isCurrent ? 'ring-4 ring-opacity-20' : ''}`}
                                            style={{
                                                borderColor: isCompleted ? color : '#E5E5E5',
                                                backgroundColor: isCompleted ? color : 'white',
                                                boxShadow: isCurrent ? `0 0 0 4px ${color}33` : 'none',
                                            }}
                                        >
                                            {isCompleted ? (
                                                <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <span className="text-xs font-semibold text-neutral-300">{idx + 1}</span>
                                            )}
                                        </div>
                                        <span className={`text-[12px] font-medium text-center ${isCurrent ? 'text-black' : isCompleted ? 'text-neutral-600' : 'text-neutral-300'}`}>
                                            {STATUS_LABELS[flowStatus]}
                                        </span>
                                    </div>
                                    {idx < STATUS_FLOW.length - 1 && (
                                        <div className="flex-1 -mt-6 mx-1">
                                            <div className="h-0.5 w-full rounded-full" style={{ backgroundColor: idx < currentFlowIndex ? color : '#E5E5E5' }} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                {/* Left Column: Info + Status Change */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Customer Info — Inline Editable */}
                    <div className="rounded-xl border border-[#E5E5E5] p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Customer Details</p>
                            {!editing ? (
                                <button
                                    onClick={startEditing}
                                    className="flex items-center gap-1.5 rounded-lg border border-[#E5E5E5] px-3 py-1.5 text-[12px] font-medium text-neutral-500 transition-colors hover:border-black hover:text-black"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                    </svg>
                                    Edit
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={saveEditing}
                                        disabled={saving || !editName.trim() || !editSource}
                                        className="rounded-lg bg-black px-3 py-1.5 text-[12px] font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={cancelEditing}
                                        className="rounded-lg border border-[#E5E5E5] px-3 py-1.5 text-[12px] font-medium text-neutral-500 hover:border-black hover:text-black"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {!editing ? (
                            /* View Mode */
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Name</p>
                                    <p className="text-sm font-medium text-black">{customer.name}</p>
                                </div>
                                <div>
                                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Source</p>
                                    <p className="text-sm text-neutral-700">{SOURCE_LABELS[customer.source as SourceEnum] || customer.source}</p>
                                </div>
                                <div>
                                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Phone</p>
                                    <p className="text-sm text-neutral-700">{customer.phone || '—'}</p>
                                </div>
                                <div>
                                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Email</p>
                                    <p className="text-sm text-neutral-700">{customer.email || '—'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Notes</p>
                                    <p className="text-sm leading-relaxed text-neutral-600 whitespace-pre-wrap">{customer.notes || '—'}</p>
                                </div>
                            </div>
                        ) : (
                            /* Edit Mode */
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-black placeholder-neutral-300 hover:border-neutral-400 focus:border-black focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                                            Source <span className="text-red-500">*</span>
                                        </label>
                                        <Select options={sourceOptions} value={editSource} onChange={setEditSource} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Phone</label>
                                        <input
                                            type="tel"
                                            value={editPhone}
                                            onChange={(e) => setEditPhone(e.target.value)}
                                            className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-black placeholder-neutral-300 hover:border-neutral-400 focus:border-black focus:outline-none"
                                            placeholder="(000) 000-0000"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Email</label>
                                        <input
                                            type="email"
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-black placeholder-neutral-300 hover:border-neutral-400 focus:border-black focus:outline-none"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Notes</label>
                                    <textarea
                                        rows={3}
                                        value={editNotes}
                                        onChange={(e) => setEditNotes(e.target.value)}
                                        className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-black placeholder-neutral-300 hover:border-neutral-400 focus:border-black focus:outline-none"
                                        placeholder="Budget, style preference, measurements, etc."
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Update Status */}
                    <div className="rounded-xl border border-[#E5E5E5] p-6">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Update Status</p>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <Select options={statusOptions} value={status} onChange={handleStatusChange} />
                            </div>
                        </div>

                        {/* Status change note */}
                        {showNoteInput && (
                            <div className="mt-4 space-y-3 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={status.toLowerCase() as BadgeStatus} />
                                    <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                                    <StatusBadge status={pendingStatus.toLowerCase() as BadgeStatus} />
                                </div>
                                <textarea
                                    rows={2}
                                    value={statusNote}
                                    onChange={(e) => setStatusNote(e.target.value)}
                                    className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-black placeholder-neutral-300 hover:border-neutral-400 focus:border-black focus:outline-none"
                                    placeholder="Add a note about this change (optional)..."
                                />
                                <div className="flex gap-2">
                                    <button onClick={confirmStatusChange} className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
                                        Confirm Change
                                    </button>
                                    <button onClick={cancelStatusChange} className="rounded-lg border border-[#E5E5E5] px-4 py-2 text-sm font-medium text-neutral-600 hover:border-black hover:text-black">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status History Timeline */}
                    <div className="rounded-xl border border-[#E5E5E5] p-6">
                        <p className="mb-5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Status History</p>

                        {history.length === 0 ? (
                            <div className="py-8 text-center text-sm text-neutral-300">No status changes recorded yet</div>
                        ) : (
                            <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-[#E5E5E5]" />

                                <div className="space-y-0">
                                    {history.map((item: StatusHistoryItem, idx: number) => {
                                        const color = getStatusColor(item.toStatus);
                                        const isLatest = idx === 0;

                                        return (
                                            <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
                                                {/* Timeline dot */}
                                                <div className="relative z-10 flex-shrink-0">
                                                    <div
                                                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${isLatest ? 'ring-4 ring-opacity-15' : ''}`}
                                                        style={{
                                                            borderColor: color,
                                                            backgroundColor: isLatest ? color : 'white',
                                                            boxShadow: isLatest ? `0 0 0 4px ${color}22` : 'none',
                                                        }}
                                                    >
                                                        {isLatest ? (
                                                            <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        ) : (
                                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 rounded-lg pt-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {item.fromStatus && (
                                                            <>
                                                                <StatusBadge status={item.fromStatus.toLowerCase() as BadgeStatus} />
                                                                <svg className="h-3.5 w-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                                                            </>
                                                        )}
                                                        <StatusBadge status={item.toStatus.toLowerCase() as BadgeStatus} />
                                                    </div>
                                                    {item.note && (
                                                        <p className="mt-2 text-sm text-neutral-600 bg-[#F9FAFB] rounded-md px-3 py-2 border border-[#F0F0F0]">
                                                            &ldquo;{item.note}&rdquo;
                                                        </p>
                                                    )}
                                                    <p className="mt-1.5 text-[12px] text-neutral-400">
                                                        {item.user?.name || 'System'} · {formatDate(item.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Photos */}
                <div className="lg:col-span-2">
                    <div className="rounded-xl border border-[#E5E5E5] p-6">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Photos</p>
                        <div className="grid grid-cols-3 gap-3">
                            {customer.photos?.map((photo) => (
                                <div
                                    key={photo.id}
                                    onClick={() => setLightboxUrl(photo.storageUrl)}
                                    className="group relative flex aspect-square cursor-pointer items-center justify-center rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] overflow-hidden transition-all hover:border-black hover:shadow-md"
                                >
                                    <img src={photo.storageUrl} alt={photo.filename} className="h-full w-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30">
                                        <svg className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                                        </svg>
                                    </div>
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
                            {uploading ? 'Uploading...' : 'Upload Photos'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {lightboxUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => setLightboxUrl(null)}
                >
                    <button
                        onClick={() => setLightboxUrl(null)}
                        className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <img
                        src={lightboxUrl}
                        alt="Full size"
                        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
