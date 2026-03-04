import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getToday } from '@/lib/date';
import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, BorderStyle, AlignmentType, ShadingType,
} from 'docx';

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

    const noBorder = {
        top: { style: BorderStyle.NONE, size: 0 },
        bottom: { style: BorderStyle.NONE, size: 0 },
        left: { style: BorderStyle.NONE, size: 0 },
        right: { style: BorderStyle.NONE, size: 0 },
    };

    const thinBorder = {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
    };

    // Build report cards
    const children: Paragraph[] = [];

    // Title
    children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
            new TextRun({ text: 'Daily Reports', bold: true, size: 36, font: 'Arial' }),
        ],
    }));

    // Subtitle with date range
    const rangeText = startDate && endDate
        ? `${startDate} — ${endDate}`
        : startDate ? `From ${startDate}` : endDate ? `Until ${endDate}` : 'All Records';
    children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [
            new TextRun({ text: rangeText, size: 20, color: '888888', font: 'Arial' }),
        ],
    }));

    for (const report of reports) {
        const dateStr = new Date(report.reportDate).toLocaleDateString('en-US', {
            timeZone: 'UTC',
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
        const staffName = report.user.name || 'Unknown';

        // Card-style table for each report
        const cardTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: thinBorder,
            rows: [
                // Header row: Staff name only
                new TableRow({
                    children: [
                        new TableCell({
                            borders: thinBorder,
                            shading: { type: ShadingType.SOLID, color: 'F5F5F5' },
                            columnSpan: 2,
                            children: [
                                new Paragraph({
                                    spacing: { before: 80, after: 80 },
                                    children: [
                                        new TextRun({ text: 'SUBMITTED BY', bold: true, size: 14, color: '999999', font: 'Arial' }),
                                    ],
                                }),
                                new Paragraph({
                                    spacing: { after: 80 },
                                    children: [
                                        new TextRun({ text: staffName, size: 20, font: 'Arial', bold: true }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                // Today's Tasks
                new TableRow({
                    children: [
                        new TableCell({
                            borders: thinBorder,
                            columnSpan: 2,
                            children: [
                                new Paragraph({
                                    spacing: { before: 120, after: 60 },
                                    children: [
                                        new TextRun({ text: "TODAY'S TASKS COMPLETED", bold: true, size: 14, color: '999999', font: 'Arial' }),
                                    ],
                                }),
                                ...report.tasksToday.split('\n').map(line =>
                                    new Paragraph({
                                        spacing: { after: 40 },
                                        children: [
                                            new TextRun({ text: line || ' ', size: 19, font: 'Arial' }),
                                        ],
                                    })
                                ),
                                new Paragraph({ spacing: { after: 40 }, children: [] }),
                            ],
                        }),
                    ],
                }),
                // Tomorrow's Plan
                new TableRow({
                    children: [
                        new TableCell({
                            borders: thinBorder,
                            columnSpan: 2,
                            children: [
                                new Paragraph({
                                    spacing: { before: 120, after: 60 },
                                    children: [
                                        new TextRun({ text: "TOMORROW'S PLAN", bold: true, size: 14, color: '999999', font: 'Arial' }),
                                    ],
                                }),
                                ...report.planTomorrow.split('\n').map(line =>
                                    new Paragraph({
                                        spacing: { after: 40 },
                                        children: [
                                            new TextRun({ text: line || ' ', size: 19, font: 'Arial' }),
                                        ],
                                    })
                                ),
                                new Paragraph({ spacing: { after: 40 }, children: [] }),
                            ],
                        }),
                    ],
                }),
            ],
        });

        children.push(new Paragraph({ spacing: { before: 0 }, children: [] }));
        children.push(cardTable as unknown as Paragraph);
        children.push(new Paragraph({ spacing: { after: 300 }, children: [] }));
    }

    if (reports.length === 0) {
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 },
            children: [
                new TextRun({ text: 'No reports found for the selected period.', size: 22, color: '999999', font: 'Arial' }),
            ],
        }));
    }

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: { top: 720, bottom: 720, left: 720, right: 720 },
                },
            },
            children,
        }],
    });

    const buffer = await Packer.toBuffer(doc);
    const today = getToday();
    const dateStr = today.toISOString().split('T')[0];

    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="daily-reports-${dateStr}.docx"`,
        },
    });
}
