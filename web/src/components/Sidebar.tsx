'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const generalNav = [
    {
        name: 'Daily Reports',
        href: '/reports',
        icon: (
            <svg className="mr-3 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
            </svg>
        )
    },
    {
        name: 'Customers',
        href: '/customers',
        icon: (
            <svg className="mr-3 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
        )
    },
    {
        name: 'Cases',
        href: '/cases',
        icon: (
            <svg className="mr-3 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
        )
    },
    {
        name: 'Pipeline',
        href: '/pipeline',
        icon: (
            <svg className="mr-3 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
        )
    },
    {
        name: 'Docs',
        href: '/knowledge',
        icon: (
            <svg className="mr-3 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
        )
    },
];

const adminNav = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: (
            <svg className="mr-3 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
        )
    },
    {
        name: 'Export',
        href: '/export',
        icon: (
            <svg className="mr-3 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
        )
    },
    {
        name: 'Photo Management',
        href: '/admin/photos',
        icon: (
            <svg className="mr-3 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
        )
    },
    {
        name: 'Staff Management',
        href: '/admin/users',
        icon: (
            <svg className="mr-3 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
        )
    },
];

const comingSoon = [
    {
        name: 'Analytics',
        icon: (
            <svg className="mr-3 h-5 w-5 shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
            </svg>
        )
    },
    {
        name: 'AI Assistant',
        icon: (
            <svg className="mr-3 h-5 w-5 shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
        )
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session, update: updateSession } = useSession();
    const [showProfile, setShowProfile] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const role = session?.user?.role === 'ADMIN' ? 'admin' : 'user';
    const userName = session?.user?.name || 'User';
    const initial = userName.charAt(0).toUpperCase();

    const isActive = (href: string) => {
        if (href === '/reports') return pathname === '/reports' || pathname.startsWith('/reports/');
        if (href === '/customers') return pathname === '/customers' || pathname.startsWith('/customers/');
        if (href === '/cases') return pathname === '/cases' || pathname.startsWith('/cases/');
        if (href === '/knowledge') return pathname === '/knowledge' || pathname.startsWith('/knowledge/');
        return pathname === href;
    };

    const openProfile = () => {
        const parts = userName.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
        setError('');
        setShowProfile(true);
    };

    const saveProfile = async () => {
        if (!firstName.trim()) {
            setError('First name is required');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
            });
            if (res.ok) {
                // Refresh session to pick up new name
                await updateSession();
                setShowProfile(false);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to update');
            }
        } catch {
            setError('Network error');
        } finally {
            setSaving(false);
        }
    };

    const navItem = (item: { name: string; href: string; icon: React.ReactNode }) => (
        <Link
            key={item.href}
            href={item.href}
            className={`mb-1 flex items-center rounded-lg px-4 py-2.5 text-[15px] font-medium transition-all ${isActive(item.href)
                ? 'bg-black text-white'
                : 'text-neutral-600 hover:bg-[#EFEFEF] hover:text-black'
                }`}
        >
            {item.icon}
            {item.name}
        </Link>
    );

    return (
        <>
            <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-[#E8E8E8] bg-[#F7F7F7]">
                {/* Logo */}
                <div className="flex h-16 items-center px-6">
                    <Link href={role === 'admin' ? '/dashboard' : '/reports'} className="text-xl font-bold tracking-tight text-black">
                        ABC AI HUB
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 pt-2">
                    {/* General section */}
                    <div className="mb-5">
                        <p className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                            General
                        </p>
                        {generalNav.map(navItem)}
                    </div>

                    {/* Admin section — only shown to admins */}
                    {role === 'admin' && (
                        <div className="mb-5">
                            <p className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                                Admin
                            </p>
                            {adminNav.map(navItem)}
                        </div>
                    )}

                    {/* Coming Soon section */}
                    <div>
                        <p className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                            Coming Soon
                        </p>
                        {comingSoon.map((item) => (
                            <div
                                key={item.name}
                                className="mb-1 flex cursor-not-allowed items-center rounded-lg px-4 py-2.5 text-[15px] font-medium text-neutral-400"
                            >
                                {item.icon}
                                {item.name}
                            </div>
                        ))}
                    </div>
                </nav>

                {/* User section at bottom */}
                <div className="border-t border-[#E8E8E8] p-3">
                    <button
                        onClick={openProfile}
                        className="group flex w-full items-center gap-3 rounded-xl p-2 transition-all hover:bg-[#EFEFEF]"
                    >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white shadow-sm ${role === 'admin' ? 'bg-black' : 'bg-neutral-500'}`}>
                            {initial}
                        </div>
                        <div className="flex-1 overflow-hidden text-left">
                            <p className="truncate text-[14px] font-semibold text-black">
                                {userName}
                            </p>
                            <p className="truncate text-[12px] text-neutral-500 capitalize">{role}</p>
                        </div>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors group-hover:bg-white group-hover:text-black group-hover:shadow-sm">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                            </svg>
                        </div>
                    </button>
                </div>
            </aside>

            {/* Profile Edit Modal */}
            {showProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/30" onClick={() => setShowProfile(false)} />
                    <div className="relative z-10 w-full max-w-sm rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-lg">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-[16px] font-semibold text-black">Edit Profile</h2>
                            <button onClick={() => setShowProfile(false)} className="text-neutral-400 hover:text-black transition-colors">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-[12px] font-medium text-neutral-500">
                                    First Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Enter first name"
                                    className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2.5 text-sm text-black placeholder-neutral-300 outline-none transition-colors focus:border-black"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-[12px] font-medium text-neutral-500">
                                    Last Name <span className="text-neutral-300">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Enter last name"
                                    className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2.5 text-sm text-black placeholder-neutral-300 outline-none transition-colors focus:border-black"
                                />
                            </div>

                            {error && (
                                <p className="text-[12px] text-red-500">{error}</p>
                            )}

                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => setShowProfile(false)}
                                    className="flex-1 rounded-lg border border-[#E5E5E5] px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:border-black hover:text-black"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveProfile}
                                    disabled={saving}
                                    className="flex-1 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>

                            <div className="border-t border-[#E5E5E5] pt-3">
                                <button
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
