import { getServerSession as getNextAuthSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export async function getServerSession() {
    return getNextAuthSession(authOptions);
}

export async function requireAuth() {
    const session = await getServerSession();
    if (!session?.user) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
    }
    return { error: null, session };
}

export async function requireAdmin() {
    const { error, session } = await requireAuth();
    if (error) return { error, session: null };
    if (session!.user.role !== 'ADMIN') {
        return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null };
    }
    return { error: null, session: session! };
}
