import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
    const { error } = await requireAdmin();
    if (error) return error;

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
            image: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(users);
}
