'use client';

import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const pageTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/reports': 'Daily Reports',
    '/reports/new': "Submit Today's Report",
    '/customers': 'Customers',
    '/customers/new': 'Add New Customer',
    '/export': 'Export Data',
    '/pipeline': 'Pipeline',
    '/knowledge': 'Docs',
    '/admin/photos': 'Photo Management',
    '/admin/users': 'Staff Management',
};

export default function TopBar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    let title = pageTitles[pathname] || '';
    if (pathname.startsWith('/customers/') && pathname !== '/customers/new') {
        title = pathname.endsWith('/edit') ? 'Edit Customer' : 'Customer Details';
    }
    if (pathname.startsWith('/reports/') && pathname !== '/reports/new' && !pageTitles[pathname]) {
        title = 'Report Details';
    }

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#E5E5E5] bg-white px-8">
            <h1 className="text-sm font-semibold text-black">{title}</h1>
            {/* Top right space reserved for page-specific actions instead of user profile */}
            <div className="flex items-center gap-4"></div>
        </header>
    );
}
