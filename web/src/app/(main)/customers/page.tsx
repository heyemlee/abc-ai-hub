'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Customer, User, SOURCE_LABELS, STATUS_LABELS, SourceEnum, StatusEnum } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import Select from '@/components/Select';

const sourceOptions = [
    { value: '', label: 'All Sources' },
    ...Object.entries(SOURCE_LABELS).map(([k, v]) => ({ value: k, label: v })),
];

const statusOptions = [
    { value: '', label: 'All Status' },
    ...Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v })),
];

const STATUS_ORDER = ['INTERESTED', 'FOLLOWING_UP', 'QUOTED', 'CLOSED_WON', 'LOST'];

type SortKey = 'source' | 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
    return (
        <span className="ml-1 inline-flex flex-col gap-[2px]">
            <svg className={`h-3 w-3 transition-colors ${active && dir === 'asc' ? 'text-black' : 'text-neutral-300'}`} viewBox="0 0 12 12" fill="currentColor"><path d="M6 3l4 5H2z" /></svg>
            <svg className={`h-3 w-3 -mt-1 transition-colors ${active && dir === 'desc' ? 'text-black' : 'text-neutral-300'}`} viewBox="0 0 12 12" fill="currentColor"><path d="M6 9L2 4h8z" /></svg>
        </span>
    );
}

export default function CustomersPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'ADMIN';

    const [source, setSource] = useState('');
    const [status, setStatus] = useState('');
    const [staff, setStaff] = useState('');
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCustomers = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (staff) params.set('userId', staff);
        if (source) params.set('source', source);
        if (status) params.set('status', status);
        fetch(`/api/customers?${params}`)
            .then((r) => r.json())
            .then((data) => { setCustomers(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [staff, source, status]);

    useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

    useEffect(() => {
        if (isAdmin) {
            fetch('/api/admin/users').then((r) => r.json()).then(setUsers).catch(() => { });
        }
    }, [isAdmin]);

    const staffOptions = [
        { value: '', label: 'All Staff' },
        ...users.map((u) => ({ value: u.id, label: u.name || u.email })),
    ];

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            if (sortDir === 'asc') setSortDir('desc');
            else { setSortKey(null); }
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const sorted = useMemo(() => {
        const list = [...customers];
        if (sortKey) {
            list.sort((a, b) => {
                let av: string | number, bv: string | number;
                if (sortKey === 'status') {
                    av = STATUS_ORDER.indexOf(a.status);
                    bv = STATUS_ORDER.indexOf(b.status);
                } else if (sortKey === 'source') {
                    av = a.source.toLowerCase();
                    bv = b.source.toLowerCase();
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
    }, [customers, sortKey, sortDir]);

    const thClass = (key: SortKey) =>
        `cursor-pointer select-none px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest transition-colors ${sortKey === key ? 'text-black' : 'text-neutral-400 hover:text-black'}`;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-end">
                <Link href="/customers/new">
                    <button className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
                        Add New Customer
                    </button>
                </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Source</label>
                    <Select options={sourceOptions} value={source} onChange={setSource} placeholder="All Sources" />
                </div>
                <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Status</label>
                    <Select options={statusOptions} value={status} onChange={setStatus} placeholder="All Status" />
                </div>
                {isAdmin && (
                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Staff</label>
                        <Select options={staffOptions} value={staff} onChange={setStaff} placeholder="All Staff" />
                    </div>
                )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E5E5E5]">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-sm text-neutral-400">Loading...</div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#FAFAFA]">
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Customer Name</th>
                                <th className={thClass('source')} onClick={() => handleSort('source')}>
                                    <span className="flex items-center">Source <SortIcon active={sortKey === 'source'} dir={sortDir} /></span>
                                </th>
                                <th className={thClass('status')} onClick={() => handleSort('status')}>
                                    <span className="flex items-center">Status <SortIcon active={sortKey === 'status'} dir={sortDir} /></span>
                                </th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Phone</th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Created By</th>
                                <th className={thClass('createdAt')} onClick={() => handleSort('createdAt')}>
                                    <span className="flex items-center">Date <SortIcon active={sortKey === 'createdAt'} dir={sortDir} /></span>
                                </th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((customer) => (
                                <tr key={customer.id} onClick={() => router.push(`/customers/${customer.id}`)} className="cursor-pointer border-t border-[#E5E5E5] transition-colors hover:bg-[#FAFAFA]">
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-black">{customer.name}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-600">{SOURCE_LABELS[customer.source as SourceEnum] || customer.source}</td>
                                    <td className="whitespace-nowrap px-6 py-4"><StatusBadge status={customer.status.toLowerCase() as 'interested' | 'following_up' | 'quoted' | 'closed_won' | 'lost'} /></td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-600">{customer.phone}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-600">{customer.user?.name}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-600">{new Date(customer.createdAt).toLocaleDateString('en-US')}</td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <Link href={`/customers/${customer.id}`}>
                                            <button className="rounded-md border border-[#E5E5E5] bg-white px-3 py-1 text-[12px] font-medium text-neutral-600 hover:border-black hover:text-black">View</button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {sorted.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-neutral-400">No customers found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
