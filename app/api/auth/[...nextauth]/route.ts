import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import prisma from "../../../../lib/prisma";

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,

    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],

    callbacks: {
        async signIn({ user, account }) {
            if (!account) return false;

            // 1️⃣ Check if this provider account already exists
            const existingAccount = await prisma.account.findUnique({
                where: {
                    provider_providerAccountId: {
                        provider: account.provider,
                        providerAccountId: account.providerAccountId,
                    },
                },
                include: { user: true },
            });

            if (existingAccount) {
                // Account exists, allow sign in
                return true;
            }

            // 2️⃣ Check if user with this email exists (for account linking)
            if (user.email) {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                });

                if (existingUser) {
                    // Link new provider to existing user
                    await prisma.account.create({
                        data: {
                            userId: existingUser.id,
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                        },
                    });
                    return true;
                }
            }

            // 3️⃣ Create new user with account
            await prisma.user.create({
                data: {
                    name: user.name,
                    email: user.email,
                    accounts: {
                        create: {
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                        },
                    },
                },
            });

            return true;
        },

        async session({ session }) {
            if (session.user?.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: session.user.email },
                });

                if (dbUser) {
                    session.user.id = dbUser.id;
                }
            }
            return session;
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
