import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Temporary API endpoint to fix orphan OAuth account linking.
 * DELETE this file after the fix is applied.
 *
 * GET  /api/fix-github-link — diagnoses the issue
 * POST /api/fix-github-link — deletes orphan account records and ghost users
 */
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const email = session.user.email;

    // Find all accounts for the current user
    const myAccounts = await prisma.account.findMany({
        where: { userId },
        select: { id: true, provider: true, providerAccountId: true, userId: true },
    });

    // Find ALL users with this email (there may be duplicates)
    const usersWithEmail = await prisma.user.findMany({
        where: { email },
        select: { id: true, email: true, name: true, createdAt: true },
    });

    // Find ALL accounts linked to any user with this email
    const allUserIds = usersWithEmail.map(u => u.id);
    const allAccountsForEmail = await prisma.account.findMany({
        where: { userId: { in: allUserIds } },
        select: { id: true, provider: true, providerAccountId: true, userId: true },
    });

    // Orphan accounts = accounts linked to a different userId than the current one
    const orphanAccounts = allAccountsForEmail.filter(a => a.userId !== userId);

    // Ghost users = users with same email but different id
    const ghostUsers = usersWithEmail.filter(u => u.id !== userId);

    return NextResponse.json({
        currentUserId: userId,
        currentEmail: email,
        myAccounts,
        usersWithSameEmail: usersWithEmail,
        ghostUsers,
        orphanAccounts,
        allAccountsForEmail,
        fix: orphanAccounts.length > 0 || ghostUsers.length > 0
            ? "POST to this endpoint to delete orphan accounts and ghost users"
            : "No orphans found. GitHub linking should work.",
    });
}

export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const email = session.user.email;
    const results = { deletedAccounts: [], deletedUsers: [], errors: [] };

    try {
        // 1. Find all ghost users (same email, different id)
        const ghostUsers = await prisma.user.findMany({
            where: { email, NOT: { id: userId } },
            select: { id: true, email: true },
        });

        // 2. Delete all accounts belonging to ghost users
        for (const ghost of ghostUsers) {
            const ghostAccounts = await prisma.account.findMany({
                where: { userId: ghost.id },
            });
            for (const acc of ghostAccounts) {
                try {
                    await prisma.account.delete({ where: { id: acc.id } });
                    results.deletedAccounts.push({
                        id: acc.id,
                        provider: acc.provider,
                        wasLinkedToGhostUser: ghost.id,
                    });
                    console.log(`[fix] Deleted orphan ${acc.provider} account ${acc.id} from ghost user ${ghost.id}`);
                } catch (e) {
                    results.errors.push(`Failed to delete account ${acc.id}: ${e.message}`);
                }
            }
        }

        // 3. Delete ghost users (they have no accounts now)
        for (const ghost of ghostUsers) {
            try {
                // Delete related records first (sessions, etc.)
                await prisma.session.deleteMany({ where: { userId: ghost.id } });
                await prisma.user.delete({ where: { id: ghost.id } });
                results.deletedUsers.push(ghost.id);
                console.log(`[fix] Deleted ghost user ${ghost.id}`);
            } catch (e) {
                results.errors.push(`Failed to delete ghost user ${ghost.id}: ${e.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Cleaned up ${results.deletedAccounts.length} orphan account(s) and ${results.deletedUsers.length} ghost user(s). Try signing in with GitHub again.`,
            ...results,
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

