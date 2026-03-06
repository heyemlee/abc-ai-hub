'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CaseItem, CASE_STATUS_LABELS, CaseStatusEnum, CaseActivity, CaseMember, User } from '@/lib/types';
import Select from '@/components/Select';

const statusOptions = Object.entries(CASE_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }));

const CASE_STATUS_FLOW: CaseStatusEnum[] = ['ASKING_QUOTE', 'DRAWING', 'IN_PROGRESS', 'ORDERED'];

function getCaseStatusColor(status: string): string {
    const colors: Record<string, string> = {
        ASKING_QUOTE: '#F59E0B',
        DRAWING: '#3B82F6',
        IN_PROGRESS: '#10B981',
        ON_HOLD: '#EF4444',
        ORDERED: '#171717',
        CANCELLED: '#6B7280',
    };
    return colors[status] || '#A3A3A3';
}

function CaseStatusBadge({ status }: { status: CaseStatusEnum }) {
    const config: Record<string, { bg: string; text: string }> = {
        ASKING_QUOTE: { bg: '#FEF3C7', text: '#92400E' },
        DRAWING: { bg: '#DBEAFE', text: '#1E40AF' },
        IN_PROGRESS: { bg: '#D1FAE5', text: '#065F46' },
        ON_HOLD: { bg: '#FEE2E2', text: '#991B1B' },
        ORDERED: { bg: '#171717', text: '#FFFFFF' },
        CANCELLED: { bg: '#F0F0F0', text: '#525252' },
    };
    const c = config[status] || { bg: '#F0F0F0', text: '#525252' };
    return (
        <span
            className="inline-flex items-center rounded-full px-3 py-1 text-[13px] font-medium border"
            style={{ backgroundColor: c.bg, color: c.text, borderColor: c.bg }}
        >
            {CASE_STATUS_LABELS[status] || status}
        </span>
    );
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function getActivityIcon(type: string) {
    switch (type) {
        case 'note':
            return (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
            );
        case 'status_change':
            return (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
            );
        case 'photo_upload':
            return (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
            );
        case 'member_added':
            return (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
            );
        case 'member_removed':
            return (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
            );
        default:
            return (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
    }
}

export default function CaseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [caseData, setCaseData] = useState<CaseItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [uploading, setUploading] = useState(false);
    const [statusNote, setStatusNote] = useState('');
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [pendingStatus, setPendingStatus] = useState('');
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [addingNote, setAddingNote] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [sharingUserId, setSharingUserId] = useState('');
    const [sharing, setSharing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isAdmin = session?.user?.role === 'ADMIN';
    const userId = session?.user?.id;

    const isOwner = caseData?.members.some((m) => m.userId === userId && m.role === 'OWNER') || false;
    const canManageMembers = isOwner || isAdmin;

    useEffect(() => {
        fetch(`/api/cases/${params.id}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.error) {
                    router.push('/cases');
                    return;
                }
                setCaseData(data);
                setStatus(data.status);
                setLoading(false);
            })
            .catch(() => router.push('/cases'));
    }, [params.id, router]);

    // Load all staff for sharing
    useEffect(() => {
        if (showShareModal) {
            fetch('/api/admin/users')
                .then((r) => r.json())
                .then(setAllUsers)
                .catch(() => { });
        }
    }, [showShareModal]);

    const refreshCase = async () => {
        const res = await fetch(`/api/cases/${params.id}`);
        const data = await res.json();
        setCaseData(data);
        setStatus(data.status);
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

        await fetch(`/api/cases/${params.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, statusNote: statusNote.trim() || null }),
        });
        await refreshCase();
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
            await fetch(`/api/cases/${params.id}/photos`, {
                method: 'POST',
                body: formData,
            });
        }

        await refreshCase();
        setUploading(false);
        e.target.value = '';
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        setAddingNote(true);
        await fetch(`/api/cases/${params.id}/activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newNote.trim() }),
        });
        setNewNote('');
        await refreshCase();
        setAddingNote(false);
    };

    const handleShare = async () => {
        if (!sharingUserId) return;
        setSharing(true);
        const res = await fetch(`/api/cases/${params.id}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUserId: sharingUserId }),
        });
        if (res.ok) {
            await refreshCase();
            setSharingUserId('');
        }
        setSharing(false);
    };

    const handleRemoveMember = async (targetUserId: string) => {
        if (!confirm('Remove this member from the case?')) return;
        await fetch(`/api/cases/${params.id}/members?userId=${targetUserId}`, {
            method: 'DELETE',
        });
        await refreshCase();
    };

    if (loading || !caseData) {
        return <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">Loading...</div>;
    }

    const currentFlowIndex = CASE_STATUS_FLOW.indexOf(caseData.status as CaseStatusEnum);
    const activities = caseData.activities || [];

    // Available users to share with (not already members)
    const memberIds = new Set(caseData.members.map((m) => m.userId));
    const availableUsers = allUsers.filter((u) => !memberIds.has(u.id) && u.active);
    const shareUserOptions = [
        { value: '', label: 'Select staff...' },
        ...availableUsers.map((u) => ({ value: u.id, label: u.name || u.email })),
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button onClick={() => router.push('/cases')} className="flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-black">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15l-5-5 5-5" /></svg>
                    Back to Cases
                </button>
            </div>

            {/* Case Title & Status */}
            <div className="rounded-xl border border-[#E5E5E5] p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-black">{caseData.title}</h1>
                        <p className="mt-1 text-sm text-neutral-500">
                            Created by {caseData.createdBy?.name} on {new Date(caseData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <CaseStatusBadge status={status as CaseStatusEnum} />
                </div>
            </div>

            {/* Progress Flow Tracker */}
            {currentFlowIndex >= 0 && (
                <div className="rounded-xl border border-[#E5E5E5] p-6">
                    <p className="mb-5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Progress</p>
                    <div className="flex items-center">
                        {CASE_STATUS_FLOW.map((flowStatus, idx) => {
                            const isCompleted = idx <= currentFlowIndex;
                            const isCurrent = idx === currentFlowIndex;
                            const color = getCaseStatusColor(flowStatus);

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
                                            {CASE_STATUS_LABELS[flowStatus]}
                                        </span>
                                    </div>
                                    {idx < CASE_STATUS_FLOW.length - 1 && (
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
                {/* Left Column */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Client Info */}
                    <div className="rounded-xl border border-[#E5E5E5] p-6">
                        <p className="mb-5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Client Information</p>
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Name</p>
                                <p className="text-sm font-medium text-black">{caseData.clientName}</p>
                            </div>
                            <div>
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Phone</p>
                                <p className="text-sm text-neutral-700">{caseData.clientPhone || '—'}</p>
                            </div>
                            <div>
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Email</p>
                                <p className="text-sm text-neutral-700">{caseData.clientEmail || '—'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {caseData.description && (
                        <div className="rounded-xl border border-[#E5E5E5] p-6">
                            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Description</p>
                            <p className="text-sm leading-relaxed text-neutral-600 whitespace-pre-wrap">{caseData.description}</p>
                        </div>
                    )}

                    {/* Update Status */}
                    <div className="rounded-xl border border-[#E5E5E5] p-6">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Update Status</p>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <Select options={statusOptions} value={status} onChange={handleStatusChange} />
                            </div>
                        </div>

                        {showNoteInput && (
                            <div className="mt-4 space-y-3 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                                <div className="flex items-center gap-2">
                                    <CaseStatusBadge status={status as CaseStatusEnum} />
                                    <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                                    <CaseStatusBadge status={pendingStatus as CaseStatusEnum} />
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

                    {/* Add Note */}
                    <div className="rounded-xl border border-[#E5E5E5] p-6">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Add Note</p>
                        <textarea
                            rows={3}
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-black placeholder-neutral-300 hover:border-neutral-400 focus:border-black focus:outline-none"
                            placeholder="Add a note to the activity timeline..."
                        />
                        <button
                            onClick={handleAddNote}
                            disabled={addingNote || !newNote.trim()}
                            className="mt-3 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                        >
                            {addingNote ? 'Adding...' : 'Add Note'}
                        </button>
                    </div>

                    {/* Activity Timeline */}
                    <div className="rounded-xl border border-[#E5E5E5] p-6">
                        <p className="mb-5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Activity Timeline</p>

                        {activities.length === 0 ? (
                            <div className="py-8 text-center text-sm text-neutral-300">No activity yet</div>
                        ) : (
                            <div className="relative">
                                <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-[#E5E5E5]" />
                                <div className="space-y-0">
                                    {activities.map((activity: CaseActivity, idx: number) => {
                                        const isLatest = idx === 0;
                                        const typeColor = activity.type === 'status_change' ? '#3B82F6'
                                            : activity.type === 'member_added' ? '#10B981'
                                                : activity.type === 'member_removed' ? '#EF4444'
                                                    : activity.type === 'photo_upload' ? '#8B5CF6'
                                                        : '#171717';

                                        return (
                                            <div key={activity.id} className="relative flex gap-4 pb-6 last:pb-0">
                                                <div className="relative z-10 flex-shrink-0">
                                                    <div
                                                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${isLatest ? 'ring-4 ring-opacity-15' : ''}`}
                                                        style={{
                                                            borderColor: typeColor,
                                                            backgroundColor: isLatest ? typeColor : 'white',
                                                            color: isLatest ? 'white' : typeColor,
                                                            boxShadow: isLatest ? `0 0 0 4px ${typeColor}22` : 'none',
                                                        }}
                                                    >
                                                        {getActivityIcon(activity.type)}
                                                    </div>
                                                </div>
                                                <div className="flex-1 pt-1">
                                                    <p className="text-sm text-neutral-700">{activity.content || activity.type}</p>
                                                    <p className="mt-1 text-[12px] text-neutral-400">
                                                        {activity.user?.name || 'System'} · {formatDate(activity.createdAt)}
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

                {/* Right Column: Members + Photos */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Team Members */}
                    <div className="rounded-xl border border-[#E5E5E5] p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Team Members</p>
                            {canManageMembers && (
                                <button
                                    onClick={() => setShowShareModal(true)}
                                    className="flex items-center gap-1.5 rounded-lg border border-[#E5E5E5] px-3 py-1.5 text-[12px] font-medium text-neutral-600 transition-colors hover:border-black hover:text-black"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                                    </svg>
                                    Share
                                </button>
                            )}
                        </div>

                        <div className="space-y-2">
                            {caseData.members.map((member: CaseMember) => (
                                <div key={member.id} className="flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-[#FAFAFA]">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold text-white ${member.role === 'OWNER' ? 'bg-black' : 'bg-neutral-400'}`}>
                                            {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-black">{member.user.name || member.user.email}</p>
                                            <p className="text-[12px] text-neutral-400 capitalize">{member.role.toLowerCase()}</p>
                                        </div>
                                    </div>
                                    {canManageMembers && member.role !== 'OWNER' && (
                                        <button
                                            onClick={() => handleRemoveMember(member.userId)}
                                            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500"
                                            title="Remove member"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Photos */}
                    <div className="rounded-xl border border-[#E5E5E5] p-6">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Photos</p>
                        <div className="grid grid-cols-3 gap-3">
                            {caseData.photos?.map((photo) => (
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
                            {(!caseData.photos || caseData.photos.length === 0) && (
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

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/30" onClick={() => setShowShareModal(false)} />
                    <div className="relative z-10 w-full max-w-md rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-lg">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-[16px] font-semibold text-black">Share Case</h2>
                            <button onClick={() => setShowShareModal(false)} className="text-neutral-400 hover:text-black transition-colors">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Current members */}
                        <div className="mb-5">
                            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Current Members</p>
                            <div className="space-y-2">
                                {caseData.members.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between rounded-lg bg-[#FAFAFA] px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white ${m.role === 'OWNER' ? 'bg-black' : 'bg-neutral-400'}`}>
                                                {(m.user.name || m.user.email).charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm text-black">{m.user.name || m.user.email}</span>
                                            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-500 capitalize">{m.role.toLowerCase()}</span>
                                        </div>
                                        {canManageMembers && m.role !== 'OWNER' && (
                                            <button
                                                onClick={() => handleRemoveMember(m.userId)}
                                                className="text-neutral-300 hover:text-red-500 transition-colors"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Add new member */}
                        <div>
                            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Add Collaborator</p>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Select
                                        options={shareUserOptions}
                                        value={sharingUserId}
                                        onChange={setSharingUserId}
                                        placeholder="Select staff..."
                                    />
                                </div>
                                <button
                                    onClick={handleShare}
                                    disabled={sharing || !sharingUserId}
                                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                                >
                                    {sharing ? 'Adding...' : 'Add'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
