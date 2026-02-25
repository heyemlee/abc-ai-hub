import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    const report = await prisma.dailyReport.findUnique({ where: { id } });
    if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Only owner can edit
    if (report.userId !== session!.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only today's report can be edited
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reportDate = new Date(report.reportDate);
    reportDate.setHours(0, 0, 0, 0);

    if (reportDate.getTime() !== today.getTime()) {
        return NextResponse.json({ error: 'Can only edit today\'s report' }, { status: 403 });
    }

    const body = await req.json();
    const { tasksToday, planTomorrow } = body;

    const updated = await prisma.dailyReport.update({
        where: { id },
        data: {
            ...(tasksToday !== undefined && { tasksToday }),
            ...(planTomorrow !== undefined && { planTomorrow }),
        },
        include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json(updated);
}
