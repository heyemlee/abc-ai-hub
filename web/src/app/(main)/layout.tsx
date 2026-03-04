'use client';

import { useSession, signOut } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <p className="text-sm text-neutral-400">Loading...</p>
            </div>
        );
    }

    if (!session) {
        redirect('/login');
    }

    const isActive = (session.user as { active?: boolean })?.active;

    if (!isActive) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="w-full max-w-sm rounded-xl border border-[#E5E5E5] p-10 text-center">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                        <svg className="h-7 w-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="mb-2 text-lg font-semibold text-black">Account Pending Activation</h2>
                    <p className="mb-6 text-sm text-neutral-500">
                        Your account has been created but is not yet activated.
                        Please contact your administrator to activate your account.
                    </p>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="rounded-lg border border-[#E5E5E5] px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:border-black hover:text-black"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-white">
            <Sidebar />
            <div className="ml-[240px] flex flex-1 flex-col">
                <TopBar />
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
