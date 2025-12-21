import NextAuth from "next-auth"
import Github from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import Gitlab from "next-auth/providers/gitlab"

import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma";


export const { auth, handlers, signIn, signOut } = NextAuth({
    debug: true,
    trustHost: true,
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
            clientId: process.env.AUTH_GITLAB_ID,
            clientSecret: process.env.AUTH_GITLAB_SECRET,
            issuer: "https://gitlab.com",
            authorization: {
                params: {
                    scope: "api",
                },
            },
            allowDangerousEmailAccountLinking: true,
        }),
    ],

    callbacks: {
        async signIn({ user, account, profile }) {
            // Update user profile with data from the OAuth provider
            if (profile && user?.id) {
                try {
                    const updateData = {};

                    // Update name from provider if not already set or if it changed
                    if (profile.name) {
                        updateData.name = profile.name;
                    }

                    // Update image/avatar from provider
                    if (profile.picture || profile.avatar_url || profile.image) {
                        updateData.image = profile.picture || profile.avatar_url || profile.image;
                    }

                    // Provider-specific fields
                    if (account?.provider === 'github') {
                        // GitHub provides login (username), name, avatar_url, bio, company, location
                        if (profile.bio) updateData.bio = profile.bio;
                        if (profile.company) updateData.company = profile.company;
                        if (profile.location) updateData.location = profile.location;
                    }

                    if (account?.provider === 'gitlab') {
                        // GitLab provides name, username, avatar_url, bio, location
                        if (profile.bio) updateData.bio = profile.bio;
                        if (profile.location) updateData.location = profile.location;
                    }

                    if (account?.provider === 'google') {
                        // Google provides given_name, family_name, picture
                        if (profile.given_name) updateData.firstName = profile.given_name;
                        if (profile.family_name) updateData.lastName = profile.family_name;
                    }

                    if (account?.provider === 'microsoft-entra-id') {
                        // Microsoft provides givenName, surname, displayName
                        if (profile.givenName) updateData.firstName = profile.givenName;
                        if (profile.surname) updateData.lastName = profile.surname;
                        if (profile.jobTitle) updateData.jobTitle = profile.jobTitle;
                    }

                    // Only update if we have data to update
                    if (Object.keys(updateData).length > 0) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: updateData,
                        });
                        console.log('Updated user profile from provider:', account?.provider, updateData);
                    }
                } catch (error) {
                    console.error('Error updating user profile from provider:', error);
                    // Don't block sign in if profile update fails
                }
            }
            return true;
        },
        async jwt({ token, account, user, profile }) {
            if (account) {
                token.accessToken = account.access_token;
                token.provider = account.provider; // Store which provider the token is for
            }
            // store the user id on initial sign in so session callback can use it later
            if (user) {
                token.userId = user.id;
            }
            // Store profile data in token for potential use
            if (profile) {
                token.picture = profile.picture || profile.avatar_url || profile.image;
            }
            console.log('jwt callback', { hasAccount: !!account, provider: token.provider, tokenKeys: Object.keys(token), hasAccessToken: !!token.accessToken });
            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            session.provider = token.provider; // Pass provider to session
            // prefer stored userId (from jwt) falling back to token.sub
            session.user.id = token.userId ?? token.sub;
            // Include the provider picture if available
            if (token.picture) {
                session.user.image = token.picture;
            }
            console.log('session callback', { provider: session.provider, hasTokenAccessToken: !!token.accessToken, sessionKeys: Object.keys(session), hasSessionAccessToken: !!session.accessToken });
            return session;
        }
    }


})
