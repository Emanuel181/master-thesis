/**
 * Safe localStorage operations with size limits and error handling
 * Prevents QuotaExceededError and data corruption
 */

const MAX_STORAGE_ITEM_SIZE = 500 * 1024; // 500KB per item
const TOTAL_STORAGE_BUDGET = 4 * 1024 * 1024; // 4MB total budget

// Keys ordered by priority (last = least important, cleared first)
const CLEARABLE_KEYS = [
    'vulniq_editor_tabs',
    'vulniq_code_state',
    'vulniq_editor_language',
];

/**
 * Calculate current localStorage usage in bytes
 * @returns {number} Total bytes used
 */
function getStorageUsage() {
    if (typeof window === 'undefined') return 0;

    let total = 0;
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            if (value) {
                total += key.length + value.length;
            }
        }
    } catch {
        // Ignore errors during size calculation
    }
    return total * 2; // UTF-16 encoding uses 2 bytes per character
}

/**
 * Clear storage items to make room for new data
 * @param {number} bytesNeeded - Bytes needed for new data
 * @returns {boolean} Whether enough space was freed
 */
function clearStorageIfNeeded(bytesNeeded) {
    if (typeof window === 'undefined') return true;

    const currentUsage = getStorageUsage();
    const availableSpace = TOTAL_STORAGE_BUDGET - currentUsage;

    if (availableSpace >= bytesNeeded) return true;

    // Clear items in order of priority (least important first)
    let freedSpace = 0;
    for (const key of CLEARABLE_KEYS) {
        try {
            const value = localStorage.getItem(key);
            if (value) {
                freedSpace += (key.length + value.length) * 2;
                localStorage.removeItem(key);
                console.warn(`[safe-storage] Cleared ${key} to free space`);

                if (availableSpace + freedSpace >= bytesNeeded) {
                    return true;
                }
            }
        } catch {
            // Continue trying other keys
        }
    }

    return availableSpace + freedSpace >= bytesNeeded;
}

/**
 * Safely set an item in localStorage with size checks
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON.stringify'd if not string)
 * @returns {{ ok: boolean, error?: string }} Result object
 */
export function safeSetItem(key, value) {
    if (typeof window === 'undefined') {
        return { ok: false, error: 'localStorage not available (SSR)' };
    }

    try {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        const byteSize = (key.length + serialized.length) * 2;

        // Check item size limit
        if (byteSize > MAX_STORAGE_ITEM_SIZE) {
            console.warn(`[safe-storage] Item ${key} (${byteSize} bytes) exceeds size limit (${MAX_STORAGE_ITEM_SIZE} bytes)`);
            return { ok: false, error: 'Item exceeds size limit' };
        }

        // Try to make room if needed
        if (!clearStorageIfNeeded(byteSize)) {
            console.warn(`[safe-storage] Cannot free enough space for ${key}`);
            return { ok: false, error: 'Insufficient storage space' };
        }

        localStorage.setItem(key, serialized);
        return { ok: true };

    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            console.error(`[safe-storage] QuotaExceededError for ${key}`);
            // Last resort: clear all clearable keys
            for (const clearKey of CLEARABLE_KEYS) {
                try {
                    localStorage.removeItem(clearKey);
                } catch {
                    // Ignore
                }
            }
            return { ok: false, error: 'Storage quota exceeded' };
        }

        console.error(`[safe-storage] Error setting ${key}:`, error);
        return { ok: false, error: error.message || 'Unknown error' };
    }
}

/**
 * Safely get an item from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if not found or error
 * @returns {*} The stored value or default
 */
export function safeGetItem(key, defaultValue = null) {
    if (typeof window === 'undefined') {
        return defaultValue;
    }

    try {
        const value = localStorage.getItem(key);
        if (value === null) return defaultValue;

        // Try to parse as JSON, return raw value if it fails
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    } catch (error) {
        console.error(`[safe-storage] Error getting ${key}:`, error);
        return defaultValue;
    }
}

/**
 * Safely remove an item from localStorage
 * @param {string} key - Storage key
 * @returns {{ ok: boolean, error?: string }} Result object
 */
export function safeRemoveItem(key) {
    if (typeof window === 'undefined') {
        return { ok: false, error: 'localStorage not available (SSR)' };
    }

    try {
        localStorage.removeItem(key);
        return { ok: true };
    } catch (error) {
        console.error(`[safe-storage] Error removing ${key}:`, error);
        return { ok: false, error: error.message || 'Unknown error' };
    }
}

/**
 * Get storage statistics
 * @returns {{ used: number, available: number, budget: number }}
 */
export function getStorageStats() {
    const used = getStorageUsage();
    return {
        used,
        available: Math.max(0, TOTAL_STORAGE_BUDGET - used),
        budget: TOTAL_STORAGE_BUDGET,
    };
}

const safeStorage = {
    setItem: safeSetItem,
    getItem: safeGetItem,
    removeItem: safeRemoveItem,
    getStats: getStorageStats,
};

export default safeStorage;

