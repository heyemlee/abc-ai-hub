import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { CASE_STATUS_LABELS, CaseStatusEnum } from '@/lib/types';

async function canAccessCase(caseId: string, userId: string, isAdmin: boolean) {
    if (isAdmin) return true;
    const member = await prisma.caseMember.findUnique({
        where: { caseId_userId: { caseId, userId } },
    });
    return !!member;
}

async function isOwnerOrAdmin(caseId: string, userId: string, isAdmin: boolean) {
    if (isAdmin) return true;
    const member = await prisma.caseMember.findUnique({
        where: { caseId_userId: { caseId, userId } },
    });
    return member?.role === 'OWNER';
}

const fullCaseInclude = {
    createdBy: { select: { id: true, name: true } },
    members: {
        include: {
            user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { addedAt: 'asc' as const },
    },
    statusHistory: {
        orderBy: { createdAt: 'desc' as const },
        include: { user: { select: { name: true } } },
    },
    photos: {
        orderBy: { createdAt: 'desc' as const },
        include: { uploader: { select: { name: true } } },
    },
    activities: {
        orderBy: { createdAt: 'desc' as const },
        include: { user: { select: { name: true } } },
        take: 50,
    },
};

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const isAdmin = session!.user.role === 'ADMIN';
    const userId = session!.user.id;

    const caseData = await prisma.case.findUnique({
        where: { id },
        include: fullCaseInclude,
    });

    if (!caseData) {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (!await canAccessCase(id, userId, isAdmin)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(caseData);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const isAdmin = session!.user.role === 'ADMIN';
    const userId = session!.user.id;

    const caseData = await prisma.case.findUnique({ where: { id } });
    if (!caseData) {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Members can update status; only owner/admin can edit info
    if (!await canAccessCase(id, userId, isAdmin)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, clientName, clientPhone, clientEmail, status, statusNote } = body;

    // Only owner/admin can edit title, description, and client info
    if ((title !== undefined || description !== undefined || clientName !== undefined || clientPhone !== undefined || clientEmail !== undefined) && !await isOwnerOrAdmin(id, userId, isAdmin)) {
        return NextResponse.json({ error: 'Only owner or admin can edit case info' }, { status: 403 });
    }

    // If status is changing, record history and activity
    if (status !== undefined && status !== caseData.status) {
        const fromLabel = CASE_STATUS_LABELS[caseData.status as CaseStatusEnum];
        const toLabel = CASE_STATUS_LABELS[status as CaseStatusEnum];

        await prisma.caseStatusHistory.create({
            data: {
                caseId: id,
                userId,
                fromStatus: caseData.status,
                toStatus: status,
                note: statusNote || null,
            },
        });

        await prisma.caseActivity.create({
            data: {
                caseId: id,
                userId,
                type: 'status_change',
                content: `Status changed from ${fromLabel} to ${toLabel}${statusNote ? ': ' + statusNote : ''}`,
            },
        });
    }

    const updated = await prisma.case.update({
        where: { id },
        data: {
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
            ...(clientName !== undefined && { clientName }),
            ...(clientPhone !== undefined && { clientPhone }),
            ...(clientEmail !== undefined && { clientEmail }),
            ...(status !== undefined && { status }),
        },
        include: fullCaseInclude,
    });

    return NextResponse.json(updated);
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const isAdmin = session!.user.role === 'ADMIN';
    const userId = session!.user.id;

    const caseData = await prisma.case.findUnique({ where: { id } });
    if (!caseData) {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (!await isOwnerOrAdmin(id, userId, isAdmin)) {
        return NextResponse.json({ error: 'Only owner or admin can delete a case' }, { status: 403 });
    }

    await prisma.case.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
