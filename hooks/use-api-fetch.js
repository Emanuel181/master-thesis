/**
 * useApiFetch - React hook for API calls with built-in retry, loading, and error states
 * 
 * Provides a consistent pattern for making API calls in components with:
 * - Automatic retry on transient failures
 * - Loading and error state management
 * - Request deduplication
 * - Abort controller support for cleanup
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS = {
    maxAttempts: 3,
    baseDelayMs: 500,
    maxDelayMs: 5000,
    timeoutMs: 15000,
    retryOnStatus: [429, 500, 502, 503, 504],
};

/**
 * Delay helper with exponential backoff and jitter
 */
const delay = (attempt, baseDelay, maxDelay) => {
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    const jitter = Math.random() * 0.3 * exponentialDelay;
    return exponentialDelay + jitter;
};

/**
 * Core fetch function with retry logic
 */
async function fetchWithRetry(url, options, retryOptions, signal) {
    const { maxAttempts, baseDelayMs, maxDelayMs, timeoutMs, retryOnStatus } = {
        ...DEFAULT_RETRY_OPTIONS,
        ...retryOptions,
    };

    let lastError;
    let lastResponse;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        // Check if aborted before each attempt
        if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            // Combine signals if provided
            const combinedSignal = signal
                ? AbortSignal.any?.([signal, controller.signal]) || controller.signal
                : controller.signal;

            const response = await fetch(url, {
                ...options,
                signal: combinedSignal,
            });

            clearTimeout(timeoutId);

            // Check if response should trigger retry
            if (retryOnStatus.includes(response.status)) {
                lastResponse = response;
                
                if (attempt < maxAttempts) {
                    await new Promise(r => setTimeout(r, delay(attempt, baseDelayMs, maxDelayMs)));
                    continue;
                }
            }

            return response;
        } catch (error) {
            clearTimeout?.(undefined); // Clear any pending timeout

            // Don't retry on abort
            if (error.name === 'AbortError') {
                throw error;
            }

            lastError = error;

            // Retry on network errors
            if (attempt < maxAttempts) {
                await new Promise(r => setTimeout(r, delay(attempt, baseDelayMs, maxDelayMs)));
                continue;
            }
        }
    }

    if (lastError) throw lastError;
    return lastResponse;
}

/**
 * Parse API response with error handling
 */
async function parseResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
        const data = await response.json();
        
        if (!response.ok) {
            const error = new Error(data.error || data.message || `Request failed with status ${response.status}`);
            error.status = response.status;
            error.code = data.code;
            error.data = data;
            throw error;
        }
        
        // Handle standardized response format
        if (typeof data.success === 'boolean') {
            if (!data.success) {
                const error = new Error(data.error || 'Request failed');
                error.status = response.status;
                error.code = data.code;
                error.data = data;
                throw error;
            }
            return data.data !== undefined ? data.data : data;
        }
        
        return data;
    }
    
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }
    
    return response.text();
}

/**
 * useApiFetch hook
 * 
 * @param {Object} options - Hook options
 * @param {Object} [options.retryOptions] - Retry configuration
 * @returns {Object} - { fetch, loading, error, data, reset }
 * 
 * @example
 * const { fetch: fetchData, loading, error, data } = useApiFetch();
 * 
 * useEffect(() => {
 *   fetchData('/api/items').then(setItems);
 * }, []);
 */
export function useApiFetch(options = {}) {
    const { retryOptions = {} } = options;
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    
    const abortControllerRef = useRef(null);
    const mountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            abortControllerRef.current?.abort();
        };
    }, []);

    const apiFetch = useCallback(async (url, fetchOptions = {}) => {
        // Abort any pending request
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        if (mountedRef.current) {
            setLoading(true);
            setError(null);
        }

        try {
            const response = await fetchWithRetry(
                url,
                fetchOptions,
                { ...DEFAULT_RETRY_OPTIONS, ...retryOptions, ...fetchOptions.retryOptions },
                abortControllerRef.current.signal
            );

            const result = await parseResponse(response);

            if (mountedRef.current) {
                setData(result);
                setLoading(false);
            }

            return result;
        } catch (err) {
            // Don't update state if aborted or unmounted
            if (err.name === 'AbortError' || !mountedRef.current) {
                return null;
            }

            if (mountedRef.current) {
                setError(err);
                setLoading(false);
            }

            throw err;
        }
    }, [retryOptions]);

    const reset = useCallback(() => {
        abortControllerRef.current?.abort();
        setLoading(false);
        setError(null);
        setData(null);
    }, []);

    return {
        fetch: apiFetch,
        loading,
        error,
        data,
        reset,
    };
}

/**
 * useMutation hook - For POST/PUT/DELETE operations
 * 
 * @param {string} url - API endpoint
 * @param {Object} options - Mutation options
 * @returns {Object} - { mutate, loading, error, data, reset }
 * 
 * @example
 * const { mutate, loading, error } = useMutation('/api/items');
 * 
 * const handleSubmit = async (data) => {
 *   await mutate({ method: 'POST', body: JSON.stringify(data) });
 * };
 */
export function useMutation(url, options = {}) {
    const { onSuccess, onError, ...fetchOptions } = options;
    const { fetch: apiFetch, loading, error, data, reset } = useApiFetch(fetchOptions);

    const mutate = useCallback(async (mutationOptions = {}) => {
        try {
            const result = await apiFetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                ...mutationOptions,
            });
            
            onSuccess?.(result);
            return result;
        } catch (err) {
            onError?.(err);
            throw err;
        }
    }, [url, apiFetch, onSuccess, onError]);

    return { mutate, loading, error, data, reset };
}

export default useApiFetch;

