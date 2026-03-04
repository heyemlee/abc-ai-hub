import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import type { Adapter } from 'next-auth/adapters';

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as Adapter,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
    },
    events: {
        async createUser({ user }) {
            const userCount = await prisma.user.count();
            if (userCount === 1) {
                // 第一个注册的用户 → 自动成为 ADMIN + active
                await prisma.user.update({
                    where: { id: user.id },
                    data: { role: 'ADMIN', active: true },
                });
            } else {
                // 后续用户 → 强制设为 inactive，等待管理员激活
                await prisma.user.update({
                    where: { id: user.id },
                    data: { active: false },
                });
            }
        },
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email! },
                    select: { id: true, name: true, role: true, active: true },
                });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.name = dbUser.name;
                    token.role = dbUser.role;
                    token.active = dbUser.active;
                }
            } else if (token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email },
                    select: { id: true, name: true, role: true, active: true },
                });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.name = dbUser.name;
                    token.role = dbUser.role;
                    token.active = dbUser.active;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.active = token.active as boolean;
            }
            return session;
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
