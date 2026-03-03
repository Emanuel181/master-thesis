import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for managing security assessment runs
 */
export function useOrchestrator() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentRun, setCurrentRun] = useState(null);
  const [runStatus, setRunStatus] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  /**
   * Start a new security assessment run
   */
  const startRun = useCallback(async (groupIds) => {
    setIsRunning(true);
    setError(null);
    setEvents([]);

    try {
      const response = await fetch('/api/orchestrator/runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to start run');
      }

      const result = await response.json();
      setCurrentRun(result.data);
      
      // Connect to WebSocket for real-time updates
      connectWebSocket(result.data.runId);

      return result.data;
    } catch (err) {
      setError(err.message);
      setIsRunning(false);
      throw err;
    }
  }, []);

  /**
   * Connect to WebSocket for real-time updates
   */
  const connectWebSocket = useCallback((runId) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = `${process.env.NEXT_PUBLIC_AWS_ORCHESTRATOR_WS_URL}?runId=${runId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      addEvent({ type: 'connection', message: 'Connected to run updates' });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        addEvent(data);

        // Update run status based on events
        if (data.type === 'run_finished') {
          setIsRunning(false);
          setRunStatus('completed');
        } else if (data.type === 'run_failed') {
          setIsRunning(false);
          setRunStatus('failed');
          setError(data.detail.error);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('WebSocket connection error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      addEvent({ type: 'connection', message: 'Disconnected from run updates' });
    };

    wsRef.current = ws;
  }, []);

  /**
   * Add an event to the events list
   */
  const addEvent = useCallback((event) => {
    setEvents((prev) => [...prev, { ...event, timestamp: new Date() }]);
  }, []);

  /**
   * Get the current status of a run
   */
  const getStatus = useCallback(async (executionArn) => {
    try {
      const encodedArn = encodeURIComponent(executionArn);
      const response = await fetch(`/api/orchestrator/runs/${encodedArn}`);

      if (!response.ok) {
        throw new Error('Failed to get run status');
      }

      const result = await response.json();
      setRunStatus(result.data.status);
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Stop the current run
   */
  const stopRun = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsRunning(false);
    setCurrentRun(null);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    // State
    isRunning,
    currentRun,
    runStatus,
    events,
    error,

    // Actions
    startRun,
    getStatus,
    stopRun,
  };
}
