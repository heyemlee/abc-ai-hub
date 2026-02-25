import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import ExcelJS from 'exceljs';

export async function GET(req: NextRequest) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = req.nextUrl;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (startDate || endDate) {
        where.reportDate = {};
        if (startDate) (where.reportDate as Record<string, unknown>).gte = new Date(startDate);
        if (endDate) (where.reportDate as Record<string, unknown>).lte = new Date(endDate);
    }

    const reports = await prisma.dailyReport.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { reportDate: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Daily Reports');

    sheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Staff Name', key: 'staffName', width: 20 },
        { header: "Today's Tasks", key: 'tasksToday', width: 50 },
        { header: "Tomorrow's Plan", key: 'planTomorrow', width: 50 },
    ];

    // Header style
    sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DBEAFE' } };
    });

    reports.forEach((r) => {
        sheet.addRow({
            date: new Date(r.reportDate).toLocaleDateString('en-US'),
            staffName: r.user.name || 'Unknown',
            tasksToday: r.tasksToday,
            planTomorrow: r.planTomorrow,
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const dateStr = new Date().toISOString().split('T')[0];

    return new NextResponse(buffer as ArrayBuffer, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="daily-reports-${dateStr}.xlsx"`,
        },
    });
}
