/**
 * WebSocket Real-time Updates Hook
 * =================================
 *
 * Provides real-time progress updates for workflow execution.
 * Uses WebSocket connection with automatic reconnection.
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Event-based state updates
 * - Connection status tracking
 * - Heartbeat to keep connection alive
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// WebSocket connection states
export const WS_STATE = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    RECONNECTING: 'reconnecting',
    ERROR: 'error',
};

// Event types from the workflow
export const WORKFLOW_EVENTS = {
    RUN_STARTED: 'run_started',
    USE_CASE_STARTED: 'use_case_started',
    USE_CASE_COMPLETED: 'use_case_completed',
    AGENT_STARTED: 'agent_started',
    AGENT_COMPLETED: 'agent_completed',
    VULNERABILITY_FOUND: 'vulnerability_found',
    RUN_COMPLETED: 'run_completed',
    RUN_FAILED: 'run_failed',
    HEARTBEAT: 'heartbeat',
};

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt, baseDelay = 1000, maxDelay = 30000) {
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
}

/**
 * Hook for WebSocket real-time workflow updates
 *
 * @param {Object} options
 * @param {string} options.runId - Workflow run ID to subscribe to
 * @param {string} options.wsUrl - WebSocket URL (defaults to env variable)
 * @param {boolean} options.autoConnect - Whether to connect automatically
 * @param {Function} options.onEvent - Callback for each event
 * @param {Function} options.onStatusChange - Callback for status changes
 */
