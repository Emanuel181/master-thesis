const { PrismaClient } = require('../lib/generated/prisma/client');

async function main() {
    const prisma = new PrismaClient();
    try {
        // Find GitHub accounts for providerAccountId 92999481
        const accounts = await prisma.account.findMany({
            where: { provider: 'github', providerAccountId: '92999481' },
        });
        console.log('GitHub accounts found:', accounts.length);
        console.log(JSON.stringify(accounts, null, 2));

        // Find the current user
        const user = await prisma.user.findUnique({
            where: { id: 'cmlwsnkc50001e4c9jnudnyvd' },
            select: { id: true, email: true },
        });
        console.log('\nCurrent Google user:', JSON.stringify(user));

        // Find all accounts for the current user
        const userAccounts = await prisma.account.findMany({
            where: { userId: 'cmlwsnkc50001e4c9jnudnyvd' },
            select: { provider: true, providerAccountId: true, userId: true },
        });
        console.log('\nAccounts for current user:', JSON.stringify(userAccounts, null, 2));

        // If orphan found, delete it
        for (const acc of accounts) {
            if (acc.userId !== 'cmlwsnkc50001e4c9jnudnyvd') {
                console.log(`\nDELETING orphan account ${acc.id} (linked to ${acc.userId})`);
                await prisma.account.delete({ where: { id: acc.id } });
                console.log('DELETED');
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();

