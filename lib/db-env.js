/**
 * Environment-aware Prisma/DB factory
 * =============================================================================
 * Ensures demo-mode cannot connect to the production database.
 *
 * ISOLATION OPTIONS (choose one via env vars):
 *   1. Separate DATABASE_URL_DEMO → completely separate DB/cluster (recommended)
 *   2. Same DB, different schema via search_path (DEMO_DB_SCHEMA)
 *   3. Same DB/schema, row-level tenant column (least isolation, not recommended)
 *
 * Current implementation: if DATABASE_URL_DEMO is set, demo uses it; otherwise
 * falls back to the prod connection (legacy behaviour but logged as warning).
 */

import { PrismaClient } from "./generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PROD_DATABASE_URL = process.env.DATABASE_URL;
const DEMO_DATABASE_URL = process.env.DATABASE_URL_DEMO || PROD_DATABASE_URL;

const DEMO_SCHEMA = process.env.DEMO_DB_SCHEMA; // e.g. "demo" — optional

// Warn at startup if demo shares prod DB (non-fatal but flagged)
if (
    process.env.NODE_ENV !== "test" &&
    DEMO_DATABASE_URL === PROD_DATABASE_URL &&
    !DEMO_SCHEMA
) {
    console.warn(
        "[db-env] WARNING: Demo mode is sharing the production database without schema isolation. " +
            "Set DATABASE_URL_DEMO or DEMO_DB_SCHEMA for proper isolation."
    );
}

// ---------------------------------------------------------------------------
// Pool & Client caches (one per env)
// ---------------------------------------------------------------------------

const globalForDb = globalThis;

/** @type {Pool | null} */
let prodPool = null;
/** @type {Pool | null} */
let demoPool = null;

/** @type {PrismaClient | null} */
let prodPrisma = null;
/** @type {PrismaClient | null} */
let demoPrisma = null;

function createPool(connectionString, schema) {
    const pool = new Pool({
        connectionString,
        max: parseInt(process.env.DATABASE_POOL_MAX || "10", 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    });

    // If schema is specified, set search_path on each new connection
    if (schema) {
        pool.on("connect", (client) => {
            client.query(`SET search_path TO ${schema}, public`);
        });
    }

    return pool;
}

function getProdPool() {
    if (!prodPool) {
        prodPool = createPool(PROD_DATABASE_URL, null);
    }
    return prodPool;
}

function getDemoPool() {
    if (!demoPool) {
        demoPool = createPool(DEMO_DATABASE_URL, DEMO_SCHEMA);
    }
    return demoPool;
}

// ---------------------------------------------------------------------------
// Prisma clients
// ---------------------------------------------------------------------------

function createPrismaClient(pool) {
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
        adapter,
        log: ["warn", "error"],
    });
}

/**
 * Get environment-specific Prisma client
 * @param {'prod' | 'demo'} env
 * @returns {PrismaClient}
 */
export function getDb(env) {
    if (env === "demo") {
        if (!demoPrisma) {
            demoPrisma = createPrismaClient(getDemoPool());
            if (process.env.NODE_ENV !== "production") {
                globalForDb.demoPrisma = demoPrisma;
            }
        }
        return demoPrisma;
    }

    if (!prodPrisma) {
        prodPrisma = createPrismaClient(getProdPool());
        if (process.env.NODE_ENV !== "production") {
            globalForDb.prodPrisma = prodPrisma;
        }
    }
    return prodPrisma;
}

// Legacy default export (prod) for backward compatibility
export const prisma = getDb("prod");
export default prisma;
