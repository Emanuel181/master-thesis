/**
 * Distributed Circuit Breaker (PostgreSQL-backed)
 * ================================================
 * 
 * A circuit breaker that shares state across ECS Fargate tasks via PostgreSQL.
 * Unlike the in-memory CircuitBreaker, this ensures all instances see the same state.
 * 
 * Trade-offs vs in-memory:
 * - Higher latency (~5-10ms per state check)
 * - Requires database availability
 * - Shared state across all instances (correct behavior for distributed systems)
 * 
 * Use this for critical external APIs (GitHub, GitLab, Bedrock, etc.)
 */

import prisma from "@/lib/prisma";

// Circuit states
export const CircuitState = {
    CLOSED: 'CLOSED',       // Normal operation
    OPEN: 'OPEN',           // Failing fast
    HALF_OPEN: 'HALF_OPEN', // Testing recovery
};

// Default configuration
const DEFAULT_CONFIG = {
    failureThreshold: 5,        // Failures before opening
    resetTimeoutMs: 30000,      // 30s before trying half-open
    halfOpenSuccessThreshold: 2, // Successes needed to close
};

/**
 * Get or create circuit state from database
 * Uses atomic upsert to prevent race conditions
 * 
 * @param {string} circuitName - Unique circuit identifier
 * @returns {Promise<Object>} Circuit state record
 */
async function getCircuitState(circuitName) {
    const result = await prisma.$queryRaw`
        INSERT INTO "CircuitBreaker" (name, state, "failureCount", "successCount", "lastFailureAt", "lastStateChange", "updatedAt")
        VALUES (${circuitName}, 'CLOSED', 0, 0, NULL, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE SET "updatedAt" = NOW()
        RETURNING *
    `;
    return result[0];
}

/**
 * Update circuit state atomically
 * 
 * @param {string} circuitName
 * @param {Object} updates
 */
async function updateCircuitState(circuitName, updates) {
    const { state, failureCount, successCount, lastFailureAt } = updates;
    
    await prisma.$executeRaw`
        UPDATE "CircuitBreaker"
        SET 
            state = COALESCE(${state}, state),
            "failureCount" = COALESCE(${failureCount}, "failureCount"),
            "successCount" = COALESCE(${successCount}, "successCount"),
            "lastFailureAt" = COALESCE(${lastFailureAt}, "lastFailureAt"),
            "lastStateChange" = CASE WHEN ${state} IS NOT NULL THEN NOW() ELSE "lastStateChange" END,
            "updatedAt" = NOW()
        WHERE name = ${circuitName}
    `;
}

/**
 * Record a failure and potentially open the circuit
 * 
 * @param {string} circuitName
 * @param {Object} config - Circuit configuration
 * @returns {Promise<{state: string, failureCount: number}>}
 */
async function recordFailure(circuitName, config = DEFAULT_CONFIG) {
    // Atomic increment and conditional state change
    const result = await prisma.$queryRaw`
        UPDATE "CircuitBreaker"
        SET 
            "failureCount" = "failureCount" + 1,
            "lastFailureAt" = NOW(),
            state = CASE 
                WHEN state = 'HALF_OPEN' THEN 'OPEN'
                WHEN "failureCount" + 1 >= ${config.failureThreshold} THEN 'OPEN'
                ELSE state
            END,
            "lastStateChange" = CASE 
                WHEN state != (CASE 
                    WHEN state = 'HALF_OPEN' THEN 'OPEN'
                    WHEN "failureCount" + 1 >= ${config.failureThreshold} THEN 'OPEN'
                    ELSE state
                END) THEN NOW()
                ELSE "lastStateChange"
            END,
            "updatedAt" = NOW()
        WHERE name = ${circuitName}
        RETURNING state, "failureCount"
    `;
    return result[0] || { state: CircuitState.CLOSED, failureCount: 0 };
}

/**
 * Record a success and potentially close the circuit
 * 
 * @param {string} circuitName
 * @param {Object} config - Circuit configuration
 * @returns {Promise<{state: string, successCount: number}>}
 */
async function recordSuccess(circuitName, config = DEFAULT_CONFIG) {
    const result = await prisma.$queryRaw`
        UPDATE "CircuitBreaker"
        SET 
            "successCount" = CASE 
                WHEN state = 'HALF_OPEN' THEN "successCount" + 1
                ELSE 0
            END,
            "failureCount" = CASE 
                WHEN state = 'CLOSED' THEN 0
                ELSE "failureCount"
            END,
            state = CASE 
                WHEN state = 'HALF_OPEN' AND "successCount" + 1 >= ${config.halfOpenSuccessThreshold} THEN 'CLOSED'
                ELSE state
            END,
            "lastStateChange" = CASE 
                WHEN state = 'HALF_OPEN' AND "successCount" + 1 >= ${config.halfOpenSuccessThreshold} THEN NOW()
                ELSE "lastStateChange"
            END,
            "updatedAt" = NOW()
        WHERE name = ${circuitName}
        RETURNING state, "successCount"
    `;
    return result[0] || { state: CircuitState.CLOSED, successCount: 0 };
}

