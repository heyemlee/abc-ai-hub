'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CaseItem, CASE_STATUS_LABELS, CaseStatusEnum } from '@/lib/types';
import Select from '@/components/Select';

const statusOptions = [
    { value: '', label: 'All Status' },
    ...Object.entries(CASE_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v })),
];

const CASE_STATUS_ORDER = ['ASKING_QUOTE', 'DRAWING', 'IN_PROGRESS', 'ON_HOLD', 'ORDERED', 'CANCELLED'];

type SortKey = 'status' | 'createdAt' | 'clientName';
type SortDir = 'asc' | 'desc';

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
    return (
        <span className="ml-1 inline-flex flex-col gap-[2px]">
            <svg className={`h-3 w-3 transition-colors ${active && dir === 'asc' ? 'text-black' : 'text-neutral-300'}`} viewBox="0 0 12 12" fill="currentColor"><path d="M6 3l4 5H2z" /></svg>
            <svg className={`h-3 w-3 -mt-1 transition-colors ${active && dir === 'desc' ? 'text-black' : 'text-neutral-300'}`} viewBox="0 0 12 12" fill="currentColor"><path d="M6 9L2 4h8z" /></svg>
        </span>
    );
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

export default function CasesPage() {
    const router = useRouter();
    const { data: session } = useSession();

    const [status, setStatus] = useState('');
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [cases, setCases] = useState<CaseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showClosed, setShowClosed] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

    const fetchCases = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        fetch(`/api/cases?${params}`)
            .then((r) => r.json())
            .then((data) => { setCases(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [status]);

    useEffect(() => { fetchCases(); }, [fetchCases]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            if (sortDir === 'asc') setSortDir('desc');
            else { setSortKey(null); }
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const closedCount = useMemo(() =>
        cases.filter((c) => c.status === 'ORDERED' || c.status === 'CANCELLED').length,
        [cases]
    );

    const sorted = useMemo(() => {
        let list = [...cases];
        if (!showClosed) {
            list = list.filter((c) => c.status !== 'ORDERED' && c.status !== 'CANCELLED');
        }
        if (sortKey) {
            list.sort((a, b) => {
                let av: string | number, bv: string | number;
                if (sortKey === 'status') {
                    av = CASE_STATUS_ORDER.indexOf(a.status);
                    bv = CASE_STATUS_ORDER.indexOf(b.status);
                } else if (sortKey === 'clientName') {
                    av = a.clientName.toLowerCase();
                    bv = b.clientName.toLowerCase();
                } else {
                    av = a.createdAt;
                    bv = b.createdAt;
                }
                if (av < bv) return sortDir === 'asc' ? -1 : 1;
                if (av > bv) return sortDir === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return list;
    }, [cases, sortKey, sortDir, showClosed]);

    const thClass = (key: SortKey) =>
        `cursor-pointer select-none px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest transition-colors ${sortKey === key ? 'text-black' : 'text-neutral-400 hover:text-black'}`;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div />
                <div className="flex items-center gap-3">
                    {/* View toggle */}
                    <div className="flex rounded-lg border border-[#E5E5E5] overflow-hidden">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${viewMode === 'table' ? 'bg-black text-white' : 'text-neutral-500 hover:text-black'}`}
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewMode('card')}
                            className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${viewMode === 'card' ? 'bg-black text-white' : 'text-neutral-500 hover:text-black'}`}
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                        </button>
                    </div>
                    <button
                        onClick={() => setShowClosed(!showClosed)}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-[13px] font-medium transition-all ${showClosed
                            ? 'border-black bg-black text-white hover:bg-neutral-800'
                            : 'border-[#E5E5E5] text-neutral-500 hover:border-neutral-400 hover:text-black'
                            }`}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            {showClosed
                                ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                : <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            }
                        </svg>
                        {showClosed ? 'Hide' : 'Show'} Closed
                        {closedCount > 0 && (
                            <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${showClosed ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                                }`}>{closedCount}</span>
                        )}
                    </button>
                    <Link href="/cases/new">
                        <button className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
                            New Case
                        </button>
                    </Link>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Status</label>
                    <Select options={statusOptions} value={status} onChange={setStatus} placeholder="All Status" />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-sm text-neutral-400">Loading...</div>
            ) : viewMode === 'table' ? (
                /* TABLE VIEW */
                <div className="overflow-x-auto rounded-xl border border-[#E5E5E5]">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#FAFAFA]">
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Case Title</th>
                                <th className={thClass('clientName')} onClick={() => handleSort('clientName')}>
                                    <span className="flex items-center">Client <SortIcon active={sortKey === 'clientName'} dir={sortDir} /></span>
                                </th>
                                <th className={thClass('status')} onClick={() => handleSort('status')}>
                                    <span className="flex items-center">Status <SortIcon active={sortKey === 'status'} dir={sortDir} /></span>
                                </th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Team</th>
                                <th className={thClass('createdAt')} onClick={() => handleSort('createdAt')}>
                                    <span className="flex items-center">Date <SortIcon active={sortKey === 'createdAt'} dir={sortDir} /></span>
                                </th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((c) => (
                                <tr key={c.id} onClick={() => router.push(`/cases/${c.id}`)} className="cursor-pointer border-t border-[#E5E5E5] transition-colors hover:bg-[#FAFAFA]">
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-black">{c.title}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-600">{c.clientName}</td>
                                    <td className="whitespace-nowrap px-6 py-4"><CaseStatusBadge status={c.status} /></td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="flex -space-x-2">
                                            {c.members.slice(0, 4).map((m) => (
                                                <div
                                                    key={m.userId}
                                                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white ${m.role === 'OWNER' ? 'bg-black' : 'bg-neutral-400'}`}
                                                    title={`${m.user.name || m.user.email} (${m.role.toLowerCase()})`}
                                                >
                                                    {(m.user.name || m.user.email).charAt(0).toUpperCase()}
                                                </div>
                                            ))}
                                            {c.members.length > 4 && (
                                                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-neutral-200 text-[10px] font-semibold text-neutral-600">
                                                    +{c.members.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-600">{new Date(c.createdAt).toLocaleDateString('en-US')}</td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <Link href={`/cases/${c.id}`} onClick={(e) => e.stopPropagation()}>
                                            <button className="rounded-md border border-[#E5E5E5] bg-white px-3 py-1 text-[12px] font-medium text-neutral-600 hover:border-black hover:text-black">View</button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {sorted.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-neutral-400">No cases found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* CARD VIEW */
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sorted.map((c) => (
                        <Link key={c.id} href={`/cases/${c.id}`} className="group block">
                            <div className="rounded-xl border border-[#E5E5E5] p-5 transition-all hover:border-neutral-300 hover:shadow-md">
                                <div className="mb-3 flex items-start justify-between">
                                    <h3 className="text-[15px] font-semibold text-black group-hover:text-neutral-700 truncate pr-2">{c.title}</h3>
                                    <CaseStatusBadge status={c.status} />
                                </div>
                                <p className="mb-1 text-sm text-neutral-600 font-medium">{c.clientName}</p>
                                {c.clientPhone && (
                                    <p className="mb-1 text-[12px] text-neutral-400">{c.clientPhone}</p>
                                )}
                                {c.description && (
                                    <p className="mb-4 mt-2 text-[13px] text-neutral-400 line-clamp-2">{c.description}</p>
                                )}
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F0F0F0]">
                                    <div className="flex -space-x-2">
                                        {c.members.slice(0, 3).map((m) => (
                                            <div
                                                key={m.userId}
                                                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white ${m.role === 'OWNER' ? 'bg-black' : 'bg-neutral-400'}`}
                                                title={m.user.name || m.user.email}
                                            >
                                                {(m.user.name || m.user.email).charAt(0).toUpperCase()}
                                            </div>
                                        ))}
                                        {c.members.length > 3 && (
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-neutral-200 text-[10px] font-semibold text-neutral-600">
                                                +{c.members.length - 3}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[12px] text-neutral-400">{new Date(c.createdAt).toLocaleDateString('en-US')}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {sorted.length === 0 && (
                        <div className="col-span-full py-12 text-center text-sm text-neutral-400">No cases found</div>
                    )}
                </div>
            )}
        </div>
    );
}
