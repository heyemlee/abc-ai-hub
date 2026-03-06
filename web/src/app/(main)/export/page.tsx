'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User } from '@/lib/types';
import Select from '@/components/Select';
import DatePicker from '@/components/DatePicker';

export default function ExportPage() {
    const { data: session } = useSession();
    // 用 LA 时区计算 "今天" 的日期字符串
    const todayStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    const [reportStaff, setReportStaff] = useState('');
    const [customerStaff, setCustomerStaff] = useState('');
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(todayStr);
    const [users, setUsers] = useState<User[]>([]);
    const [exportingReports, setExportingReports] = useState(false);
    const [exportingCustomers, setExportingCustomers] = useState(false);

    useEffect(() => {
        fetch('/api/admin/users').then((r) => r.json()).then(setUsers).catch(() => { });
    }, []);

    const staffOptions = [
        { value: '', label: 'All Staff' },
        ...users.map((u) => ({ value: u.id, label: u.name || u.email })),
    ];

    const handleExportReports = async () => {
        setExportingReports(true);
        const params = new URLSearchParams();
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        if (reportStaff) params.set('userId', reportStaff);

        const res = await fetch(`/api/export/reports?${params}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `daily-reports-${todayStr}.docx`;
        a.click();
        URL.revokeObjectURL(url);
        setExportingReports(false);
    };

    const handleExportCustomers = async () => {
        setExportingCustomers(true);
        const params = new URLSearchParams();
        if (customerStaff) params.set('userId', customerStaff);

        const res = await fetch(`/api/export/customers?${params}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'customer-records-export.xlsx';
        a.click();
        URL.revokeObjectURL(url);
        setExportingCustomers(false);
    };

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-[#E5E5E5] p-8">
                <h2 className="mb-1 text-base font-semibold text-black">Daily Reports</h2>
                <p className="mb-6 text-sm text-neutral-500">Export staff daily reports for a selected date range.</p>
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Start Date</label>
                        <DatePicker value={startDate} onChange={setStartDate} />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">End Date</label>
                        <DatePicker value={endDate} onChange={setEndDate} />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Staff</label>
                        <Select options={staffOptions} value={reportStaff} onChange={setReportStaff} placeholder="All Staff" />
                    </div>
                    <button
                        onClick={handleExportReports}
                        disabled={exportingReports}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        {exportingReports ? 'Exporting...' : 'Export to Word'}
                    </button>
                    <p className="text-[11px] text-neutral-400">Table format with Name, Today&apos;s Task, Tomorrow&apos;s Task columns.</p>
                </div>
            </div>

            <div className="rounded-xl border border-[#E5E5E5] p-8">
                <h2 className="mb-1 text-base font-semibold text-black">Customer Records</h2>
                <p className="mb-6 text-sm text-neutral-500">Export all customer records. Filter by staff member.</p>
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Staff</label>
                        <Select options={staffOptions} value={customerStaff} onChange={setCustomerStaff} placeholder="All Staff" />
                    </div>
                    <button
                        onClick={handleExportCustomers}
                        disabled={exportingCustomers}
                        className="w-full rounded-lg bg-black px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                    >
                        {exportingCustomers ? 'Exporting...' : 'Export to Excel'}
                    </button>
                    <p className="text-[11px] text-neutral-400">Exports: Name, Source, Status, Phone, Email, Notes, Created By, Date</p>
                    <p className="text-[11px] text-neutral-400">Photos are not included in exports.</p>
                </div>
            </div>
        </div>
    );
}
