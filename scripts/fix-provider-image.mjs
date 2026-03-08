/**
 * One-time script to fix user profile images that were incorrectly set
 * from a linked secondary provider (different email than canonical).
 *
 * This finds users whose DB `image` is an external URL (not an S3 key)
 * and clears it so the correct image can be set on next sign-in from
 * the canonical provider, or manually via the profile page.
 *
 * Usage: node scripts/fix-provider-image.mjs [--dry-run]
 *
 * Specifically targets: emanuel.rusu.secure@gmail.com whose image
 * may have been set from the Microsoft Entra provider (e-uvt.ro).
 */
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const dryRun = process.argv.includes('--dry-run');

async function main() {
    const targetEmail = 'emanuel.rusu.secure@gmail.com';
    const secondaryEmail = 'emanuel.rusu03@e-uvt.ro';

    // Fetch primary user
    const { rows: [user] } = await pool.query(
        'SELECT id, email, name, image FROM "User" WHERE email = $1',
        [targetEmail]
    );

    if (!user) {
        console.log(`User ${targetEmail} not found.`);
    } else {
        console.log('=== Primary user state ===');
        console.log(`  ID:    ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Name:  ${user.name}`);
        console.log(`  Image: ${user.image}`);

        const { rows: accounts } = await pool.query(
            'SELECT provider, "providerAccountId" FROM "Account" WHERE "userId" = $1',
            [user.id]
        );
        console.log('\n  Linked accounts:');
        for (const acc of accounts) {
            console.log(`    ${acc.provider}: ${acc.providerAccountId}`);
        }
    }

    // Fetch secondary user (e-uvt.ro)
    const { rows: [user2] } = await pool.query(
        'SELECT id, email, name, image FROM "User" WHERE email = $1',
        [secondaryEmail]
    );

    if (!user2) {
        console.log(`\nUser ${secondaryEmail} not found in DB.`);
    } else {
        console.log(`\n=== Secondary user state (${secondaryEmail}) ===`);
        console.log(`  ID:    ${user2.id}`);
        console.log(`  Email: ${user2.email}`);
        console.log(`  Name:  ${user2.name}`);
        console.log(`  Image: ${user2.image}`);

        const { rows: accounts2 } = await pool.query(
            'SELECT provider, "providerAccountId" FROM "Account" WHERE "userId" = $1',
            [user2.id]
        );
        console.log('\n  Linked accounts:');
        for (const acc of accounts2) {
            console.log(`    ${acc.provider}: ${acc.providerAccountId}`);
        }
    }

    // Check for any microsoft-entra-id accounts
    const { rows: msAccounts } = await pool.query(
        `SELECT a.provider, a."providerAccountId", a."userId", u.email as "userEmail", u.name as "userName", u.image as "userImage"
         FROM "Account" a JOIN "User" u ON a."userId" = u.id
         WHERE a.provider = 'microsoft-entra-id'`
    );
    console.log(`\n=== All Microsoft Entra accounts ===`);
    if (msAccounts.length === 0) {
        console.log('  None found.');
    }
    for (const acc of msAccounts) {
        console.log(`  Provider Account: ${acc.providerAccountId}`);
        console.log(`  -> User: ${acc.userId} (${acc.userEmail}) - Image: ${acc.userImage}`);
    }

    // ---- Fix logic ----
    if (user.image && user.image.startsWith('https://')) {
        console.log(`\n⚠️  Image is an external URL (likely from a linked provider).`);

        // Check which accounts are linked
        const { rows: accounts } = await pool.query(
            'SELECT provider, "providerAccountId" FROM "Account" WHERE "userId" = $1',
            [user.id]
        );
        console.log('\n=== Linked accounts ===');
        for (const acc of accounts) {
            console.log(`  ${acc.provider}: ${acc.providerAccountId}`);
        }

        if (dryRun) {
            console.log('\n[DRY RUN] Would clear the image field to null.');
        } else {
            await pool.query(
                'UPDATE "User" SET image = NULL WHERE id = $1',
                [user.id]
            );
            console.log('\n✅ Cleared the image field. The user can upload a new image from their profile page.');
            console.log('   Or it will be filled from the canonical provider on next sign-in.');
        }
    } else if (user.image) {
        console.log(`\nImage is an S3 key (user-uploaded). No fix needed.`);
    } else {
        console.log(`\nImage is null. No fix needed.`);
    }
}

main()
    .catch(console.error)
    .finally(() => pool.end());
