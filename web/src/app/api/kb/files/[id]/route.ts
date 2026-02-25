import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    const file = await prisma.kBFile.findUnique({ where: { id } });
    if (!file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete from Supabase Storage
    await getSupabaseAdmin().storage.from('uploads').remove([file.filename]);

    // Delete from database
    await prisma.kBFile.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
