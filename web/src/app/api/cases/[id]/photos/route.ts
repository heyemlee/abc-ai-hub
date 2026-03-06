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

    const { id: caseId } = await params;
    const isAdmin = session!.user.role === 'ADMIN';
    const userId = session!.user.id;

    // Check case exists and user is a member
    const caseData = await prisma.case.findUnique({ where: { id: caseId } });
    if (!caseData) {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (!isAdmin) {
        const member = await prisma.caseMember.findUnique({
            where: { caseId_userId: { caseId, userId } },
        });
        if (!member) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const caption = formData.get('caption') as string | null;

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
    const uniqueName = `${Date.now()}_${file.name}`;
    const storagePath = `case-photos/${yearMonth}/${caseId}/${uniqueName}`;

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

    const photo = await prisma.casePhoto.create({
        data: {
            caseId,
            uploadedBy: userId,
            storageUrl: publicUrl,
            filename: file.name,
            caption: caption || null,
        },
        include: {
            uploader: { select: { name: true } },
        },
    });

    // Log activity
    await prisma.caseActivity.create({
        data: {
            caseId,
            userId,
            type: 'photo_upload',
            content: `Uploaded photo: ${file.name}`,
        },
    });

    return NextResponse.json(photo, { status: 201 });
}
