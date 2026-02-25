import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import ExcelJS from 'exceljs';

export async function GET(req: NextRequest) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('userId');

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;

    const customers = await prisma.customer.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Customer Records');

    sheet.columns = [
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Source', key: 'source', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Phone', key: 'phone', width: 18 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Notes', key: 'notes', width: 40 },
        { header: 'Created By', key: 'createdBy', width: 18 },
        { header: 'Created Date', key: 'createdDate', width: 15 },
    ];

    sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DBEAFE' } };
    });

    customers.forEach((c) => {
        sheet.addRow({
            name: c.name,
            source: c.source,
            status: c.status,
            phone: c.phone || '',
            email: c.email || '',
            notes: c.notes || '',
            createdBy: c.user.name || 'Unknown',
            createdDate: new Date(c.createdAt).toLocaleDateString('en-US'),
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as ArrayBuffer, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="customer-records-export.xlsx"',
        },
    });
}
