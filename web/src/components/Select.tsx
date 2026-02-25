'use client';

import { useState, useRef, useEffect } from 'react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function Select({ options, value, onChange, placeholder = 'Select...' }: SelectProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const selected = options.find((o) => o.value === value);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`flex h-9 min-w-[140px] items-center justify-between gap-2 rounded-lg border bg-white px-3.5 text-sm transition-all ${open ? 'border-black' : 'border-[#E5E5E5] hover:border-neutral-400'
                    }`}
            >
                <span className={selected ? 'text-black' : 'text-neutral-400'}>
                    {selected ? selected.label : placeholder}
                </span>
                {/* Chevron */}
                <svg
                    className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8l5 5 5-5" />
                </svg>
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 mt-1.5 min-w-full overflow-hidden rounded-xl border border-[#E5E5E5] bg-white py-1 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setOpen(false);
                            }}
                            className={`flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm transition-colors hover:bg-[#F7F7F7] ${option.value === value ? 'font-medium text-black' : 'text-neutral-600'
                                }`}
                        >
                            {option.value === value && (
                                <svg className="h-3.5 w-3.5 shrink-0 text-black" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 111.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                            {option.value !== value && <span className="w-3.5" />}
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
