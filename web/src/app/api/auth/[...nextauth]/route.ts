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
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                // First login — user object is available
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email! },
                    select: { id: true, role: true, active: true },
                });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                    token.active = dbUser.active;
                }
            } else if (token.email) {
                // Subsequent requests — refresh role/active from DB
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email },
                    select: { id: true, role: true, active: true },
                });
                if (dbUser) {
                    token.id = dbUser.id;
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
        async signIn({ user }) {
            // Block deactivated accounts
            if (user.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email },
                    select: { active: true },
                });
                if (dbUser && !dbUser.active) {
                    return false;
                }
            }
            return true;
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
