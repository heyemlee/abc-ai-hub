'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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
    const router = useRouter();
    const { data: session } = useSession();

    const role = session?.user?.role === 'ADMIN' ? 'admin' : 'user';
    const userName = session?.user?.name || 'User';
    const initial = userName.charAt(0).toUpperCase();

    const isActive = (href: string) => {
        if (href === '/reports') return pathname === '/reports' || pathname.startsWith('/reports/');
        if (href === '/customers') return pathname === '/customers' || pathname.startsWith('/customers/');
        if (href === '/knowledge') return pathname === '/knowledge' || pathname.startsWith('/knowledge/');
        return pathname === href;
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
                <div className="mb-3 flex items-center gap-2.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold text-white ${role === 'admin' ? 'bg-black' : 'bg-neutral-500'}`}>
                        {initial}
                    </div>
                    <div>
                        <p className="text-[14px] font-medium text-black">
                            {userName}
                        </p>
                        <p className="text-[11px] text-neutral-400 capitalize">{role}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
