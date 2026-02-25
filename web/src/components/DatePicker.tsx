'use client';

import { useState, useRef, useEffect } from 'react';

interface DatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    placeholder?: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toDisplay(value: string): string {
    if (!value) return '';
    const [y, m, d] = value.split('-').map(Number);
    return `${MONTHS[m - 1].slice(0, 3)} ${d}, ${y}`;
}

function today(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function DatePicker({ value, onChange, placeholder = 'Pick a date' }: DatePickerProps) {
    const [open, setOpen] = useState(false);
    const todayStr = today();

    // Calendar view state — default to the selected date's month, or today
    const [viewYear, setViewYear] = useState(() => {
        if (value) return parseInt(value.split('-')[0]);
        const now = new Date();
        return now.getFullYear();
    });
    const [viewMonth, setViewMonth] = useState(() => {
        if (value) return parseInt(value.split('-')[1]) - 1;
        return new Date().getMonth();
    });

    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Build day grid
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const selectDay = (day: number) => {
        const val = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onChange(val);
        setOpen(false);
    };

    const cellStr = (day: number) =>
        `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return (
        <div ref={ref} className="relative">
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={`flex h-9 min-w-[168px] items-center justify-between gap-2 rounded-lg border bg-white px-3.5 text-sm transition-all ${open ? 'border-black' : 'border-[#E5E5E5] hover:border-neutral-400'
                    }`}
            >
                <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 shrink-0 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className={value ? 'text-black' : 'text-neutral-400'}>
                        {value ? toDisplay(value) : placeholder}
                    </span>
                </div>
                {value && (
                    <span
                        role="button"
                        onClick={(e) => { e.stopPropagation(); onChange(''); }}
                        className="text-neutral-300 hover:text-black"
                    >
                        ×
                    </span>
                )}
            </button>

            {/* Calendar dropdown */}
            {open && (
                <div className="absolute left-0 top-full z-50 mt-1.5 w-[280px] overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
                    {/* Month/year header */}
                    <div className="flex items-center justify-between border-b border-[#F0F0F0] px-4 py-3">
                        <button
                            type="button"
                            onClick={prevMonth}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-[#F7F7F7] hover:text-black"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 15l-5-5 5-5" />
                            </svg>
                        </button>
                        <span className="text-[13px] font-semibold text-black">
                            {MONTHS[viewMonth]} {viewYear}
                        </span>
                        <button
                            type="button"
                            onClick={nextMonth}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-[#F7F7F7] hover:text-black"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 5l5 5-5 5" />
                            </svg>
                        </button>
                    </div>

                    {/* Day grid */}
                    <div className="p-3">
                        {/* Weekday headers */}
                        <div className="mb-1 grid grid-cols-7">
                            {DAYS.map(d => (
                                <div key={d} className="flex items-center justify-center py-1 text-[11px] font-semibold text-neutral-400">
                                    {d}
                                </div>
                            ))}
                        </div>
                        {/* Day cells */}
                        <div className="grid grid-cols-7 gap-y-0.5">
                            {cells.map((day, i) => {
                                if (!day) return <div key={`empty-${i}`} />;
                                const str = cellStr(day);
                                const isSelected = str === value;
                                const isToday = str === todayStr;
                                return (
                                    <button
                                        key={str}
                                        type="button"
                                        onClick={() => selectDay(day)}
                                        className={`flex h-8 w-8 mx-auto items-center justify-center rounded-full text-[13px] transition-colors ${isSelected
                                                ? 'bg-black text-white'
                                                : isToday
                                                    ? 'border border-black text-black font-semibold'
                                                    : 'text-neutral-700 hover:bg-[#F7F7F7]'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer: Today shortcut */}
                    <div className="border-t border-[#F0F0F0] px-4 py-2.5">
                        <button
                            type="button"
                            onClick={() => { onChange(todayStr); setOpen(false); }}
                            className="text-[12px] font-medium text-neutral-500 hover:text-black"
                        >
                            Today
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
