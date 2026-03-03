import { NextResponse } from 'next/server';
import { startSecurityRun } from '@/lib/aws-orchestrator';
import { createApiHandler } from '@/lib/api-handler';
import { z } from 'zod';

// Validation schema for the request body
const bodySchema = z.object({
  groupIds: z.array(z.string()).min(1, 'At least one group ID is required'),
  metadata: z.object({
    code: z.string().optional(),
    codeType: z.string().optional(),
    timestamp: z.string().optional(),
  }).optional(),
});

/**
 * POST /api/orchestrator/runs
 * Start a new security assessment run
 */
export const POST = createApiHandler(
  async (request, context) => {
    // context.session is provided by createApiHandler when requireAuth is true
    // context.body is the validated request body
    const { groupIds, metadata } = context.body;

    try {
      const result = await startSecurityRun({
        userId: context.session.user.id,
        groupIds,
        metadata,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error starting security run:', error);
      throw new Error(error.message || 'Failed to start security run');
    }
  },
  {
    requireAuth: true,
    bodySchema,
  }
);
