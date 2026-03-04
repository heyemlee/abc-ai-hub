'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const generalNav = [
    { name: 'Daily Reports', href: '/reports' },
    { name: 'Customers', href: '/customers' },
    { name: 'Pipeline', href: '/pipeline' },
    { name: 'Knowledge Base', href: '/knowledge' },
];

const adminNav = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Export', href: '/export' },
    { name: 'Photo Management', href: '/admin/photos' },
    { name: 'Staff Management', href: '/admin/users' },
];

const comingSoon = [
    { name: 'Analytics' },
    { name: 'AI Assistant' },
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

    const navItem = (item: { name: string; href: string }) => (
        <Link
            key={item.href}
            href={item.href}
            className={`mb-1 flex items-center rounded-full px-4 py-2.5 text-[15px] font-medium transition-all ${isActive(item.href)
                ? 'bg-black text-white'
                : 'text-neutral-800 hover:text-black'
                }`}
        >
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
                                className="mb-1 flex cursor-not-allowed items-center rounded-full px-4 py-2.5 text-[15px] font-medium text-neutral-300"
                            >
                                {item.name}
                            </div>
                        ))}
                    </div>
                </nav>

                {/* User section at bottom */}
                <div className="border-t border-[#E8E8E8] px-5 py-4">
                    <button
                        onClick={openProfile}
                        className="mb-3 flex w-full items-center gap-2.5 rounded-lg p-1 -ml-1 transition-colors hover:bg-[#EFEFEF]"
                    >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white ${role === 'admin' ? 'bg-black' : 'bg-neutral-500'}`}>
                            {initial}
                        </div>
                        <div className="text-left">
                            <p className="text-[14px] font-medium text-black">
                                {userName}
                            </p>
                            <p className="text-[11px] text-neutral-400 capitalize">{role}</p>
                        </div>
                        <svg className="ml-auto h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
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