export function useWorkflowWebSocket({
    runId,
    wsUrl = process.env.NEXT_PUBLIC_AWS_ORCHESTRATOR_WS_URL,
    autoConnect = true,
    onEvent,
    onStatusChange,
}) {
    const [status, setStatus] = useState(WS_STATE.DISCONNECTED);
    const [events, setEvents] = useState([]);
    const [progress, setProgress] = useState({
        totalUseCases: 0,
        completedUseCases: 0,
        currentUseCase: null,
        currentAgent: null,
        vulnerabilitiesFound: 0,
        percentage: 0,
    });
    const [error, setError] = useState(null);

    const wsRef = useRef(null);
    const reconnectAttemptRef = useRef(0);
    const reconnectTimeoutRef = useRef(null);
    const heartbeatIntervalRef = useRef(null);

    // Update status and notify callback
    const updateStatus = useCallback((newStatus) => {
        setStatus(newStatus);
        onStatusChange?.(newStatus);
    }, [onStatusChange]);

    // Process incoming event
    const processEvent = useCallback((event) => {
        // Add to events list
        setEvents(prev => [...prev, { ...event, receivedAt: Date.now() }]);

        // Update progress based on event type
        switch (event.type) {
            case WORKFLOW_EVENTS.RUN_STARTED:
                setProgress(prev => ({
                    ...prev,
                    totalUseCases: event.detail?.totalUseCases || prev.totalUseCases,
                    completedUseCases: 0,
                    percentage: 0,
                }));
                break;

            case WORKFLOW_EVENTS.USE_CASE_STARTED:
                setProgress(prev => ({
                    ...prev,
                    currentUseCase: event.detail?.useCaseTitle || event.detail?.useCaseId,
                }));
                break;

            case WORKFLOW_EVENTS.USE_CASE_COMPLETED:
                setProgress(prev => {
                    const completed = prev.completedUseCases + 1;
                    return {
                        ...prev,
                        completedUseCases: completed,
                        percentage: prev.totalUseCases > 0
                            ? Math.round((completed / prev.totalUseCases) * 100)
                            : 0,
                        currentUseCase: null,
                    };
                });
                break;

            case WORKFLOW_EVENTS.AGENT_STARTED:
                setProgress(prev => ({
                    ...prev,
                    currentAgent: event.detail?.agentType,
                }));
                break;

            case WORKFLOW_EVENTS.AGENT_COMPLETED:
                setProgress(prev => ({
                    ...prev,
                    currentAgent: null,
                }));
                break;

            case WORKFLOW_EVENTS.VULNERABILITY_FOUND:
                setProgress(prev => ({
                    ...prev,
                    vulnerabilitiesFound: prev.vulnerabilitiesFound + 1,
                }));
                break;

            case WORKFLOW_EVENTS.RUN_COMPLETED:
                setProgress(prev => ({
                    ...prev,
                    percentage: 100,
                    currentUseCase: null,
                    currentAgent: null,
                }));
                break;

            case WORKFLOW_EVENTS.RUN_FAILED:
                setError(event.detail?.error || 'Workflow failed');
                break;
        }

        // Notify callback
        onEvent?.(event);
    }, [onEvent]);

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (!wsUrl || !runId) {
            console.warn('[WebSocket] Missing URL or runId');
            return;
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('[WebSocket] Already connected');
            return;
        }

        updateStatus(WS_STATE.CONNECTING);

        try {
            const url = `${wsUrl}?runId=${runId}`;
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('[WebSocket] Connected');
                updateStatus(WS_STATE.CONNECTED);
                reconnectAttemptRef.current = 0;
                setError(null);

                // Start heartbeat
                heartbeatIntervalRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'ping' }));
                    }
                }, 30000);
            };

            ws.onmessage = (messageEvent) => {
                try {
                    const data = JSON.parse(messageEvent.data);

                    // Skip heartbeat responses
                    if (data.type === 'pong') return;

                    processEvent(data);
                } catch (err) {
                    console.error('[WebSocket] Failed to parse message:', err);
                }
            };

            ws.onerror = (err) => {
                console.error('[WebSocket] Error:', err);
                updateStatus(WS_STATE.ERROR);
                setError('WebSocket connection error');
            };

            ws.onclose = (closeEvent) => {
                console.log('[WebSocket] Closed:', closeEvent.code, closeEvent.reason);

                // Clear heartbeat
                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current);
                }

                // Attempt reconnection if not intentionally closed
                if (closeEvent.code !== 1000 && closeEvent.code !== 1001) {
                    updateStatus(WS_STATE.RECONNECTING);

                    const delay = getBackoffDelay(reconnectAttemptRef.current);
                    reconnectAttemptRef.current++;

                    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current})`);

                    // Schedule reconnection - this will re-trigger the effect
                    reconnectTimeoutRef.current = setTimeout(() => {
                        // Force a re-render to trigger reconnection
                        wsRef.current = null;
                        updateStatus(WS_STATE.CONNECTING);
                    }, delay);
                } else {
                    updateStatus(WS_STATE.DISCONNECTED);
                }
            };

        } catch (err) {
            console.error('[WebSocket] Connection error:', err);
            updateStatus(WS_STATE.ERROR);
            setError(err.message);
        }
    }, [wsUrl, runId, updateStatus, processEvent]);

    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        // Clear reconnection timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
        }

        // Close WebSocket
        if (wsRef.current) {
            wsRef.current.close(1000, 'Client disconnect');
            wsRef.current = null;
        }

        updateStatus(WS_STATE.DISCONNECTED);
    }, [updateStatus]);

    // Auto-connect on mount and reconnect when status changes to CONNECTING
    useEffect(() => {
        if (autoConnect && runId && (status === WS_STATE.DISCONNECTED || status === WS_STATE.CONNECTING)) {
            // Only connect if we don't already have a connection
            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                connect();
            }
        }

        return () => {
            // Cleanup on unmount
        };
    }, [autoConnect, runId, status, connect]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    // Reset events
    const resetEvents = useCallback(() => {
        setEvents([]);
        setProgress({
            totalUseCases: 0,
            completedUseCases: 0,
            currentUseCase: null,
            currentAgent: null,
            vulnerabilitiesFound: 0,
            percentage: 0,
        });
        setError(null);
    }, []);

    return {
        status,
        events,
        progress,
        error,
        connect,
        disconnect,
        resetEvents,
        isConnected: status === WS_STATE.CONNECTED,
        isConnecting: status === WS_STATE.CONNECTING || status === WS_STATE.RECONNECTING,
    };
}

export default useWorkflowWebSocket;
