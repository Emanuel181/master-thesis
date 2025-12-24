/**
 * Circuit Breaker implementation for external API resilience
 * Prevents cascading failures by temporarily stopping requests to failing services
 */

// Circuit states
const STATE = {
    CLOSED: 'CLOSED',     // Normal operation, requests flow through
    OPEN: 'OPEN',         // Circuit tripped, all requests fail immediately
    HALF_OPEN: 'HALF_OPEN' // Testing if service recovered
};

/**
 * Circuit Breaker class
 * @example
 * const breaker = new CircuitBreaker({ name: 'github-api' });
 * const result = await breaker.call(async () => {
 *     return await fetch('/api/github/repos');
 * });
 */
export class CircuitBreaker {
    /**
     * @param {Object} options - Circuit breaker options
     * @param {string} options.name - Name for logging/identification
     * @param {number} options.failureThreshold - Number of failures before opening (default: 5)
     * @param {number} options.resetTimeoutMs - Time to wait before half-open (default: 30000)
     * @param {number} options.halfOpenSuccessThreshold - Successes needed to close (default: 2)
     */
    constructor({
        name = 'circuit-breaker',
        failureThreshold = 5,
        resetTimeoutMs = 30000,
        halfOpenSuccessThreshold = 2,
    } = {}) {
        this.name = name;
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs = resetTimeoutMs;
        this.halfOpenSuccessThreshold = halfOpenSuccessThreshold;

        this.state = STATE.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.resetTimeout = null;
    }

    /**
     * Execute a function through the circuit breaker
     * @param {Function} fn - Async function to execute
     * @returns {Promise<*>} Result of the function
     * @throws {Error} If circuit is open or function fails
     */
    async call(fn) {
        // Check circuit state
        if (this.state === STATE.OPEN) {
            // Check if we should transition to half-open
            const now = Date.now();
            if (this.lastFailureTime && (now - this.lastFailureTime) >= this.resetTimeoutMs) {
                this.transitionTo(STATE.HALF_OPEN);
            } else {
                const error = new Error(`Circuit breaker "${this.name}" is OPEN`);
                error.code = 'CIRCUIT_OPEN';
                error.retryAfter = this.lastFailureTime + this.resetTimeoutMs - now;
                throw error;
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure(error);
            throw error;
        }
    }

    /**
     * Handle successful execution
     */
    onSuccess() {
        if (this.state === STATE.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.halfOpenSuccessThreshold) {
                this.transitionTo(STATE.CLOSED);
            }
        } else if (this.state === STATE.CLOSED) {
            // Reset failure count on success
            this.failureCount = 0;
        }
    }

    /**
     * Handle failed execution
     * @param {Error} error - The error that occurred
     */
    onFailure(error) {
        this.lastFailureTime = Date.now();

        if (this.state === STATE.HALF_OPEN) {
            // Any failure in half-open state trips the circuit
            this.transitionTo(STATE.OPEN);
        } else if (this.state === STATE.CLOSED) {
            this.failureCount++;
            if (this.failureCount >= this.failureThreshold) {
                this.transitionTo(STATE.OPEN);
            }
        }

        // Log in development
        if (process.env.NODE_ENV === 'development') {
            console.warn(`[CircuitBreaker:${this.name}] Failure ${this.failureCount}/${this.failureThreshold}:`, error.message);
        }
    }

    /**
     * Transition to a new state
     * @param {string} newState - The state to transition to
     */
    transitionTo(newState) {
        const oldState = this.state;
        this.state = newState;

        if (newState === STATE.CLOSED) {
            this.failureCount = 0;
            this.successCount = 0;
        } else if (newState === STATE.HALF_OPEN) {
            this.successCount = 0;
        }

        if (process.env.NODE_ENV === 'development') {
            console.log(`[CircuitBreaker:${this.name}] State: ${oldState} -> ${newState}`);
        }
    }

    /**
     * Manually reset the circuit breaker
     */
    reset() {
        this.state = STATE.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
    }

    /**
     * Get current circuit status
     * @returns {Object} Status object
     */
    getStatus() {
        return {
            name: this.name,
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastFailureTime: this.lastFailureTime,
        };
    }
}

// Shared circuit breakers for common services
const circuits = new Map();

/**
 * Get or create a circuit breaker for a service
 * @param {string} name - Service name
 * @param {Object} options - Circuit breaker options
 * @returns {CircuitBreaker} The circuit breaker
 */
export function getCircuitBreaker(name, options = {}) {
    if (!circuits.has(name)) {
        circuits.set(name, new CircuitBreaker({ name, ...options }));
    }
    return circuits.get(name);
}

/**
 * Get status of all circuit breakers
 * @returns {Object[]} Array of status objects
 */
export function getAllCircuitStatus() {
    return Array.from(circuits.values()).map(cb => cb.getStatus());
}

/**
 * Reset all circuit breakers (useful for testing)
 */
export function resetAllCircuits() {
    for (const circuit of circuits.values()) {
        circuit.reset();
    }
}

export default CircuitBreaker;

