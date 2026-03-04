import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getToday } from '@/lib/date';

function getCurrentMonth() {
    const today = getToday();
    return `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function GET() {
    const { error } = await requireAdmin();
    if (error) return error;

    const prevMonth = getCurrentMonth();

    // Customer photos
    const photos = await prisma.customerPhoto.findMany({
        where: { photoMonth: prevMonth },
        include: {
            staff: { select: { id: true, name: true } },
            customer: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    // Call screenshots
    const screenshots = await prisma.callScreenshot.findMany({
        where: { photoMonth: prevMonth },
        include: {
            user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    // Group by staff
    const grouped: Record<string, {
        staffName: string;
        photos: Array<{
            id: string;
            storageUrl: string;
            filename: string;
            customerName: string;
            createdAt: Date;
            type: 'customer' | 'screenshot';
        }>;
    }> = {};

    photos.forEach((p) => {
        const staffId = p.staffId;
        if (!grouped[staffId]) {
            grouped[staffId] = { staffName: p.staff.name || 'Unknown', photos: [] };
        }
        grouped[staffId].photos.push({
            id: p.id,
            storageUrl: p.storageUrl,
            filename: p.filename,
            customerName: p.customer.name,
            createdAt: p.createdAt,
            type: 'customer',
        });
    });

    screenshots.forEach((s) => {
        const staffId = s.userId;
        if (!grouped[staffId]) {
            grouped[staffId] = { staffName: s.user.name || 'Unknown', photos: [] };
        }
        grouped[staffId].photos.push({
            id: s.id,
            storageUrl: s.storageUrl,
            filename: s.filename,
            customerName: 'Call Record',
            createdAt: s.createdAt,
            type: 'screenshot',
        });
    });

    const result = Object.entries(grouped).map(([, data]) => ({
        name: data.staffName,
        count: data.photos.length,
        photos: data.photos,
    }));

    return NextResponse.json({ month: prevMonth, staff: result });
}

export async function DELETE() {
    const { error, session } = await requireAdmin();
    if (error) return error;

    const prevMonth = getCurrentMonth();

    const photos = await prisma.customerPhoto.findMany({
        where: { photoMonth: prevMonth },
        select: { id: true, storageUrl: true },
    });

    const screenshots = await prisma.callScreenshot.findMany({
        where: { photoMonth: prevMonth },
        select: { id: true, storageUrl: true },
    });

    // Delete from Supabase Storage
    const allItems = [...photos, ...screenshots];
    const paths = allItems.map((p) => {
        const urlParts = p.storageUrl.split('/storage/v1/object/public/uploads/');
        return urlParts[1] || '';
    }).filter(Boolean);

    if (paths.length > 0) {
        await getSupabaseAdmin().storage.from('uploads').remove(paths);
    }

    // Delete from database
    await prisma.customerPhoto.deleteMany({
        where: { photoMonth: prevMonth },
    });
    await prisma.callScreenshot.deleteMany({
        where: { photoMonth: prevMonth },
    });

    // Update cleanup log
    await prisma.photoCleanupLog.upsert({
        where: { month: prevMonth },
        create: {
            month: prevMonth,
            confirmedBy: session!.user.id,
            confirmedAt: new Date(),
            deletedAt: new Date(),
        },
        update: {
            confirmedBy: session!.user.id,
            confirmedAt: new Date(),
            deletedAt: new Date(),
        },
    });

    return NextResponse.json({ success: true, deletedCount: photos.length });
}
