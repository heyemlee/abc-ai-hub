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

    const toggleRole = async (user: User) => {
        const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
        const res = await fetch(`/api/admin/users/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole }),
        });
        if (res.ok) {
            const updated = await res.json();
            setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updated } : u)));
        }
        setOpenMenuId(null);
    };

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
                        {users.map((user, index) => (
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
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                                            className="rounded-md border border-[#E5E5E5] bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-500 hover:border-black hover:text-black"
                                        >
                                            •••
                                        </button>
                                        {openMenuId === user.id && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                                <div className={`absolute right-0 z-20 w-44 rounded-lg border border-[#E5E5E5] bg-white py-1 shadow-lg ${index >= users.length - 1 ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                                                    <button
                                                        onClick={() => toggleRole(user)}
                                                        className="flex w-full items-center px-4 py-2 text-left text-[13px] text-neutral-700 hover:bg-[#F7F7F7]"
                                                    >
                                                        {user.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                                                    </button>
                                                    <button
                                                        onClick={() => toggleActive(user)}
                                                        className={`flex w-full items-center px-4 py-2 text-left text-[13px] hover:bg-[#F7F7F7] ${user.active ? 'text-red-500' : 'text-green-600'}`}
                                                    >
                                                        {user.active ? 'Deactivate' : 'Reactivate'}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
