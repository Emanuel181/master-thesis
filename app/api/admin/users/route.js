/**
 * Admin Users API Routes
 * =======================
 * 
 * GET /api/admin/users - Get all users (admin only)
 * 
 * Security features:
 * - Uses createAdminApiHandler for consistent auth/validation
 * - Zod validation on all query parameters
 * - Rate limiting enabled
 * - Proper error handling without information leakage
 */

import { createAdminApiHandler } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { paginationSchema } from '@/lib/validators/common';

// Query schema for GET /api/admin/users
const adminUsersQuerySchema = paginationSchema.extend({
    search: z.string()
        .max(200, 'Search query too long')
        .optional()
        .default('')
        // Sanitize search input
        .transform(v => v.replace(/[<>]/g, '')),
    filter: z.enum(['all', 'warned']).default('all'),
});

/**
 * GET /api/admin/users - Get all users
 * Requires admin authentication
 */
export const GET = createAdminApiHandler(
    async (request, { query }) => {
        const { page, limit, search, filter } = query;
        const skip = (page - 1) * limit;

        // Build where clause
        const where = {};

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (filter === 'warned') {
            where.warningCount = { gt: 0 };
        }

        // Parallel queries for better performance
        const [users, total, totalUsersCount, warnedUsersCount, bannedIPsCount] = await Promise.all([
            prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    jobTitle: true,
                    company: true,
                    location: true,
                    bio: true,
                    createdAt: true,
                    updatedAt: true,
                    warningCount: true,
                    lastWarningAt: true,
                    warnings: {
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                        select: {
                            id: true,
                            reason: true,
                            warnedBy: true,
                            createdAt: true,
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
            prisma.user.count(),
            prisma.user.count({ where: { warningCount: { gt: 0 } } }),
            prisma.bannedIP.count(),
        ]);

        return {
            users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            stats: {
                totalUsers: totalUsersCount,
                warnedUsers: warnedUsersCount,
                bannedIPs: bannedIPsCount,
            },
        };
    },
    {
        querySchema: adminUsersQuerySchema,
        rateLimit: { 
            limit: 100, 
            windowMs: 60 * 1000, 
            keyPrefix: 'admin:users:list' 
        },
    }
);
