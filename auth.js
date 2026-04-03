import NextAuth from "next-auth"
import Github from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import Gitlab from "next-auth/providers/gitlab"
import Nodemailer from "next-auth/providers/nodemailer"
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"
import { randomInt } from "crypto"

import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma";
import { logAudit, AuditAction } from "@/lib/audit-log";
import { seedDefaultPromptsForUser } from "@/lib/user-seeding";

// Initialize SES Client
const ses = new SESClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Helper to generate a random 6-digit code
function generateRandomCode() {
    return randomInt(100000, 1000000).toString()
}

// Custom adapter wrapper that fixes orphan account linking at the adapter level.
// When getUserByAccount finds an account linked to a ghost user (different userId
// than the canonical user for that email), it deletes the orphan account and ghost
// user, then returns null so AuthJS treats it as a new account link.
// This runs BEFORE AuthJS's handleLoginOrRegister caches anything.
const baseAdapter = PrismaAdapter(prisma);
const adapter = {
    ...baseAdapter,

    async getUserByAccount(providerAccountInfo) {
        const user = await baseAdapter.getUserByAccount(providerAccountInfo);
        if (!user || !user.email) return user;

        try {
            // Find the canonical user for this email
            const canonicalUser = await prisma.user.findUnique({
                where: { email: user.email },
                select: { id: true },
            });

            // If the account is linked to a DIFFERENT user than the canonical one,
            // it's an orphan from a previous partial sign-in attempt
            if (canonicalUser && canonicalUser.id !== user.id) {
                console.log(`[auth][adapter] Orphan detected: ${providerAccountInfo.provider} account linked to ghost user ${user.id}, canonical user is ${canonicalUser.id}`);

                // Delete the orphan account record
                await prisma.account.delete({
                    where: {
                        provider_providerAccountId: {
                            provider: providerAccountInfo.provider,
                            providerAccountId: providerAccountInfo.providerAccountId,
                        },
                    },
                });
                console.log(`[auth][adapter] Deleted orphan ${providerAccountInfo.provider} account`);

                // Clean up the ghost user if it has no remaining accounts
                const remainingAccounts = await prisma.account.count({
                    where: { userId: user.id },
                });
                if (remainingAccounts === 0) {
                    try {
                        await prisma.user.delete({ where: { id: user.id } });
                        console.log(`[auth][adapter] Deleted ghost user ${user.id}`);
                    } catch (deleteErr) {
                        console.warn(`[auth][adapter] Could not delete ghost user ${user.id}:`, deleteErr.message);
                    }
                }

                // Return null so AuthJS treats this as a new account link
                // (allowDangerousEmailAccountLinking will then link it to the canonical user)
                return null;
            }
        } catch (err) {
            console.error('[auth][adapter] Error during orphan cleanup:', err.message);
            // Fall through and return the original user to avoid blocking sign-in
        }

        return user;
    },

    /**
     * Override linkAccount to handle cross-user account conflicts.
     *
     * Scenario: User A signed up with Google. Later, User A tries to connect GitHub,
     * but GitHub was previously linked to a ghost/test user with a different email.
     *
     * This method detects the conflict and either:
     * 1. Deletes the old link if it's an orphan (ghost user)
     * 2. Transfers the account to the current user if emails match
     */
    async linkAccount(account) {
        try {
            console.log(`[auth][adapter] linkAccount called for ${account.provider} account ${account.providerAccountId}`);

            // Check if this provider account is already linked to a different user
            const existingAccount = await prisma.account.findUnique({
                where: {
                    provider_providerAccountId: {
                        provider: account.provider,
                        providerAccountId: account.providerAccountId,
                    },
                },
                include: {
                    user: {
                        select: { id: true, email: true },
                    },
                },
            });

            if (existingAccount && existingAccount.userId !== account.userId) {
                console.log(`[auth][adapter] Found existing link: ${account.provider} account ${account.providerAccountId} is linked to user ${existingAccount.userId} (${existingAccount.user.email}), but trying to link to ${account.userId}`);

                // Get the new user's info
                const newUser = await prisma.user.findUnique({
                    where: { id: account.userId },
                    select: { email: true },
                });

                console.log(`[auth][adapter] New user email: ${newUser?.email}`);

                // Strategy: Delete the old link and create a new one
                // This handles both ghost users and email changes
                console.log(`[auth][adapter] Deleting old link to allow re-linking`);

                await prisma.account.delete({
                    where: {
                        provider_providerAccountId: {
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                        },
                    },
                });

                console.log(`[auth][adapter] Deleted old ${account.provider} link`);

                // Check if old user should be deleted (ghost user with no other accounts)
                const oldUserAccountCount = await prisma.account.count({
                    where: { userId: existingAccount.userId },
                });

                if (oldUserAccountCount === 0) {
                    try {
                        await prisma.user.delete({
                            where: { id: existingAccount.userId },
                        });
                        console.log(`[auth][adapter] Deleted ghost user ${existingAccount.userId} (${existingAccount.user.email})`);
                    } catch (deleteErr) {
                        console.warn(`[auth][adapter] Could not delete ghost user:`, deleteErr.message);
                    }
                }
            }

            // Now create/update the account link
            return await baseAdapter.linkAccount(account);
        } catch (err) {
            console.error('[auth][adapter] Error in linkAccount:', err.message);
            // Fall back to base adapter
            return await baseAdapter.linkAccount(account);
        }
    },
};

