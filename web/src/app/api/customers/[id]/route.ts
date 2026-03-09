import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const isAdmin = session!.user.role === 'ADMIN';

    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, name: true } },
            photos: {
                orderBy: { createdAt: 'desc' },
                include: { staff: { select: { name: true } } },
            },
            statusHistory: {
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true } } },
            },
            cases: {
                orderBy: { updatedAt: 'desc' },
                include: {
                    members: {
                        include: {
                            user: { select: { id: true, name: true, email: true } },
                        },
                    },
                    createdBy: { select: { id: true, name: true } },
                    _count: { select: { photos: true, activities: true } },
                },
            },
        },
    });

    if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (!isAdmin && customer.userId !== session!.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(customer);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const isAdmin = session!.user.role === 'ADMIN';

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (!isAdmin && customer.userId !== session!.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, source, status, phone, email, notes } = body;

    // If status is changing, record history
    if (status !== undefined && status !== customer.status) {
        await prisma.statusHistory.create({
            data: {
                customerId: id,
                userId: session!.user.id,
                fromStatus: customer.status,
                toStatus: status,
                note: body.statusNote || null,
            },
        });
    }

    const updated = await prisma.customer.update({
        where: { id },
        data: {
            ...(name !== undefined && { name }),
            ...(source !== undefined && { source }),
            ...(status !== undefined && { status }),
            ...(phone !== undefined && { phone }),
            ...(email !== undefined && { email }),
            ...(notes !== undefined && { notes }),
        },
        include: {
            user: { select: { id: true, name: true } },
            _count: { select: { photos: true } },
            statusHistory: {
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true } } },
            },
        },
    });

    return NextResponse.json(updated);
}
