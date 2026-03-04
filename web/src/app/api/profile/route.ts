import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { firstName, lastName } = body;

    if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
        return NextResponse.json({ error: 'First name is required' }, { status: 400 });
    }

    const name = lastName?.trim()
        ? `${firstName.trim()} ${lastName.trim()}`
        : firstName.trim();

    const updated = await prisma.user.update({
        where: { id: session.user.id },
        data: { name },
        select: { id: true, name: true },
    });

    return NextResponse.json(updated);
}
