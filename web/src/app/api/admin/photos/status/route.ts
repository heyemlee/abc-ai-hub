import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

function getPreviousMonth() {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
}

export async function GET() {
    const { error } = await requireAdmin();
    if (error) return error;

    const prevMonth = getPreviousMonth();

    // Check if photos exist for previous month
    const photoCount = await prisma.customerPhoto.count({
        where: { photoMonth: prevMonth },
    });

    // Check if already cleaned up
    const cleanupLog = await prisma.photoCleanupLog.findUnique({
        where: { month: prevMonth },
    });

    const hasPendingPhotos = photoCount > 0 && !cleanupLog?.deletedAt;

    return NextResponse.json({
        hasPendingPhotos,
        pendingMonth: hasPendingPhotos ? prevMonth : null,
        photoCount: hasPendingPhotos ? photoCount : 0,
    });
}
