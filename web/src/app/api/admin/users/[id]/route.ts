import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await req.json();

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deactivating admin users
    if (user.role === 'ADMIN' && body.active === false) {
        return NextResponse.json({ error: 'Cannot deactivate admin users' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.active !== undefined) updateData.active = body.active;

    const updated = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
            image: true,
        },
    });

    return NextResponse.json(updated);
}
