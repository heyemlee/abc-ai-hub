import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = req.nextUrl;
    const period = searchParams.get('period') || '1m';

    // Calculate date range based on period
    const now = new Date();
    let sinceDate: Date | null = null;

    if (period === 'today') {
        sinceDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === '1m') {
        sinceDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else if (period === '3m') {
        sinceDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    }
    // 'all' => sinceDate stays null

    const dateFilter = sinceDate ? { createdAt: { gte: sinceDate } } : {};

    // Walk-in this month
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const walkInThisMonth = await prisma.customer.count({
        where: { source: 'WALK_IN', createdAt: { gte: firstOfMonth } },
    });

    // Closed won by staff (in period)
    const closedWon = await prisma.customer.groupBy({
        by: ['userId'],
        where: { status: 'CLOSED_WON', ...dateFilter },
        _count: true,
    });

    const staffIds = closedWon.map((c) => c.userId);
    const staffUsers = staffIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: staffIds } },
            select: { id: true, name: true },
        })
        : [];

    const closedWonByStaff = closedWon.map((c) => ({
        name: staffUsers.find((u) => u.id === c.userId)?.name || 'Unknown',
        count: c._count,
    })).sort((a, b) => b.count - a.count);

    // Source breakdown (in period)
    const sourceGroups = await prisma.customer.groupBy({
        by: ['source'],
        where: dateFilter,
        _count: true,
    });

    const totalCustomers = sourceGroups.reduce((sum, g) => sum + g._count, 0);
    const sourceBreakdown = sourceGroups.map((g) => ({
        source: g.source,
        count: g._count,
        percentage: totalCustomers > 0 ? Math.round((g._count / totalCustomers) * 100) : 0,
    })).sort((a, b) => b.count - a.count);

    // Not submitted today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allActiveUsers = await prisma.user.findMany({
        where: { active: true },
        select: { id: true, name: true },
    });

    const submittedToday = await prisma.dailyReport.findMany({
        where: { reportDate: today },
        select: { userId: true },
    });

    const submittedUserIds = new Set(submittedToday.map((r) => r.userId));
    const notSubmittedToday = allActiveUsers
        .filter((u) => !submittedUserIds.has(u.id))
        .map((u) => ({ id: u.id, name: u.name }));

    return NextResponse.json({
        walkInThisMonth,
        closedWonByStaff,
        sourceBreakdown,
        notSubmittedToday,
        submittedToday: allActiveUsers
            .filter((u) => submittedUserIds.has(u.id))
            .map((u) => ({ id: u.id, name: u.name })),
    });
}
