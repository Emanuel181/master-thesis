// auth.ts
import NextAuth from "next-auth"
import Github from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"

import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "./lib/prisma"

export const { auth, handlers, signIn, signOut } = NextAuth({
    secret: process.env.AUTH_SECRET,

    adapter: PrismaAdapter(prisma),

    session: {
        strategy: "database",
    },

    // pages: {
    //     signIn: "/login",
    // },

    providers: [
        Github,
        Google,
        MicrosoftEntraID({
            clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
            clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
            issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER!,
        })
    ],

    callbacks: {
        async signIn({ user, account }) {
            if (!account) return false;

            // 1️⃣ Check if provider account already exists
            const existingAccount = await prisma.account.findUnique({
                where: {
                    provider_providerAccountId: {
                        provider: account.provider,
                        providerAccountId: account.providerAccountId,
                    },
                },
            });

            if (existingAccount) return true;

            // 2️⃣ Try linking to existing user by email
            if (user.email) {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                });

                if (existingUser) {
                    await prisma.account.create({
                        data: {
                            userId: existingUser.id,
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                        },
                    });

                    // Update image if changed
                    if (user.image && user.image !== existingUser.image) {
                        await prisma.user.update({
                            where: { id: existingUser.id },
                            data: { image: user.image },
                        });
                    }

                    return true;
                }
            }

            // 3️⃣ Create new user with provider account
            await prisma.user.create({
                data: {
                    name: user.name,
                    email: user.email,
                    image: user.image,
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
                    session.user.image = dbUser.image;
                }
            }
            return session;
        },
    },
});
