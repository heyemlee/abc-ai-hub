'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { DailyReport } from '@/lib/types';

export default function ViewReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [report, setReport] = useState<DailyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`/api/reports/${id}`)
            .then((r) => {
                if (!r.ok) throw new Error('Report not found');
                return r.json();
            })
            .then((data) => { setReport(data); setLoading(false); })
            .catch((err) => { setError(err.message); setLoading(false); });
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-sm text-neutral-400">
                Loading...
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="mx-auto max-w-2xl">
                <div className="rounded-xl border border-[#E5E5E5] p-8 text-center">
                    <p className="text-sm text-red-500">{error || 'Report not found'}</p>
                    <Link href="/reports" className="mt-4 inline-block text-sm text-neutral-400 hover:text-black">
                        ← Back to Reports
                    </Link>
                </div>
            </div>
        );
    }

    const reportDateFormatted = new Date(report.reportDate).toLocaleDateString('en-US', {
        timeZone: 'UTC',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="mx-auto max-w-2xl">
            <div className="rounded-xl border border-[#E5E5E5] p-8">
                <div className="space-y-6">
                    <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                            Report Date
                        </label>
                        <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-2.5 text-sm text-neutral-600">
                            {reportDateFormatted}
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                            Submitted By
                        </label>
                        <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-2.5 text-sm text-neutral-600">
                            {report.user?.name || 'Unknown'}
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                            Today&apos;s Tasks Completed
                        </label>
                        <div className="whitespace-pre-wrap rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3 text-sm text-neutral-700" style={{ minHeight: '120px' }}>
                            {report.tasksToday}
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                            Tomorrow&apos;s Plan
                        </label>
                        <div className="whitespace-pre-wrap rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3 text-sm text-neutral-700" style={{ minHeight: '120px' }}>
                            {report.planTomorrow}
                        </div>
                    </div>
                    <div className="text-center">
                        <Link href="/reports" className="text-sm text-neutral-400 hover:text-black">
                            ← Back to Reports
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
