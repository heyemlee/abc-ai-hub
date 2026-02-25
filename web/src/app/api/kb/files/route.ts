import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function GET(req: NextRequest) {
    const { error } = await requireAuth();
    if (error) return error;

    const { searchParams } = req.nextUrl;
    const category = searchParams.get('category');
    const subCategory = searchParams.get('subCategory');

    if (!category) {
        return NextResponse.json({ error: 'category is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { category };
    if (subCategory) where.subCategory = subCategory;

    const files = await prisma.kBFile.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json(files);
}

export async function POST(req: NextRequest) {
    const { error, session } = await requireAdmin();
    if (error) return error;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = formData.get('category') as string | null;
    const subCategory = formData.get('subCategory') as string | null;

    if (!file || !category) {
        return NextResponse.json({ error: 'file and category are required' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Case photos: images only
    if (category === 'case-photos' && !file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Case photos must be images' }, { status: 400 });
    }

    const fileType = file.type.startsWith('image/') ? 'image' : 'pdf';
    const uuid = crypto.randomUUID();
    const storagePath = category === 'case-photos' && subCategory
        ? `kb/case-photos/${subCategory}/${uuid}_${file.name}`
        : `kb/${category}/${uuid}_${file.name}`;

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

    const kbFile = await prisma.kBFile.create({
        data: {
            name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for display name
            type: fileType,
            category,
            subCategory: category === 'case-photos' ? (subCategory || 'cases') : null,
            sizeBytes: file.size,
            storageUrl: publicUrl,
            filename: storagePath,
        },
    });

    return NextResponse.json(kbFile, { status: 201 });
}