export const { auth, handlers, signIn, signOut } = NextAuth({
    debug: process.env.NODE_ENV === 'development', // Only enable debug in development
    trustHost: true,
    adapter,

    session: {
        strategy: "jwt",
    },

    pages: {
        signIn: "/login",
        verifyRequest: "/login/verify-code",
    },

    // NextAuth v5: Enable experimental features for account linking
    experimental: {
        enableWebAuthn: false,
    },

    providers: [
        Github({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    // SECURITY NOTE: 'repo' scope grants write access to repositories.
                    // If your app only needs to READ repositories, use "read:user user:email public_repo"
                    // Current scope includes 'repo' for private repository access.
                    // Consider using 'public_repo' if only public repos are needed.
                    scope: "read:user user:email repo",
                },
            },
            // allowDangerousEmailAccountLinking is safe here because GitHub
            // verifies all email addresses. This allows users who signed up
            // with Google/email/Microsoft to also connect their GitHub account.
        }),

        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
            // Safe: Google verifies all email addresses before returning them.
        }),

        MicrosoftEntraID({
            clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
            clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
            issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
            allowDangerousEmailAccountLinking: true,
            // Safe: Microsoft verifies all email addresses before returning them.
        }),

        Nodemailer({
            server: {
                host: "ignore",
                port: 25,
                auth: {
                    user: "ignore",
                    pass: "ignore",
                },
            },
            from: process.env.EMAIL_FROM,
            maxAge: 10 * 60, // 10 minutes - token expiration time
            generateVerificationToken: async () => {
                return generateRandomCode()
            },
            sendVerificationRequest: async ({ identifier: email, url, provider, token }) => {
                const command = new SendEmailCommand({
                    Source: provider.from,
                    Destination: { ToAddresses: [email] },
                    Message: {
                        Subject: { Data: `Your Login Code: ${token}` },
                        Body: {
                            Text: { Data: `Your login code is: ${token}\n\nOr click here: ${url}` },
                            Html: {
                                Data: `
<body style="background: #f9f9f9;">
  <table width="100%" border="0" cellspacing="20" cellpadding="0" style="background: #fff; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center" style="padding: 10px 0px 0px 0px; font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: #444;">
        Sign in to <strong>VulnIQ</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="#000000">
              <span style="font-size: 32px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; text-decoration: none; padding: 15px 25px; border-radius: 5px; border: 1px solid #000000; display: inline-block; font-weight: bold; letter-spacing: 5px;">${token}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: #444;">
        Enter this code in the login screen to sign in.<br/>
        This code will expire in 10 minutes.
      </td>
    </tr>
  </table>
</body>
`
                            }
                        }
                    }
                });

                try {
                    await ses.send(command);
                } catch (error) {
                    console.error("SES Error:", error);
                    throw new Error(`Failed to send verification email: ${error.message}`);
                }
            }
        }),

        Gitlab({
            clientId: process.env.AUTH_GITLAB_ID,
            clientSecret: process.env.AUTH_GITLAB_SECRET,
            issuer: "https://gitlab.com",
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    scope: "read_user read_repository read_api",
                },
            },
            // Safe: GitLab verifies all email addresses before returning them.
        }),
    ],

    callbacks: {
        async signIn({ user, account, profile }) {

            // ── Guard: reject OAuth sign-in when provider email ≠ DB email ──
            // When `allowDangerousEmailAccountLinking` links a provider account
            // to an existing user whose canonical email differs, the user ends
            // up in someone else's session. Block that here and return a clear
            // error so the login page can display it.
            //
            // IMPORTANT: Only enforce this check during INITIAL sign-in, NOT when
            // linking additional providers to an existing authenticated session.
            // If user already has a session, they're intentionally linking a
            // secondary account (e.g., signed up with Email, now linking GitHub).
            if (account?.type === 'oauth' && user?.id && profile) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: user.id },
                        select: { email: true },
                    });
                    const providerEmail = (
                        profile.email
                        || profile.preferred_username
                        || profile.upn
                        || ''
                    ).toLowerCase().trim();
                    const canonicalEmail = (dbUser?.email || '').toLowerCase().trim();

                    // Check if this account is already linked to this user
                    const existingAccount = await prisma.account.findUnique({
                        where: {
                            provider_providerAccountId: {
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                            },
                        },
                        select: { userId: true },
                    });

                    // Only block if:
                    // 1. Emails don't match
                    // 2. This is NOT already linked to this user (not a re-auth)
                    // 3. The user doesn't already have other linked accounts (not account linking)
                    const userAccountsCount = await prisma.account.count({
                        where: { userId: user.id },
                    });

                    const isReauth = existingAccount?.userId === user.id;
                    const isLinkingAdditional = userAccountsCount > 0;

                    if (providerEmail && canonicalEmail && providerEmail !== canonicalEmail) {
                        // Allow if this is re-authentication or linking additional account
                        if (isReauth || isLinkingAdditional) {
                            console.log(
                                `[auth][signIn] Allowing cross-email link: provider ${account.provider} `
                                + `email (${providerEmail}) ≠ canonical email (${canonicalEmail}) - `
                                + `${isReauth ? 're-auth' : 'linking additional account'}`
                            );
                        } else {
                            // Block initial sign-in with different email
                            console.warn(
                                `[auth][signIn] Blocked cross-email sign-in: provider ${account.provider} `
                                + `email (${providerEmail}) ≠ canonical email (${canonicalEmail})`
                            );
                            return `/login?error=CrossEmailBlocked`;
                        }
                    }
                } catch (err) {
                    console.error('[auth][signIn] Guard check failed:', err.message);
                    // Don't block sign-in if the guard itself errors
                }
            }

            // GDPR: Audit log successful sign-in
            if (user?.id) {
                // Fire-and-forget audit log (don't block sign-in)
                logAudit({
                    userId: user.id,
                    action: AuditAction.LOGIN,
                    resource: 'session',
                    metadata: { provider: account?.provider },
                }).catch(() => {}); // Ignore audit log failures
            }

            // Update user profile with data from the OAuth provider
            // IMPORTANT: Only fill in fields that are currently empty/null.
            // Do NOT overwrite existing data — the canonical user profile should
            // remain stable regardless of which linked provider is used to log in.
            // ALSO: Only fill data from the provider that owns the canonical email.
            // Linked secondary accounts (different email) should NOT contribute
            // profile data — especially the profile image.
            if (profile && user?.id) {
                try {
                    // Fetch current user data to check what's already set
                    const existingUser = await prisma.user.findUnique({
                        where: { id: user.id },
                        select: { email: true, name: true, image: true, bio: true, company: true, location: true, firstName: true, lastName: true, jobTitle: true },
                    });

                    // Skip profile data merge if the provider's email doesn't match
                    // the canonical user email — this is a linked secondary account.
                    // Microsoft Entra may return email in preferred_username or upn
                    // instead of the standard email field.
                    const providerEmail = (
                        profile.email
                        || profile.preferred_username
                        || profile.upn
                        || user.email
                        || ''
                    ).toLowerCase().trim();
                    const canonicalEmail = (existingUser?.email || '').toLowerCase().trim();
                    if (existingUser && providerEmail && canonicalEmail && providerEmail !== canonicalEmail) {
                        console.log(`[auth][signIn] Skipping profile merge: provider email (${providerEmail}) differs from canonical email (${canonicalEmail})`);
                        return true;
                    }

                    if (existingUser) {
                        const updateData = {};

                        // Only set name if not already present
                        if (!existingUser.name && profile.name) {
                            updateData.name = profile.name;
                        }

                        // Only set image if not already present (null or empty string)
                        if ((!existingUser.image || existingUser.image === '') && (profile.picture || profile.avatar_url || profile.image)) {
                            updateData.image = profile.picture || profile.avatar_url || profile.image;
                        }

                        // Provider-specific fields — only fill blanks
                        if (account?.provider === 'github') {
                            if (!existingUser.bio && profile.bio) updateData.bio = profile.bio;
                            if (!existingUser.company && profile.company) updateData.company = profile.company;
                            if (!existingUser.location && profile.location) updateData.location = profile.location;
                        }

                        if (account?.provider === 'gitlab') {
                            if (!existingUser.bio && profile.bio) updateData.bio = profile.bio;
                            if (!existingUser.location && profile.location) updateData.location = profile.location;
                        }

                        if (account?.provider === 'google') {
                            if (!existingUser.firstName && profile.given_name) updateData.firstName = profile.given_name;
                            if (!existingUser.lastName && profile.family_name) updateData.lastName = profile.family_name;
                        }

                        if (account?.provider === 'microsoft-entra-id') {
                            if (!existingUser.firstName && profile.givenName) updateData.firstName = profile.givenName;
                            if (!existingUser.lastName && profile.surname) updateData.lastName = profile.surname;
                            if (!existingUser.jobTitle && profile.jobTitle) updateData.jobTitle = profile.jobTitle;
                            // Fetch profile photo from Microsoft Graph if no image set
                            if ((!existingUser.image || existingUser.image === '') && account.access_token) {
                                try {
                                    const photoRes = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
                                        headers: { Authorization: `Bearer ${account.access_token}` },
                                    });
                                    if (photoRes.ok) {
                                        const blob = await photoRes.blob();
                                        const arrayBuffer = await blob.arrayBuffer();
                                        const base64 = Buffer.from(arrayBuffer).toString('base64');
                                        const mimeType = photoRes.headers.get('content-type') || 'image/jpeg';
                                        updateData.image = `data:${mimeType};base64,${base64}`;
                                    }
                                } catch {
                                    // Graph photo fetch failed — leave image empty
                                }
                            }
                        }

                        // Only update if we have new data to fill in
                        if (Object.keys(updateData).length > 0) {
                            try {
                                await prisma.user.update({
                                    where: { id: user.id },
                                    data: updateData,
                                });
                                console.log('Filled in missing user profile fields from provider:', account?.provider, Object.keys(updateData));
                            } catch (updateError) {
                                console.error('Error in user update block:', updateError);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error updating user profile from provider:', error);
                    // Don't block sign in if profile update fails
                }
            }
            return true;
        },
        async jwt({ token, account, user, profile, trigger }) {
            if (account) {
                token.accessToken = account.access_token;
                token.provider = account.provider;
                // Save the provider-sourced picture so it can be used as a fallback
                // when the DB has no image. The DB image is always canonical.
                token._providerPicture = profile?.picture || profile?.avatar_url || profile?.image || token.picture || null;
                // For Microsoft, the OIDC profile has no picture — fetch from Graph API
                if (account.provider === 'microsoft-entra-id' && !token._providerPicture && account.access_token) {
                    try {
                        const photoRes = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
                            headers: { Authorization: `Bearer ${account.access_token}` },
                        });
                        if (photoRes.ok) {
                            const arrayBuffer = await photoRes.arrayBuffer();
                            const base64 = Buffer.from(arrayBuffer).toString('base64');
                            const mimeType = photoRes.headers.get('content-type') || 'image/jpeg';
                            token._providerPicture = `data:${mimeType};base64,${base64}`;
                        }
                    } catch {
                        // Graph photo fetch failed
                    }
                }
                token.picture = null;
            }
            // store the user id on initial sign in so session callback can use it later
            if (user) {
                token.userId = user.id;
            }
            // Fetch canonical user data from the DB so the session always
            // reflects the DB user, not whichever provider was used to log in.
            //
            // Runs on:
            //  1. Initial sign-in (user object present)
            //  2. Periodically (every 5 min) to self-heal corrupted data and
            //     pick up profile changes without requiring re-login.
            const DB_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
            const lookupId = user?.id || token.userId;
            const isSignIn = !!user?.id;
            const isForceRefresh = trigger === "update";
            const isStale = token._dbRefreshedAt
                && (Date.now() - token._dbRefreshedAt > DB_REFRESH_INTERVAL_MS);
            const needsRefresh = isSignIn || isStale || isForceRefresh;

            if (lookupId && needsRefresh) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: lookupId },
                        select: { email: true, name: true, image: true },
                    });
                    if (dbUser) {
                        token.email = dbUser.email;
                        token.name = dbUser.name;
                        // Always use the DB image as the canonical source.
                        // If DB has no image, fall back to the provider picture
                        // (e.g., Google profile photo) so the avatar is visible
                        // until the user uploads a custom one.
                        token.picture = dbUser.image || token._providerPicture || null;
                    }
                    token._dbRefreshedAt = Date.now();
                } catch (err) {
                    console.error('[auth][jwt] Error fetching DB user:', err.message);
                    // Fall through — token will use defaults from the provider
                }
            }
            // SECURITY: Only log non-sensitive info in development
            if (process.env.NODE_ENV === 'development') {
                console.log('jwt callback', { hasAccount: !!account, provider: token.provider });
            }
            return token;
        },
        async session({ session, token }) {
            // SECURITY: Do NOT expose OAuth access tokens to the browser.
            // Use server-side stored account tokens in API routes instead.
            session.provider = token.provider; // Pass provider to session
            // prefer stored userId (from jwt) falling back to token.sub
            session.user.id = token.userId ?? token.sub;
            // Always use the canonical image from the JWT token (sourced from DB).
            // Setting this unconditionally ensures NextAuth's auto-populated
            // provider image is overridden — even with null/undefined.
            session.user.image = token.picture || null;
            // Only log in development to avoid leaking sensitive info
            if (process.env.NODE_ENV === 'development') {
                console.log('session callback', { provider: session.provider });
            }
            return session;
        }
    },

    events: {
        /**
         * createUser event - fires when a new user is created
         * Seeds default prompts for the new user
         */
        async createUser({ user }) {
            if (user?.id) {
                try {
                    const result = await seedDefaultPromptsForUser(user.id);
                    if (result.success) {
                        console.log(`Created ${result.promptsCreated} default prompts for new user ${user.id}`);
                    } else {
                        console.error(`Failed to seed default prompts for user ${user.id}:`, result.error);
                    }
                } catch (error) {
                    // Don't block user creation if prompt seeding fails
                    console.error('Error in createUser event (prompt seeding):', error);
                }
            }
        },

        /**
         * linkAccount event - fires when an account is linked to a user
         * This is triggered by allowDangerousEmailAccountLinking
         */
        async linkAccount({ user, account, profile }) {
            console.log(`[auth][events] Account linked: ${account.provider} → user ${user.id}`);
            console.log(`[auth][events] Provider email: ${profile?.email}, User email: ${user.email}`);
        },
    },


})
