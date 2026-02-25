'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardStats, SOURCE_LABELS, SourceEnum } from '@/lib/types';

const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: '1m', label: 'Last Month' },
    { value: '3m', label: 'Last 3 Months' },
    { value: 'all', label: 'All Time' },
];

export default function DashboardPage() {
    const { data: session } = useSession();
    const [period, setPeriod] = useState('1m');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/dashboard/stats?period=${period}`)
            .then((r) => r.json())
            .then((data) => { setStats(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [period]);

    if (loading || !stats) {
        return <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">Loading...</div>;
    }

    const allUsers = [...stats.submittedToday, ...stats.notSubmittedToday];
    const submittedSet = new Set(stats.submittedToday.map((u) => u.id));

    const sourceData = stats.sourceBreakdown.map((s) => ({
        source: SOURCE_LABELS[s.source as SourceEnum] || s.source,
        count: s.count,
    }));
    const totalCustomers = sourceData.reduce((sum, s) => sum + s.count, 0);
    const maxCount = Math.max(...sourceData.map((s) => s.count), 1);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Card 1 — Submitted Today */}
                <div className="rounded-xl border border-[#E5E5E5] bg-white p-6">
                    <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                        Submitted Today
                    </p>
                    <div className="space-y-2">
                        {allUsers.map((user) => {
                            const submitted = submittedSet.has(user.id);
                            return (
                                <div key={user.id} className="flex items-center justify-between border-b border-[#E5E5E5] py-2 last:border-b-0">
                                    <span className="text-sm text-neutral-700">{user.name}</span>
                                    {submitted ? (
                                        <span className="flex items-center gap-1 text-[12px] font-medium text-green-600">
                                            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 111.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            Done
                                        </span>
                                    ) : (
                                        <span className="text-[12px] font-medium text-neutral-400">Pending</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Card 2 — Customer Source Breakdown */}
                <div className="rounded-xl border border-[#E5E5E5] bg-white p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                            Source Breakdown
                        </p>
                        <p className="text-[12px] text-neutral-400">{totalCustomers} total</p>
                    </div>

                    {/* Period tabs */}
                    <div className="mb-4 flex gap-1 rounded-lg bg-[#F5F5F5] p-1">
                        {periodOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setPeriod(opt.value)}
                                className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-all ${period === opt.value
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-neutral-400 hover:text-neutral-600'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3">
                        {sourceData.map((item) => (
                            <div key={item.source} className="flex items-center gap-3">
                                <span className="w-20 shrink-0 text-sm text-neutral-500">{item.source}</span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F0F0F0]">
                                    <div
                                        className="h-full rounded-full bg-black transition-all duration-300"
                                        style={{ width: `${(item.count / maxCount) * 100}%` }}
                                    />
                                </div>
                                <span className="w-8 text-right text-sm font-medium text-black">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Coming Soon Section */}
            <div className="flex h-[160px] items-center justify-center rounded-xl border-2 border-dashed border-[#E5E5E5]">
                <div className="text-center">
                    <p className="text-sm font-medium text-neutral-300">Social Media Analytics — Coming Soon</p>
                    <p className="mt-1 text-[12px] text-neutral-300">
                        Instagram, Meta, and Red Note traffic trends will appear here.
                    </p>
                </div>
            </div>
        </div>
    );
}
