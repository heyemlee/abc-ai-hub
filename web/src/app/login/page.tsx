'use client';

import { signIn } from 'next-auth/react';

export default function LoginPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAFAFA] font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute left-1/2 top-0 -z-10 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-neutral-200/40 to-white/5 blur-[120px]" />
            <div className="absolute bottom-0 right-0 -z-10 h-[600px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full bg-gradient-to-tl from-neutral-300/30 to-white/5 blur-[100px]" />

            <div className="w-full max-w-sm px-6">
                <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-10 shadow-2xl shadow-black/[0.04] backdrop-blur-xl">
                    {/* Brand Icon */}
                    <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-black text-white shadow-lg shadow-black/20">
                        {/* Cabinet / Cupboard Icon */}
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h16.5m-16.5 0v15m16.5-15v15m-16.5 15h16.5m-16.5 0V12m16.5 7.5V12m-16.5-7.5v7.5m16.5-7.5v7.5M12 4.5v15m-2.25-9.75v3m4.5-3v3" />
                        </svg>
                    </div>

                    {/* Title Area */}
                    <div className="mb-10 text-center">
                        <h1 className="mb-2 text-[22px] font-bold tracking-tight text-black">ABC AI HUB</h1>
                        <p className="text-[13px] font-medium text-neutral-400">Internal Sales Management System</p>
                    </div>

                    {/* Google Sign In Button */}
                    <button
                        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                        className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-[#E5E5E5] bg-white px-6 py-3.5 text-[14px] font-medium text-black transition-all hover:border-black hover:bg-[#FAFAFA] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                    >
                        <span className="absolute inset-0 bg-neutral-50 opacity-0 transition-opacity group-hover:opacity-100" />
                        <svg className="relative z-10 h-5 w-5 shrink-0" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span className="relative z-10">Continue with Google</span>
                    </button>

                    <div className="mt-8 text-center text-[12px] text-neutral-400">
                        <span className="whitespace-nowrap">Only authorized team members can access</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
