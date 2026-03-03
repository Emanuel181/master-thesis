import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getRunStatus } from '@/lib/aws-orchestrator';
import { createApiHandler } from '@/lib/api-handler';

/**
 * GET /api/orchestrator/runs/[executionArn]
 * Get the status of a security assessment run
 */
export const GET = createApiHandler(async (request, { params }) => {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { executionArn } = params;

  if (!executionArn) {
    return NextResponse.json(
      { error: 'executionArn is required' },
      { status: 400 }
    );
  }

  try {
    // Decode the executionArn from URL encoding
    const decodedArn = decodeURIComponent(executionArn);
    
    const status = await getRunStatus(decodedArn);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting run status:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
});
