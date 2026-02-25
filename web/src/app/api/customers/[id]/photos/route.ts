import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    // Verify customer exists
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Only images are allowed' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const staffId = session!.user.id;
    const uniqueName = `${Date.now()}_${file.name}`;
    const storagePath = `photos/${yearMonth}/${staffId}/${uniqueName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await getSupabaseAdmin().storage
        .from('uploads')
        .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: false,
        });

    if (uploadError) {
        return NextResponse.json({ error: 'Upload failed: ' + uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = getSupabaseAdmin().storage
        .from('uploads')
        .getPublicUrl(storagePath);

    const photo = await prisma.customerPhoto.create({
        data: {
            customerId: id,
            staffId,
            storageUrl: publicUrl,
            filename: file.name,
            photoMonth: yearMonth,
        },
    });

    return NextResponse.json(photo, { status: 201 });
}
