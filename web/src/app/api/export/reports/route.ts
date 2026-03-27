import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getToday } from '@/lib/date';
import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, BorderStyle, AlignmentType, ShadingType,
    Header, Footer, PageNumber,
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

    const thinBorder = {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    };

    const children: Paragraph[] = [];

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

    if (reports.length === 0) {
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 },
            children: [
                new TextRun({ text: 'No reports found for the selected period.', size: 22, color: '999999', font: 'Arial' }),
            ],
        }));
    } else {
        // Build a single consolidated table with header + one row per report
        const headerRow = new TableRow({
            tableHeader: true,
            children: [
                new TableCell({
                    borders: thinBorder,
                    shading: { type: ShadingType.SOLID, color: 'D9D9D9' },
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                    children: [
                        new Paragraph({
                            spacing: { before: 60, after: 60 },
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({ text: 'Name', bold: true, size: 26, color: '000000', font: 'Arial' }),
                            ],
                        }),
                    ],
                }),
                new TableCell({
                    borders: thinBorder,
                    shading: { type: ShadingType.SOLID, color: 'D9D9D9' },
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                    children: [
                        new Paragraph({
                            spacing: { before: 60, after: 60 },
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({ text: "Today's Task", bold: true, size: 26, color: '000000', font: 'Arial' }),
                            ],
                        }),
                    ],
                }),
                new TableCell({
                    borders: thinBorder,
                    shading: { type: ShadingType.SOLID, color: 'D9D9D9' },
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                    children: [
                        new Paragraph({
                            spacing: { before: 60, after: 60 },
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({ text: "Tomorrow's Task", bold: true, size: 26, color: '000000', font: 'Arial' }),
                            ],
                        }),
                    ],
                }),
            ],
        });

        const dataRows = reports.map((report, idx) => {
            const staffName = report.user.name || 'Unknown';
            const rowShading = idx % 2 === 1
                ? { type: ShadingType.SOLID, color: 'F7F7F7' } as const
                : undefined;

            return new TableRow({
                children: [
                    // Column 1: Name
                    new TableCell({
                        borders: thinBorder,
                        ...(rowShading ? { shading: rowShading } : {}),
                        margins: { top: 100, bottom: 100, left: 120, right: 120 },
                        verticalAlign: 'center' as unknown as undefined,
                        children: [
                            new Paragraph({
                                spacing: { before: 60, after: 60 },
                                children: [
                                    new TextRun({ text: staffName, bold: true, size: 24, font: 'Arial' }),
                                ],
                            }),
                        ],
                    }),
                    // Column 2: Today's Task
                    new TableCell({
                        borders: thinBorder,
                        ...(rowShading ? { shading: rowShading } : {}),
                        margins: { top: 100, bottom: 100, left: 120, right: 120 },
                        children: [
                            ...report.tasksToday.split('\n').map(line =>
                                new Paragraph({
                                    spacing: { before: 40, after: 40 },
                                    children: [
                                        new TextRun({ text: line || ' ', size: 24, font: 'Arial' }),
                                    ],
                                })
                            ),
                        ],
                    }),
                    // Column 3: Tomorrow's Task
                    new TableCell({
                        borders: thinBorder,
                        ...(rowShading ? { shading: rowShading } : {}),
                        margins: { top: 100, bottom: 100, left: 120, right: 120 },
                        children: [
                            ...report.planTomorrow.split('\n').map(line =>
                                new Paragraph({
                                    spacing: { before: 40, after: 40 },
                                    children: [
                                        new TextRun({ text: line || ' ', size: 24, font: 'Arial' }),
                                    ],
                                })
                            ),
                        ],
                    }),
                ],
            });
        });

        const table = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows],
        });

        children.push(table as unknown as Paragraph);
    }

    // Document header — "Daily Reports" on every page
    const docHeader = new Header({
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                style: 'Normal',
                children: [
                    new TextRun({ text: 'Daily Reports', bold: true, size: 36, font: 'Arial', color: '000000' }),
                ],
            }),
        ],
    });

    // Document footer — page numbers on every page
    const docFooter = new Footer({
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ text: 'Page ', size: 18, font: 'Arial', color: '888888' }),
                    new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'Arial', color: '888888' }),
                    new TextRun({ text: ' of ', size: 18, font: 'Arial', color: '888888' }),
                    new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: 'Arial', color: '888888' }),
                ],
            }),
        ],
    });

    const doc = new Document({
        sections: [{
            headers: {
                default: docHeader,
            },
            footers: {
                default: docFooter,
            },
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
