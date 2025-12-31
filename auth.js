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

export const { auth, handlers, signIn, signOut } = NextAuth({
    debug: process.env.NODE_ENV === 'development', // Only enable debug in development
    trustHost: true,
    adapter: PrismaAdapter(prisma),

    session: {
        strategy: "jwt",
    },

    pages: {
        signIn: "/login",
        verifyRequest: "/login/verify-code",
    },

    providers: [
        Github({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
            authorization: {
                params: {
                    // SECURITY NOTE: 'repo' scope grants write access to repositories.
                    // If your app only needs to READ repositories, use "read:user user:email public_repo"
                    // Current scope includes 'repo' for private repository access.
                    // Consider using 'public_repo' if only public repos are needed.
                    scope: "read:user user:email repo",
                },
            },
            // WARNING: allowDangerousEmailAccountLinking removed for security
            // Consider implementing proper email verification flow instead
        }),

        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            // SECURITY: allowDangerousEmailAccountLinking disabled to prevent account takeover attacks
            // If users need to link accounts with the same email, implement proper email verification
        }),

        MicrosoftEntraID({
            clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
            clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
            issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
            // SECURITY: allowDangerousEmailAccountLinking disabled to prevent account takeover attacks
            // If users need to link accounts with the same email, implement proper email verification
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
            authorization: {
                params: {
                    // SECURITY NOTE: Using "api" scope for full API access.
                    // To use more restrictive scopes like "read_user read_repository read_api",
                    // you must enable those scopes in your GitLab Application settings:
                    // GitLab > User Settings > Applications > [Your App] > Scopes
                    // Required scopes for read-only: read_user (for profile), read_api, read_repository
                    scope: "read_user read_repository read_api",
                },
            },
            // WARNING: allowDangerousEmailAccountLinking removed for security
            // Consider implementing proper email verification flow instead
        }),
    ],

    callbacks: {
        async signIn({ user, account, profile }) {
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
                        try {
                            // Check if user exists before updating
                            const existingUser = await prisma.user.findUnique({
                                where: { id: user.id }
                            });

                            if (existingUser) {
                                await prisma.user.update({
                                    where: { id: user.id },
                                    data: updateData,
                                });
                                console.log('Updated user profile from provider:', account?.provider, updateData);
                            }
                        } catch (updateError) {
                            console.error('Error in user update block:', updateError);
                        }
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
            // Include the provider picture if available
            if (token.picture) {
                session.user.image = token.picture;
            }
            // Only log in development to avoid leaking sensitive info
            if (process.env.NODE_ENV === 'development') {
                console.log('session callback', { provider: session.provider });
            }
            return session;
        }
    }


})
