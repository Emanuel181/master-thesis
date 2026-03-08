/**
 * Reset Admin Password Script
 *
 * Usage:
 *   node scripts/reset-admin-password.js                  # Lists all admin accounts
 *   node scripts/reset-admin-password.js your@email.com   # Resets password (or creates master admin if none exist)
 */

const fs = require('fs');
const path = require('path');
const outFile = path.join(__dirname, '..', 'reset-output.txt');

function log(msg) {
    fs.appendFileSync(outFile, msg + '\n', 'utf8');
    console.log(msg);
}

// Clear previous output with BOM for Windows notepad compatibility
fs.writeFileSync(outFile, '\ufeff', 'utf8');

log('Script starting...');

try {
    require('dotenv').config();
    log('DATABASE_URL exists: ' + !!process.env.DATABASE_URL);
} catch (e) {
    log('dotenv error: ' + e.message);
}

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
});

function generatePassword(length = 20) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    const allChars = lowercase + uppercase + numbers + symbols;

    let password = '';
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += numbers[crypto.randomInt(numbers.length)];
    password += symbols[crypto.randomInt(symbols.length)];

    for (let i = password.length; i < length; i++) {
        password += allChars[crypto.randomInt(allChars.length)];
    }

    return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
}

async function main() {
    const email = process.argv[2];

    if (!email) {
        log('Connecting to database...');
        const result = await pool.query(
            'SELECT email, "isMasterAdmin", "emailVerified", "lastLoginAt" FROM "AdminAccount" ORDER BY "createdAt"'
        );

        if (result.rows.length === 0) {
            log('\nNo admin accounts found in the database.');
            log('\nTo create a new master admin, run:');
            log('  node scripts/reset-admin-password.js your@email.com\n');
        } else {
            log('\nAdmin accounts:');
            for (const admin of result.rows) {
                const role = admin.isMasterAdmin ? '[Master]' : '[Admin] ';
                const verified = admin.emailVerified ? '[verified]' : '[unverified]';
                log('  ' + role + ' ' + verified + ' ' + admin.email);
            }
            log('\nTo reset a password, run:');
            log('  node scripts/reset-admin-password.js <email>\n');
        }
        return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    log('Connecting to database...');
    log('Looking up: ' + normalizedEmail);

    const result = await pool.query(
        'SELECT id, email, "emailVerified", "isMasterAdmin" FROM "AdminAccount" WHERE email = $1',
        [normalizedEmail]
    );

    const newPassword = generatePassword(20);
    const passwordHash = await bcrypt.hash(newPassword, 12);

    if (result.rows.length === 0) {
        // No existing account - check if ANY admins exist
        const countResult = await pool.query('SELECT COUNT(*) as count FROM "AdminAccount"');
        const adminCount = parseInt(countResult.rows[0].count);

        if (adminCount === 0) {
            // No admins at all - create a master admin
            log('No admin accounts exist. Creating master admin...');
            const id = crypto.randomBytes(12).toString('base64url');
            const now = new Date().toISOString();
            await pool.query(
                `INSERT INTO "AdminAccount" (id, email, "passwordHash", "emailVerified", "isMasterAdmin", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, true, true, $4, $4)`,
                [id, normalizedEmail, passwordHash, now]
            );

            log('\nMaster admin account CREATED!');
            log('-------------------------------------------');
            log('Email:    ' + normalizedEmail);
            log('Role:     Master Admin');
            log('Password: ' + newPassword);
            log('-------------------------------------------');
            log('Save this password now - it will not be shown again.\n');
        } else {
            log('\nNo admin account found for: ' + normalizedEmail);
            log('Use an existing admin email, or delete all admins first.\n');
            process.exit(1);
        }
        return;
    }

    // Existing account - reset password
    const admin = result.rows[0];
    await pool.query(
        'UPDATE "AdminAccount" SET "passwordHash" = $1, "emailVerified" = true, "updatedAt" = NOW() WHERE id = $2',
        [passwordHash, admin.id]
    );

    log('\nPassword reset successful!');
    log('-------------------------------------------');
    log('Email:    ' + admin.email);
    log('Role:     ' + (admin.isMasterAdmin ? 'Master Admin' : 'Admin'));
    log('Password: ' + newPassword);
    log('-------------------------------------------');
    log('Save this password now - it will not be shown again.\n');
}

main()
    .catch(function(err) {
        log('Error: ' + err.message);
        if (err.stack) log(err.stack);
        process.exit(1);
    })
    .finally(function() {
        pool.end();
    });

