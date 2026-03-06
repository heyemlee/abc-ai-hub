import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('userId');
    const source = searchParams.get('source');
    const status = searchParams.get('status');

    const isAdmin = session!.user.role === 'ADMIN';

    const where: Record<string, unknown> = {};

    if (!isAdmin) {
        where.userId = session!.user.id;
    } else if (userId) {
        where.userId = userId;
    }

    if (source) where.source = source;
    if (status) where.status = status;

    const customers = await prisma.customer.findMany({
        where,
        include: {
            user: { select: { id: true, name: true } },
            _count: { select: { photos: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
    const { error, session } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const { name, source, status, phone, email, notes } = body;

    if (!name || !source) {
        return NextResponse.json({ error: 'name and source are required' }, { status: 400 });
    }

    const customer = await prisma.customer.create({
        data: {
            userId: session!.user.id,
            name,
            source,
            status: status || 'ASKING_QUOTE',
            phone,
            email,
            notes,
        },
        include: {
            user: { select: { id: true, name: true } },
            _count: { select: { photos: true } },
        },
    });

    return NextResponse.json(customer, { status: 201 });
}
