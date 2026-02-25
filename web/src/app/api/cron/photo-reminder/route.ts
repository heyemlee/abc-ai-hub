import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;

    // Check if previous month has photos
    const photoCount = await prisma.customerPhoto.count({
        where: { photoMonth: prevMonth },
    });

    if (photoCount === 0) {
        return NextResponse.json({ message: 'No photos for previous month', month: prevMonth });
    }

    // Check if already cleaned up
    const cleanupLog = await prisma.photoCleanupLog.findUnique({
        where: { month: prevMonth },
    });

    if (cleanupLog?.deletedAt) {
        return NextResponse.json({ message: 'Already cleaned up', month: prevMonth });
    }

    // Update reminder log
    await prisma.photoCleanupLog.upsert({
        where: { month: prevMonth },
        create: { month: prevMonth, remindedAt: new Date() },
        update: { remindedAt: new Date() },
    });

    // Send email to all admins
    const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', active: true },
        select: { email: true },
    });

    if (process.env.RESEND_API_KEY && admins.length > 0) {
        try {
            const { Resend } = await import('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);

            const monthName = prev.toLocaleString('en-US', { month: 'long', year: 'numeric' });

            await resend.emails.send({
                from: 'CabinetSales <noreply@resend.dev>',
                to: admins.map((a) => a.email),
                subject: `[CabinetSales] ⚠️ ${monthName} Photos Pending Review`,
                html: `
          <h2>Photo Review Reminder</h2>
          <p>There are <strong>${photoCount}</strong> photos from <strong>${monthName}</strong> pending review.</p>
          <p>Please log in to review and delete last month's photos.</p>
          <p><a href="${process.env.NEXTAUTH_URL}/admin/photos">Go to Photo Management →</a></p>
        `,
            });
        } catch (e) {
            console.error('Failed to send reminder email:', e);
        }
    }

    return NextResponse.json({
        message: 'Reminder sent',
        month: prevMonth,
        photoCount,
        adminCount: admins.length,
    });
}
