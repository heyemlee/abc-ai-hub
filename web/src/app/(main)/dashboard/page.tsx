'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DashboardStats, DailyReport, SOURCE_LABELS, SourceEnum } from '@/lib/types';

const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: '1m', label: 'Last Month' },
    { value: '3m', label: 'Last 3 Months' },
    { value: 'all', label: 'All Time' },
];

export default function DashboardPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [period, setPeriod] = useState('1m');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);
    const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);

    const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN';

    useEffect(() => {
        if (session === undefined) return; // still loading session
        if (!isAdmin) {
            router.replace('/reports');
            return;
        }
        setLoading(true);
        setForbidden(false);
        fetch(`/api/dashboard/stats?period=${period}`)
            .then((r) => {
                if (!r.ok) { setForbidden(true); setLoading(false); return null; }
                return r.json();
            })
            .then((data) => { if (data) { setStats(data); setLoading(false); } })
            .catch(() => setLoading(false));
    }, [period, isAdmin, session, router]);

    const closeModal = useCallback(() => setSelectedReport(null), []);

    // Close modal on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeModal();
        };
        if (selectedReport) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [selectedReport, closeModal]);

    if (loading) {
        return <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">Loading...</div>;
    }

    if (forbidden) {
        return <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">No data available.</div>;
    }

    if (!stats) {
        return <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">No data available.</div>;
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

            {/* Staff Daily Reports */}
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-6">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                    Staff Daily Reports
                </p>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#FAFAFA]">
                                <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Date</th>
                                <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Staff</th>
                                <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Today&apos;s Tasks</th>
                                <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Tomorrow&apos;s Plan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentReports.map((report) => (
                                <tr
                                    key={report.id}
                                    onClick={() => setSelectedReport(report)}
                                    className="border-t border-[#E5E5E5] cursor-pointer transition-colors hover:bg-[#F5F5FF]"
                                    title="Click to view full report"
                                >
                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-700">
                                        {new Date(report.reportDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-black">
                                        {report.user?.name || 'Unknown'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-neutral-600">
                                        <span className="flex items-center gap-1">
                                            {report.tasksToday.length > 60
                                                ? report.tasksToday.substring(0, 60) + '...'
                                                : report.tasksToday}
                                            {report.tasksToday.length > 60 && (
                                                <svg className="h-3.5 w-3.5 shrink-0 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                                </svg>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-neutral-600">
                                        <span className="flex items-center gap-1">
                                            {report.planTomorrow.length > 60
                                                ? report.planTomorrow.substring(0, 60) + '...'
                                                : report.planTomorrow}
                                            {report.planTomorrow.length > 60 && (
                                                <svg className="h-3.5 w-3.5 shrink-0 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                                </svg>
                                            )}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {stats.recentReports.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-neutral-400">No reports submitted yet</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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

            {/* ── Report Detail Modal ──────────────────────────────── */}
            {selectedReport && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity"
                    onClick={closeModal}
                >
                    <div
                        className="relative mx-4 w-full max-w-lg animate-[slideUp_0.25s_ease-out] rounded-2xl border border-[#E5E5E5] bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-[#E5E5E5] px-6 py-4">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                                    Daily Report
                                </p>
                                <p className="mt-0.5 text-sm font-medium text-black">
                                    {selectedReport.user?.name || 'Unknown'}
                                    <span className="ml-2 font-normal text-neutral-400">
                                        {new Date(selectedReport.reportDate).toLocaleDateString('en-US', {
                                            timeZone: 'UTC',
                                            weekday: 'short',
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-[#F5F5F5] hover:text-black"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="max-h-[60vh] overflow-y-auto px-6 py-5 space-y-5">
                            <div>
                                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                                    Today&apos;s Tasks Completed
                                </label>
                                <div className="whitespace-pre-wrap rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3 text-sm leading-relaxed text-neutral-700" style={{ minHeight: '100px' }}>
                                    {selectedReport.tasksToday}
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                                    Tomorrow&apos;s Plan
                                </label>
                                <div className="whitespace-pre-wrap rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3 text-sm leading-relaxed text-neutral-700" style={{ minHeight: '100px' }}>
                                    {selectedReport.planTomorrow}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-[#E5E5E5] px-6 py-3">
                            <p className="text-center text-[11px] text-neutral-400">
                                Submitted {new Date(selectedReport.createdAt).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Keyframe for modal animation */}
            <style jsx>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(24px) scale(0.97);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
}
