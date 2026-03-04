import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import archiver from 'archiver';
import { getToday } from '@/lib/date';

function getCurrentMonth() {
    const today = getToday();
    return `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function POST() {
    const { error } = await requireAdmin();
    if (error) return error;

    const prevMonth = getCurrentMonth();

    const photos = await prisma.customerPhoto.findMany({
        where: { photoMonth: prevMonth },
        include: {
            staff: { select: { name: true } },
            customer: { select: { name: true } },
        },
    });

    const screenshots = await prisma.callScreenshot.findMany({
        where: { photoMonth: prevMonth },
        include: {
            user: { select: { name: true } },
        },
    });

    if (photos.length === 0 && screenshots.length === 0) {
        return NextResponse.json({ error: 'No photos to download' }, { status: 404 });
    }

    // Create zip in memory
    const archive = archiver('zip', { zlib: { level: 5 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Add customer photos
    for (const photo of photos) {
        const staffName = (photo.staff.name || 'Unknown').replace(/[/\\]/g, '_');
        const customerName = photo.customer.name.replace(/[/\\]/g, '_');
        const fileName = `${customerName}_${photo.filename}`;
        const zipPath = `photos_${prevMonth.replace('-', '_')}/${staffName}/${fileName}`;

        const urlParts = photo.storageUrl.split('/storage/v1/object/public/uploads/');
        const storagePath = urlParts[1] || '';

        if (storagePath) {
            const { data } = await getSupabaseAdmin().storage.from('uploads').download(storagePath);
            if (data) {
                const buffer = Buffer.from(await data.arrayBuffer());
                archive.append(buffer, { name: zipPath });
            }
        }
    }

    // Add call screenshots
    for (const ss of screenshots) {
        const staffName = (ss.user.name || 'Unknown').replace(/[/\\]/g, '_');
        const zipPath = `photos_${prevMonth.replace('-', '_')}/${staffName}/Call_Records/${ss.filename}`;

        const urlParts = ss.storageUrl.split('/storage/v1/object/public/uploads/');
        const storagePath = urlParts[1] || '';

        if (storagePath) {
            const { data } = await getSupabaseAdmin().storage.from('uploads').download(storagePath);
            if (data) {
                const buffer = Buffer.from(await data.arrayBuffer());
                archive.append(buffer, { name: zipPath });
            }
        }
    }

    await archive.finalize();

    const zipBuffer = Buffer.concat(chunks);

    return new NextResponse(zipBuffer, {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="photos_${prevMonth.replace('-', '_')}.zip"`,
        },
    });
}
