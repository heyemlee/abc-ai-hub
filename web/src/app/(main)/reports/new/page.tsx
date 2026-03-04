'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { DailyReport } from '@/lib/types';

export default function NewReportPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [tasksToday, setTasksToday] = useState('');
    const [planTomorrow, setPlanTomorrow] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [existingReport, setExistingReport] = useState<DailyReport | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/reports/today')
            .then((r) => r.json())
            .then((data) => {
                if (data?.id) {
                    setExistingReport(data);
                    setTasksToday(data.tasksToday);
                    setPlanTomorrow(data.planTomorrow);
                }
            })
            .catch(() => { });
    }, []);

    const handleSubmit = async () => {
        if (!tasksToday.trim() || !planTomorrow.trim()) {
            setError('Both fields are required');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const url = existingReport ? `/api/reports/${existingReport.id}` : '/api/reports';
            const method = existingReport ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasksToday, planTomorrow }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to submit');
                setSubmitting(false);
                return;
            }

            router.push('/reports');
        } catch {
            setError('Network error');
            setSubmitting(false);
        }
    };

    const todayFormatted = new Date().toLocaleDateString('en-US', {
        timeZone: 'America/Los_Angeles',
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <div className="mx-auto max-w-2xl">
            <div className="rounded-xl border border-[#E5E5E5] p-8">
                <div className="space-y-6">
                    <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Report Date</label>
                        <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-2.5 text-sm text-neutral-400">{todayFormatted}</div>
                    </div>
                    <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Submitted By</label>
                        <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-2.5 text-sm text-neutral-400">{session?.user?.name}</div>
                    </div>
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
                    )}
                    <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Today&apos;s Tasks Completed</label>
                        <textarea
                            rows={6}
                            value={tasksToday}
                            onChange={(e) => setTasksToday(e.target.value)}
                            placeholder="What did you accomplish today?"
                            className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-black placeholder-neutral-300 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                            style={{ minHeight: '150px' }}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Tomorrow&apos;s Plan</label>
                        <textarea
                            rows={6}
                            value={planTomorrow}
                            onChange={(e) => setPlanTomorrow(e.target.value)}
                            placeholder="What are your goals for tomorrow?"
                            className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-black placeholder-neutral-300 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                            style={{ minHeight: '150px' }}
                        />
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full rounded-lg bg-black px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : existingReport ? 'Update Report' : 'Submit Report'}
                    </button>
                    <div className="text-center">
                        <Link href="/reports" className="text-sm text-neutral-400 hover:text-black">Cancel</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
