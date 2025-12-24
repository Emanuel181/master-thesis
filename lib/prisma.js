// lib/prisma.js
import { PrismaClient } from "./generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Connection pool settings for stability under load
    max: parseInt(process.env.DATABASE_POOL_MAX || '10', 10), // Maximum connections in pool
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 5000, // Fail fast if can't connect in 5s
});

const adapter = new PrismaPg(pool);

// Use a global variable to avoid creating multiple clients in dev
const globalForPrisma = globalThis;

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter, // REQUIRED for Prisma 7 client engine
        log: ["warn", "error"],
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export default prisma;
