import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getToday } from '@/lib/date';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    const { error, session } = await requireAuth();
    if (error) return error;

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
        return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const today = getToday();
    const photoMonth = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}`;
    const supabase = getSupabaseAdmin();
    const results = [];

    for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = file.name.split('.').pop() || 'png';
        const filename = `screenshots/${session!.user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(filename, buffer, {
                contentType: file.type || 'image/png',
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(filename);

        const record = await prisma.callScreenshot.create({
            data: {
                userId: session!.user.id,
                storageUrl: publicUrl,
                filename: file.name,
                photoMonth,
            },
        });

        results.push(record);
    }

    return NextResponse.json({ uploaded: results.length }, { status: 201 });
}
