import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
    const { error, session } = await requireAuth();
    if (error) return error;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const report = await prisma.dailyReport.findUnique({
        where: {
            userId_reportDate: {
                userId: session!.user.id,
                reportDate: today,
            },
        },
    });

    return NextResponse.json(report);
}