/**
 * Check if circuit should transition from OPEN to HALF_OPEN
 * 
 * @param {string} circuitName
 * @param {Object} config
 * @returns {Promise<{allowed: boolean, state: string, retryAfter?: number}>}
 */
async function checkCircuit(circuitName, config = DEFAULT_CONFIG) {
    const circuit = await getCircuitState(circuitName);
    const now = Date.now();
    
    if (circuit.state === CircuitState.CLOSED) {
        return { allowed: true, state: CircuitState.CLOSED };
    }
    
    if (circuit.state === CircuitState.HALF_OPEN) {
        return { allowed: true, state: CircuitState.HALF_OPEN };
    }
    
    // OPEN state - check if enough time has passed
    if (circuit.state === CircuitState.OPEN) {
        const lastFailure = circuit.lastFailureAt ? new Date(circuit.lastFailureAt).getTime() : 0;
        const elapsed = now - lastFailure;
        
        if (elapsed >= config.resetTimeoutMs) {
            // Transition to HALF_OPEN
            await updateCircuitState(circuitName, { 
                state: CircuitState.HALF_OPEN, 
                successCount: 0 
            });
            console.log(`[CircuitBreaker:${circuitName}] OPEN -> HALF_OPEN (after ${elapsed}ms)`);
            return { allowed: true, state: CircuitState.HALF_OPEN };
        }
        
        return { 
            allowed: false, 
            state: CircuitState.OPEN, 
            retryAfter: config.resetTimeoutMs - elapsed 
        };
    }
    
    return { allowed: true, state: circuit.state };
}

/**
 * Execute a function through the distributed circuit breaker
 * 
 * @param {string} circuitName - Unique circuit identifier (e.g., 'github-api', 'bedrock')
 * @param {Function} fn - Async function to execute
 * @param {Object} [config] - Circuit configuration overrides
 * @returns {Promise<*>} Result of the function
 * @throws {Error} If circuit is open or function fails
 * 
 * @example
 * const repos = await withCircuitBreaker('github-api', async () => {
 *     return await octokit.repos.listForAuthenticatedUser();
 * });
 */
export async function withCircuitBreaker(circuitName, fn, config = DEFAULT_CONFIG) {
    try {
        // Check circuit state
        const check = await checkCircuit(circuitName, config);
        
        if (!check.allowed) {
            const error = new Error(`Circuit breaker "${circuitName}" is OPEN`);
            error.code = 'CIRCUIT_OPEN';
            error.retryAfter = check.retryAfter;
            throw error;
        }
        
        // Execute the function
        const result = await fn();
        
        // Record success
        const newState = await recordSuccess(circuitName, config);
        if (newState.state === CircuitState.CLOSED && check.state === CircuitState.HALF_OPEN) {
            console.log(`[CircuitBreaker:${circuitName}] HALF_OPEN -> CLOSED (recovered)`);
        }
        
        return result;
        
    } catch (error) {
        // Don't record CIRCUIT_OPEN errors as failures
        if (error.code !== 'CIRCUIT_OPEN') {
            const newState = await recordFailure(circuitName, config);
            console.warn(`[CircuitBreaker:${circuitName}] Failure recorded. State: ${newState.state}, Count: ${newState.failureCount}`);
        }
        throw error;
    }
}

/**
 * Manually reset a circuit breaker
 * 
 * @param {string} circuitName
 */
export async function resetCircuit(circuitName) {
    await updateCircuitState(circuitName, {
        state: CircuitState.CLOSED,
        failureCount: 0,
        successCount: 0,
        lastFailureAt: null,
    });
    console.log(`[CircuitBreaker:${circuitName}] Manually reset to CLOSED`);
}

/**
 * Get status of a circuit breaker
 * 
 * @param {string} circuitName
 * @returns {Promise<Object>}
 */
export async function getCircuitStatus(circuitName) {
    return getCircuitState(circuitName);
}

/**
 * Get status of all circuit breakers
 * 
 * @returns {Promise<Object[]>}
 */
export async function getAllCircuitStatuses() {
    return prisma.$queryRaw`
        SELECT * FROM "CircuitBreaker" ORDER BY name
    `;
}
