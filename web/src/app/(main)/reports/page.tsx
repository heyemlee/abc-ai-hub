'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DailyReport, User } from '@/lib/types';
import Select from '@/components/Select';
import DatePicker from '@/components/DatePicker';

interface UploadedFile {
    id: string;
    name: string;
    preview: string;
    size: string;
    file: File;
}

export default function ReportsPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const todayStr = new Date().toISOString().split('T')[0];
    const [staff, setStaff] = useState('');
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(todayStr);
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Upload panel state
    const [showUpload, setShowUpload] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isAdmin = session?.user?.role === 'ADMIN';

    const fetchReports = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (staff) params.set('userId', staff);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        fetch(`/api/reports?${params}`)
            .then((r) => r.json())
            .then((data) => { setReports(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [staff, startDate, endDate]);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    useEffect(() => {
        if (isAdmin) {
            fetch('/api/admin/users').then((r) => r.json()).then(setUsers).catch(() => { });
        }
    }, [isAdmin]);

    const staffOptions = [
        { value: '', label: 'All Staff' },
        ...users.map((u) => ({ value: u.id, label: u.name || u.email })),
    ];

    const truncate = (text: string, maxLen: number) =>
        text.length > maxLen ? text.substring(0, maxLen) + '...' : text;

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const processFiles = (files: FileList) => {
        const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
            id: Math.random().toString(36).slice(2),
            name: file.name,
            preview: URL.createObjectURL(file),
            size: formatSize(file.size),
            file,
        }));
        setUploadedFiles((prev) => [...prev, ...newFiles]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(e.target.files);
            e.target.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
    };

    const removeFile = (id: string) => {
        setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const handleSubmitUpload = () => {
        // TODO: implement file upload to a general screenshots endpoint
        setUploadSuccess(true);
        setTimeout(() => {
            setUploadSuccess(false);
            setUploadedFiles([]);
            setShowUpload(false);
        }, 2000);
    };

    const canEdit = (report: DailyReport) => {
        const today = new Date().toISOString().split('T')[0];
        const reportDate = new Date(report.reportDate).toISOString().split('T')[0];
        return report.userId === session?.user?.id && reportDate === today;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-end gap-3">
                <button
                    onClick={() => setShowUpload((v) => !v)}
                    className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${showUpload
                        ? 'border-black bg-black text-white'
                        : 'border-[#E5E5E5] bg-white text-neutral-600 hover:border-black hover:text-black'
                        }`}
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Upload Screenshots
                </button>
                <Link href="/reports/new">
                    <button className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
                        Submit Today&apos;s Report
                    </button>
                </Link>
            </div>

            {/* Upload Panel */}
            {showUpload && (
                <div className="rounded-xl border border-[#E5E5E5] bg-white p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-[14px] font-semibold text-black">Upload Call Record Screenshots</h3>
                            <p className="text-[12px] text-neutral-400 mt-0.5">Upload your daily call log screenshots before end of day</p>
                        </div>
                        <button onClick={() => setShowUpload(false)} className="text-neutral-400 hover:text-black transition-colors">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {uploadSuccess ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                <svg className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 111.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-[14px] font-semibold text-black">Screenshots uploaded successfully</p>
                        </div>
                    ) : (
                        <>
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`mb-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition-colors ${isDragging
                                    ? 'border-black bg-[#F7F7F7]'
                                    : 'border-[#E5E5E5] bg-[#FAFAFA] hover:border-neutral-400'
                                    }`}
                            >
                                <svg className="mb-3 h-8 w-8 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                                </svg>
                                <p className="text-sm font-medium text-neutral-500">Drop images here or <span className="text-black underline">browse</span></p>
                                <p className="mt-1 text-[11px] text-neutral-400">PNG, JPG up to 10MB</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            {uploadedFiles.length > 0 && (
                                <div className="mb-4 space-y-2">
                                    {uploadedFiles.map((file) => (
                                        <div key={file.id} className="flex items-center gap-3 rounded-lg border border-[#E5E5E5] p-2">
                                            <img src={file.preview} alt={file.name} className="h-12 w-12 rounded-md object-cover" />
                                            <div className="flex-1 min-w-0">
                                                <p className="truncate text-[13px] font-medium text-black">{file.name}</p>
                                                <p className="text-[11px] text-neutral-400">{file.size}</p>
                                            </div>
                                            <button onClick={() => removeFile(file.id)} className="shrink-0 text-neutral-400 hover:text-red-500 transition-colors">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {uploadedFiles.length > 0 && (
                                <button
                                    onClick={handleSubmitUpload}
                                    className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
                                >
                                    Upload {uploadedFiles.length} Screenshot{uploadedFiles.length > 1 ? 's' : ''}
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4">
                {isAdmin && (
                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Staff</label>
                        <Select options={staffOptions} value={staff} onChange={setStaff} placeholder="All Staff" />
                    </div>
                )}
                <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Start Date</label>
                    <DatePicker value={startDate} onChange={setStartDate} placeholder="Start date" />
                </div>
                <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">End Date</label>
                    <DatePicker value={endDate} onChange={setEndDate} placeholder="End date" />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-[#E5E5E5]">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-sm text-neutral-400">Loading...</div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#FAFAFA]">
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Date</th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Staff</th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Today&apos;s Tasks</th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Tomorrow&apos;s Plan</th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((report) => (
                                <tr key={report.id} className="cursor-pointer border-t border-[#E5E5E5] transition-colors hover:bg-[#FAFAFA]">
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-700">{new Date(report.reportDate).toLocaleDateString('en-US')}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-700">{report.user?.name}</td>
                                    <td className="px-6 py-4 text-sm text-neutral-600">{truncate(report.tasksToday, 80)}</td>
                                    <td className="px-6 py-4 text-sm text-neutral-600">{truncate(report.planTomorrow, 80)}</td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        {canEdit(report) ? (
                                            <Link href="/reports/new">
                                                <button className="rounded-md border border-[#E5E5E5] bg-white px-3 py-1 text-[12px] font-medium text-neutral-600 hover:border-black hover:text-black">
                                                    Edit
                                                </button>
                                            </Link>
                                        ) : (
                                            <span className="text-[12px] text-neutral-400">View</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {reports.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-neutral-400">No reports found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
