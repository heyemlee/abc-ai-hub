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

    const caseData = await prisma.case.findUnique({ where: { id: caseId } });
    if (!caseData) {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Only owner or admin can share
    if (!isAdmin) {
        const ownerMember = await prisma.caseMember.findUnique({
            where: { caseId_userId: { caseId, userId } },
        });
        if (!ownerMember || ownerMember.role !== 'OWNER') {
            return NextResponse.json({ error: 'Only owner or admin can add members' }, { status: 403 });
        }
    }

    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId) {
        return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    // Verify user exists
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already a member
    const existing = await prisma.caseMember.findUnique({
        where: { caseId_userId: { caseId, userId: targetUserId } },
    });
    if (existing) {
        return NextResponse.json({ error: 'User is already a member of this case' }, { status: 409 });
    }

    // Add member
    const member = await prisma.caseMember.create({
        data: {
            caseId,
            userId: targetUserId,
            role: 'COLLABORATOR',
        },
        include: {
            user: { select: { id: true, name: true, email: true } },
        },
    });

    // Log activity
    await prisma.caseActivity.create({
        data: {
            caseId,
            userId,
            type: 'member_added',
            content: `Added ${targetUser.name || targetUser.email} as collaborator`,
        },
    });

    return NextResponse.json(member, { status: 201 });
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { id: caseId } = await params;
    const isAdmin = session!.user.role === 'ADMIN';
    const userId = session!.user.id;

    // Only owner or admin can remove members
    if (!isAdmin) {
        const ownerMember = await prisma.caseMember.findUnique({
            where: { caseId_userId: { caseId, userId } },
        });
        if (!ownerMember || ownerMember.role !== 'OWNER') {
            return NextResponse.json({ error: 'Only owner or admin can remove members' }, { status: 403 });
        }
    }

    const { searchParams } = req.nextUrl;
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
        return NextResponse.json({ error: 'userId query param is required' }, { status: 400 });
    }

    // Can't remove owner
    const targetMember = await prisma.caseMember.findUnique({
        where: { caseId_userId: { caseId, userId: targetUserId } },
    });
    if (!targetMember) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    if (targetMember.role === 'OWNER') {
        return NextResponse.json({ error: 'Cannot remove the owner' }, { status: 400 });
    }

    const removedUser = await prisma.user.findUnique({ where: { id: targetUserId } });

    await prisma.caseMember.delete({
        where: { caseId_userId: { caseId, userId: targetUserId } },
    });

    // Log activity
    await prisma.caseActivity.create({
        data: {
            caseId,
            userId,
            type: 'member_removed',
            content: `Removed ${removedUser?.name || removedUser?.email || targetUserId} from case`,
        },
    });

    return NextResponse.json({ success: true });
}
