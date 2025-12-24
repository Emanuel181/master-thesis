/**
 * Fetch wrapper with timeout support
 * Prevents hung requests that can block user actions indefinitely
 */

/**
 * Fetch with configurable timeout
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {number} timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns {Promise<Response>} - The fetch response
 * @throws {Error} - Throws if request times out or fails
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Fetch with retry support for transient failures
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {Object} retryOptions - Retry configuration
 * @returns {Promise<Response>} - The fetch response
 */
export async function fetchWithRetry(url, options = {}, retryOptions = {}) {
    const {
        maxAttempts = 3,
        baseDelayMs = 1000,
        maxDelayMs = 10000,
        timeoutMs = 10000,
        retryOn = (response, error) => {
            // Retry on network errors
            if (error) return true;
            // Retry on 429 (rate limit) and 5xx (server errors)
            return response.status === 429 || response.status >= 500;
        }
    } = retryOptions;

    let lastError;
    let lastResponse;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await fetchWithTimeout(url, options, timeoutMs);

            // Check if we should retry based on response
            if (!retryOn(response, null)) {
                return response;
            }

            lastResponse = response;

            // Don't retry on final attempt
            if (attempt === maxAttempts) {
                return response;
            }

        } catch (error) {
            lastError = error;

            // Don't retry on final attempt
            if (attempt === maxAttempts) {
                throw error;
            }

            // Check if we should retry based on error
            if (!retryOn(null, error)) {
                throw error;
            }
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.3 * delay;
        await new Promise(r => setTimeout(r, delay + jitter));
    }

    // This shouldn't be reached, but just in case
    if (lastError) throw lastError;
    return lastResponse;
}

export default fetchWithTimeout;

