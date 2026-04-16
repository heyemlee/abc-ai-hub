'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Customer, User, SOURCE_LABELS, STATUS_LABELS, SourceEnum, StatusEnum } from '@/lib/types';
import Select from '@/components/Select';
import StatusBadge, { BadgeStatus } from '@/components/StatusBadge';

const allColumns: StatusEnum[] = ['ASKING_QUOTE', 'DRAWING', 'IN_PROGRESS', 'ON_HOLD', 'ORDERED', 'OTHERS'];

export default function PipelinePage() {
    const router = useRouter();
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'ADMIN';

    const [staff, setStaff] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);


    const fetchCustomers = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (staff) params.set('userId', staff);
        fetch(`/api/customers?${params}`)
            .then((r) => r.json())
            .then((data) => { setCustomers(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [staff]);

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

    const grouped = allColumns.reduce((acc, status) => {
        acc[status] = customers.filter((c) => c.status === status);
        return acc;
    }, {} as Record<StatusEnum, Customer[]>);



    if (loading) {
        return <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {isAdmin && (
                <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Staff</label>
                    <Select options={staffOptions} value={staff} onChange={setStaff} placeholder="All Staff" />
                </div>
            )}

            <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
                {allColumns.map((status) => {
                    const items = grouped[status];
                    const needsAttention = items.filter((c) => {
                        const lastUpdate = new Date(c.updatedAt);
                        const daysSince = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
                        return daysSince > 7;
                    });

                    return (
                        <div key={status} className="min-w-[220px] flex-1">
                            {/* Column Header */}
                            <div className="mb-4 flex items-center justify-between rounded-xl bg-[#F5F5F5] px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <StatusBadge status={status.toLowerCase() as BadgeStatus} />
                                    <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-white px-2 text-[13px] font-semibold text-neutral-500 shadow-sm">{items.length}</span>
                                </div>
                                {needsAttention.length > 0 && (
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-[11px] font-bold text-red-500" title={`${needsAttention.length} need follow-up`}>
                                        {needsAttention.length}
                                    </span>
                                )}
                            </div>

                            {/* Customer Cards */}
                            <div className="space-y-2">
                                {items.map((customer) => {
                                    const daysSinceUpdate = Math.floor((Date.now() - new Date(customer.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
                                    const isStale = daysSinceUpdate > 7;

                                    return (
                                        <div
                                            key={customer.id}
                                            onClick={() => router.push(`/customers/${customer.id}`)}
                                            className={`cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md ${isStale
                                                ? 'border-red-200 bg-red-50/30'
                                                : 'border-[#E5E5E5] bg-white'
                                                }`}
                                        >
                                            <p className="mb-1 text-[13px] font-medium text-black">{customer.name}</p>
                                            <p className="text-[11px] text-neutral-400">{SOURCE_LABELS[customer.source as SourceEnum] || customer.source}</p>
                                            <div className="mt-2 flex items-center justify-between">
                                                <p className="text-[11px] text-neutral-400">{customer.user?.name}</p>
                                                {isStale && (
                                                    <span className="text-[10px] font-medium text-red-400">
                                                        {daysSinceUpdate}d ago
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
