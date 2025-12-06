import NextAuth from "next-auth"
import Github from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"

import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma";


export const { auth, handlers, signIn, signOut } = NextAuth({
    debug: true,

    adapter: PrismaAdapter(prisma),

    session: {
        strategy: "database",
    },

    pages: {
        signIn: "/login",
    },

    providers: [
        Github({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
            authorization: {
                params: {
                    scope: "read:user user:email repo",
                },
            },
            allowDangerousEmailAccountLinking: true,
        }),

        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),

        MicrosoftEntraID({
            clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
            clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
            issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
            allowDangerousEmailAccountLinking: true,
        }),
    ],

    callbacks: {
        async session({ session, user }) {
            if (session.user && user) {
                session.user.id = user.id
            }
            return session
        }
    }


})
