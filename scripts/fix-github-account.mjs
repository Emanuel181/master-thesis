/**
 * Script to fix orphan GitHub account linking issue.
 *
 * Problem: GitHub providerAccountId "92999481" is linked to a different user
 * than the current Google user "cmlwsnkc50001e4c9jnudnyvd".
 *
 * Fix: Delete the orphan account record, then the next GitHub sign-in will
 * properly link it to the correct user via allowDangerousEmailAccountLinking.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Find all accounts for providerAccountId 92999481 (GitHub)
    const githubAccounts = await prisma.account.findMany({
        where: {
            provider: 'github',
            providerAccountId: '92999481',
        },
        include: {
            user: { select: { id: true, email: true, name: true } },
        },
    });

    console.log('\n=== GitHub accounts for providerAccountId 92999481 ===');
    for (const acc of githubAccounts) {
        console.log(`  Account ID: ${acc.id}`);
        console.log(`  Linked to user: ${acc.userId} (${acc.user?.email} - ${acc.user?.name})`);
        console.log('');
    }

    // 2. Find the current Google user
    const googleUser = await prisma.user.findUnique({
        where: { id: 'cmlwsnkc50001e4c9jnudnyvd' },
        select: { id: true, email: true, name: true },
    });
    console.log('=== Current Google user ===');
    console.log(`  ID: ${googleUser?.id}, Email: ${googleUser?.email}, Name: ${googleUser?.name}\n`);

    // 3. Find all accounts for the Google user
    const googleUserAccounts = await prisma.account.findMany({
        where: { userId: 'cmlwsnkc50001e4c9jnudnyvd' },
        select: { id: true, provider: true, providerAccountId: true },
    });
    console.log('=== Accounts linked to Google user ===');
    for (const acc of googleUserAccounts) {
        console.log(`  ${acc.provider}: ${acc.providerAccountId} (Account ID: ${acc.id})`);
    }

    // 4. Check if the GitHub account is linked to a different user
    if (githubAccounts.length > 0) {
        const orphan = githubAccounts.find(a => a.userId !== 'cmlwsnkc50001e4c9jnudnyvd');
        if (orphan) {
            console.log(`\n⚠️  Found orphan: GitHub account linked to user ${orphan.userId} instead of cmlwsnkc50001e4c9jnudnyvd`);

            // Check if that user is a ghost/orphan
            const orphanUser = await prisma.user.findUnique({
                where: { id: orphan.userId },
                select: { id: true, email: true, name: true },
            });

            if (orphanUser) {
                console.log(`   Orphan user exists: ${orphanUser.email} (${orphanUser.name})`);
                console.log(`   This is likely a duplicate user created during a previous OAuth flow.`);
            } else {
                console.log(`   Orphan user ${orphan.userId} does NOT exist in the User table — dangling foreign key.`);
            }

            // Delete the orphan account
            console.log(`\n🔧 Deleting orphan GitHub account record (ID: ${orphan.id})...`);
            await prisma.account.delete({ where: { id: orphan.id } });
            console.log('✅ Orphan GitHub account deleted. Try signing in with GitHub again.\n');

            // If the orphan user exists and has no other accounts, consider cleaning it up
            if (orphanUser && orphanUser.id !== 'cmlwsnkc50001e4c9jnudnyvd') {
                const remainingAccounts = await prisma.account.findMany({
                    where: { userId: orphanUser.id },
                });
                if (remainingAccounts.length === 0) {
                    console.log(`   Orphan user ${orphanUser.id} has no remaining accounts.`);
                    console.log(`   Consider deleting it manually if it's a duplicate.\n`);
                }
            }
        } else {
            console.log('\n✅ GitHub account is already linked to the correct user. No fix needed.');
        }
    } else {
        console.log('\n✅ No GitHub account found for providerAccountId 92999481. Next sign-in will create it fresh.');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

