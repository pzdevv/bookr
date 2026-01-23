/**
 * Simple client-side rate limiter utility
 * Note: For production, implement server-side rate limiting with Redis
 */

interface RateLimitEntry {
    count: number;
    firstAttempt: number;
}

const rateLimitStore: Map<string, RateLimitEntry> = new Map();

export interface RateLimitConfig {
    maxAttempts: number;
    windowMs: number; // Time window in milliseconds
}

const DEFAULT_CONFIG: RateLimitConfig = {
    maxAttempts: 5,
    windowMs: 60 * 1000, // 1 minute
};

/**
 * Check if an action is rate limited
 * @param key Unique identifier for the rate limit (e.g., 'login', 'signup', email address)
 * @param config Rate limit configuration
 * @returns Object with limited status and remaining attempts
 */
export function checkRateLimit(
    key: string,
    config: RateLimitConfig = DEFAULT_CONFIG
): { limited: boolean; remainingAttempts: number; resetInMs: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry) {
        // First attempt
        rateLimitStore.set(key, { count: 1, firstAttempt: now });
        return {
            limited: false,
            remainingAttempts: config.maxAttempts - 1,
            resetInMs: config.windowMs,
        };
    }

    // Check if window has expired
    if (now - entry.firstAttempt > config.windowMs) {
        // Reset the window
        rateLimitStore.set(key, { count: 1, firstAttempt: now });
        return {
            limited: false,
            remainingAttempts: config.maxAttempts - 1,
            resetInMs: config.windowMs,
        };
    }

    // Within window, check count
    const newCount = entry.count + 1;
    const resetInMs = config.windowMs - (now - entry.firstAttempt);

    if (newCount > config.maxAttempts) {
        return {
            limited: true,
            remainingAttempts: 0,
            resetInMs,
        };
    }

    // Update count
    rateLimitStore.set(key, { ...entry, count: newCount });
    return {
        limited: false,
        remainingAttempts: config.maxAttempts - newCount,
        resetInMs,
    };
}

/**
 * Reset rate limit for a key
 */
export function resetRateLimit(key: string): void {
    rateLimitStore.delete(key);
}

// Auth-specific rate limit configurations
export const AUTH_RATE_LIMITS = {
    login: { maxAttempts: 5, windowMs: 60 * 1000 }, // 5 attempts per minute
    signup: { maxAttempts: 3, windowMs: 60 * 1000 }, // 3 signups per minute
    passwordReset: { maxAttempts: 3, windowMs: 5 * 60 * 1000 }, // 3 per 5 minutes
    resendVerification: { maxAttempts: 2, windowMs: 5 * 60 * 1000 }, // 2 per 5 minutes
};

/**
 * Format remaining time for display
 */
export function formatResetTime(ms: number): string {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}
