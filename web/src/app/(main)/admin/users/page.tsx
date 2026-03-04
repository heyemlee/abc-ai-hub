'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/types';

export default function StaffManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/users')
            .then((r) => r.json())
            .then((data) => { setUsers(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const toggleActive = async (user: User) => {
        const res = await fetch(`/api/admin/users/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: !user.active }),
        });
        if (res.ok) {
            const updated = await res.json();
            setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updated } : u)));
        }
        setOpenMenuId(null);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-[#E5E5E5] overflow-visible">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[#FAFAFA]">
                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Name</th>
                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Email</th>
                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Role</th>
                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Status</th>
                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-t border-[#E5E5E5] transition-colors hover:bg-[#FAFAFA]">
                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-black">{user.name}</td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-600">{user.email}</td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${user.role === 'ADMIN'
                                        ? 'bg-black text-white'
                                        : 'border border-[#E5E5E5] bg-white text-neutral-500'
                                        }`}>
                                        {user.role === 'ADMIN' ? 'Admin' : 'User'}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${user.active
                                        ? 'bg-green-50 text-green-600'
                                        : 'bg-neutral-100 text-neutral-400'
                                        }`}>
                                        {user.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    {user.role === 'ADMIN' ? (
                                        <span className="text-[12px] text-neutral-300">Protected</span>
                                    ) : (
                                        <button
                                            onClick={() => toggleActive(user)}
                                            className={`rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors ${user.active
                                                ? 'border-red-200 text-red-500 hover:border-red-400 hover:bg-red-50'
                                                : 'border-green-200 text-green-600 hover:border-green-400 hover:bg-green-50'
                                                }`}
                                        >
                                            {user.active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
