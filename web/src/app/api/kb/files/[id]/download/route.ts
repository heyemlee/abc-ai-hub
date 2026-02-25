import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    const file = await prisma.kBFile.findUnique({ where: { id } });
    if (!file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Generate signed URL (60 seconds)
    const { data, error: signError } = await getSupabaseAdmin().storage
        .from('uploads')
        .createSignedUrl(file.filename, 60);

    if (signError || !data) {
        return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
    }

    return NextResponse.redirect(data.signedUrl);
}
