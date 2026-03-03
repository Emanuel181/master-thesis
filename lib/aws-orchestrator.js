/**
 * AWS Multi-Agent Orchestrator Client
 * Handles communication with the deployed AWS infrastructure
 */

import { SFNClient, StartExecutionCommand, DescribeExecutionCommand } from '@aws-sdk/client-sfn';

const sfnClient = new SFNClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Start a security assessment run
 * @param {Object} params - Run parameters
 * @param {string} params.userId - User ID
 * @param {string[]} params.groupIds - Array of use case group IDs
 * @returns {Promise<Object>} Run details including runId and executionArn
 */
export async function startSecurityRun({ userId, groupIds }) {
  const runId = `run_${Date.now()}_${userId}`;

  const input = {
    runId,
    userId,
    groupIds,
  };

  const command = new StartExecutionCommand({
    stateMachineArn: process.env.AWS_STEP_FUNCTIONS_ARN,
    name: runId,
    input: JSON.stringify(input),
  });

  try {
    const response = await sfnClient.send(command);

    return {
      runId,
      executionArn: response.executionArn,
      startDate: response.startDate,
    };
  } catch (error) {
    console.error('Error starting security run:', error);
    throw new Error(`Failed to start security run: ${error.message}`);
  }
}

/**
 * Get the status of a running security assessment
 * @param {string} executionArn - Step Functions execution ARN
 * @returns {Promise<Object>} Execution status and details
 */
export async function getRunStatus(executionArn) {
  const command = new DescribeExecutionCommand({
    executionArn,
  });

  try {
    const response = await sfnClient.send(command);

    return {
      status: response.status, // RUNNING, SUCCEEDED, FAILED, TIMED_OUT, ABORTED
      startDate: response.startDate,
      stopDate: response.stopDate,
      input: JSON.parse(response.input),
      output: response.output ? JSON.parse(response.output) : null,
      error: response.error,
      cause: response.cause,
    };
  } catch (error) {
    console.error('Error getting run status:', error);
    throw new Error(`Failed to get run status: ${error.message}`);
  }
}

/**
 * Create WebSocket connection for real-time updates
 * @param {string} runId - Run ID to subscribe to
 * @returns {WebSocket} WebSocket connection
 */
export function createWebSocketConnection(runId) {
  if (typeof window === 'undefined') {
    throw new Error('WebSocket can only be created in browser environment');
  }

  const wsUrl = `${process.env.NEXT_PUBLIC_AWS_ORCHESTRATOR_WS_URL}?runId=${runId}`;
  const ws = new WebSocket(wsUrl);

  return ws;
}

/**
 * Subscribe to run events via WebSocket
 * @param {string} runId - Run ID to subscribe to
 * @param {Object} handlers - Event handlers
 * @param {Function} handlers.onRunStarted - Called when run starts
 * @param {Function} handlers.onUseCaseStarted - Called when use case processing starts
 * @param {Function} handlers.onUseCaseFinished - Called when use case processing finishes
 * @param {Function} handlers.onRunFinished - Called when run completes
 * @param {Function} handlers.onError - Called on error
 * @returns {WebSocket} WebSocket connection
 */
export function subscribeToRunEvents(runId, handlers = {}) {
  const ws = createWebSocketConnection(runId);

  ws.onopen = () => {
    console.log('WebSocket connected for run:', runId);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'run_started':
          handlers.onRunStarted?.(data.detail);
          break;
        case 'usecase_started':
          handlers.onUseCaseStarted?.(data.detail);
          break;
        case 'usecase_finished':
          handlers.onUseCaseFinished?.(data.detail);
          break;
        case 'run_finished':
          handlers.onRunFinished?.(data.detail);
          break;
        case 'run_failed':
          handlers.onError?.(data.detail);
          break;
        default:
          console.log('Unknown event type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      handlers.onError?.(error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    handlers.onError?.(error);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected for run:', runId);
  };

  return ws;
}

/**
 * Fetch run results from API
 * @param {string} runId - Run ID
 * @returns {Promise<Object>} Run results
 */
export async function fetchRunResults(runId) {
  const response = await fetch(
    `${process.env.AWS_ORCHESTRATOR_API_URL}/runs/${runId}`,
    {
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.AWS_ORCHESTRATOR_API_KEY && {
          'x-api-key': process.env.AWS_ORCHESTRATOR_API_KEY,
        }),
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch run results: ${response.statusText}`);
  }

  return response.json();
}
