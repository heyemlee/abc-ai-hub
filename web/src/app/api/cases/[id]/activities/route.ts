import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { id: caseId } = await params;
    const isAdmin = session!.user.role === 'ADMIN';
    const userId = session!.user.id;

    // Check case exists and user is a member
    const caseData = await prisma.case.findUnique({ where: { id: caseId } });
    if (!caseData) {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (!isAdmin) {
        const member = await prisma.caseMember.findUnique({
            where: { caseId_userId: { caseId, userId } },
        });
        if (!member) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    }

    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
        return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    const activity = await prisma.caseActivity.create({
        data: {
            caseId,
            userId,
            type: 'note',
            content: content.trim(),
        },
        include: {
            user: { select: { name: true } },
        },
    });

    return NextResponse.json(activity, { status: 201 });
}
