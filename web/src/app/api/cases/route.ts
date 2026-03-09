import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    const isAdmin = session!.user.role === 'ADMIN';
    const userId = session!.user.id;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Non-admin users only see cases they are a member of
    if (!isAdmin) {
        where.members = { some: { userId } };
    }

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const cases = await prisma.case.findMany({
        where,
        include: {
            createdBy: { select: { id: true, name: true } },
            customer: { select: { id: true, name: true } },
            members: {
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            },
            _count: { select: { photos: true, activities: true } },
        },
        orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(cases);
}

export async function POST(req: NextRequest) {
    const { error, session } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const { title, clientName, clientPhone, clientEmail, description, customerId } = body;

    if (!title || !clientName) {
        return NextResponse.json({ error: 'title and clientName are required' }, { status: 400 });
    }

    const userId = session!.user.id;

    // Create case + auto-add creator as OWNER member + activity log
    const newCase = await prisma.case.create({
        data: {
            title,
            clientName,
            clientPhone: clientPhone || null,
            clientEmail: clientEmail || null,
            customerId: customerId || null,
            createdById: userId,
            description: description || null,
            members: {
                create: {
                    userId,
                    role: 'OWNER',
                },
            },
            activities: {
                create: {
                    userId,
                    type: 'note',
                    content: 'Case created',
                },
            },
        },
        include: {
            createdBy: { select: { id: true, name: true } },
            customer: { select: { id: true, name: true } },
            members: {
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            },
            _count: { select: { photos: true, activities: true } },
        },
    });

    return NextResponse.json(newCase, { status: 201 });
}
