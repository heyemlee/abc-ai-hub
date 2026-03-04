import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getToday } from '@/lib/date';

export async function GET(req: NextRequest) {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const isAdmin = session!.user.role === 'ADMIN';

    const where: Record<string, unknown> = {};

    // 所有用户（包括 admin）在 /reports 页面只看自己的记录
    where.userId = session!.user.id;

    if (startDate || endDate) {
        where.reportDate = {};
        if (startDate) (where.reportDate as Record<string, unknown>).gte = new Date(startDate);
        if (endDate) (where.reportDate as Record<string, unknown>).lte = new Date(endDate);
    }

    const reports = await prisma.dailyReport.findMany({
        where,
        include: { user: { select: { id: true, name: true } } },
        orderBy: { reportDate: 'desc' },
    });

    return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
    const { error, session } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const { tasksToday, planTomorrow } = body;

    if (!tasksToday || !planTomorrow) {
        return NextResponse.json({ error: 'tasksToday and planTomorrow are required' }, { status: 400 });
    }

    // Server-enforced reportDate = today (LA timezone)
    const today = getToday();

    // Check if already submitted today
    const existing = await prisma.dailyReport.findUnique({
        where: {
            userId_reportDate: {
                userId: session!.user.id,
                reportDate: today,
            },
        },
    });

    if (existing) {
        return NextResponse.json({ error: 'Report already submitted for today' }, { status: 409 });
    }

    const report = await prisma.dailyReport.create({
        data: {
            userId: session!.user.id,
            reportDate: today,
            tasksToday,
            planTomorrow,
        },
        include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json(report, { status: 201 });
}
