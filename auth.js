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
        strategy: "jwt",
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
        async jwt({ token, account, user }) {
            if (account) {

                token.accessToken = account.access_token;
            }
            // store the user id on initial sign in so session callback can use it later
            if (user) {
                token.userId = user.id;
            }
            console.log('jwt callback', { hasAccount: !!account, tokenKeys: Object.keys(token), hasAccessToken: !!token.accessToken });
            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            // prefer stored userId (from jwt) falling back to token.sub
            session.user.id = token.userId ?? token.sub;
            console.log('session callback', { hasTokenAccessToken: !!token.accessToken, sessionKeys: Object.keys(session), hasSessionAccessToken: !!session.accessToken });
            return session;
        }
    }


})
