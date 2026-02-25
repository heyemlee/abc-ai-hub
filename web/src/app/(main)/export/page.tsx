'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User } from '@/lib/types';
import Select from '@/components/Select';
import DatePicker from '@/components/DatePicker';

export default function ExportPage() {
    const { data: session } = useSession();
    const todayStr = new Date().toISOString().split('T')[0];
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
        a.download = `daily-reports-${new Date().toISOString().split('T')[0]}.xlsx`;
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
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM11.5 14c0 .83-.67 1.5-1.5 1.5H9v1.5H7.5V11H10c.83 0 1.5.67 1.5 1.5V14zm5 1.5H15v1.5h-1.5V11H16c.83 0 1.5.67 1.5 1.5v3c0 .83-.67 1.5-1.5 1.5zm-8-3v1.5h1v-1.5H8.5zm6.5 0v3h1v-3H15z" />
                        </svg>
                        {exportingReports ? 'Exporting...' : 'Export to Excel'}
                    </button>
                    <p className="text-[11px] text-neutral-400">Includes: Date, Staff Name, Today&apos;s Tasks, Tomorrow&apos;s Plan.</p>
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
