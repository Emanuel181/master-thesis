import NextAuth from "next-auth"
import Github from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import Gitlab from "next-auth/providers/gitlab"

import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma";


export const { auth, handlers, signIn, signOut } = NextAuth({

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

        Gitlab({
            clientId: process.env.GITLAB_CLIENT_ID,
            clientSecret: process.env.GITLAB_CLIENT_SECRET,
            // Use GITLAB_URL for self-hosted, defaults to gitlab.com
            issuer: process.env.GITLAB_URL || "https://gitlab.com",
            authorization: {
                params: {
                    scope: "api",
                },
            },
            allowDangerousEmailAccountLinking: true,
        }),
    ],

    callbacks: {
        async jwt({ token, account, user }) {
            if (account) {
                token.accessToken = account.access_token;
                token.provider = account.provider; // Store which provider the token is for
            }
            // store the user id on initial sign in so session callback can use it later
            if (user) {
                token.userId = user.id;
            }
            console.log('jwt callback', { hasAccount: !!account, provider: token.provider, tokenKeys: Object.keys(token), hasAccessToken: !!token.accessToken });
            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            session.provider = token.provider; // Pass provider to session
            // prefer stored userId (from jwt) falling back to token.sub
            session.user.id = token.userId ?? token.sub;
            console.log('session callback', { provider: session.provider, hasTokenAccessToken: !!token.accessToken, sessionKeys: Object.keys(session), hasSessionAccessToken: !!session.accessToken });
            return session;
        }
    }


})
