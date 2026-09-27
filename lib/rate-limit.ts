/**
 * Rate limiting middleware para prevenir abuso de API
 * Implementado com estratégia de token bucket
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Checks rate limit for a given user
 * Uses in-memory counter with TTL (suitable for Cloudflare Workers)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  userId: string,
  config: RateLimitConfig = { maxRequests: 100, windowSeconds: 3600, keyPrefix: 'rl' }
): RateLimitResult {
  const now = Date.now();
  const key = `${config.keyPrefix}:${userId}`;

  let entry = rateLimitStore.get(key);

  // Clean up expired entries
  if (entry && entry.resetAt < now) {
    rateLimitStore.delete(key);
    entry = undefined;
  }

  if (!entry) {
    // New entry
    const resetAt = now + config.windowSeconds * 1000;
    rateLimitStore.set(key, { count: 1, resetAt });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: Math.floor(resetAt / 1000)
    };
  }

  // Existing entry
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: Math.floor(entry.resetAt / 1000),
      retryAfter
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: Math.floor(entry.resetAt / 1000)
  };
}

/**
 * Enhanced rate limiting with different limits per action
 */
export const RATE_LIMIT_CONFIGS = {
  default: { maxRequests: 100, windowSeconds: 3600 },
  import: { maxRequests: 10, windowSeconds: 3600 },
  batch: { maxRequests: 50, windowSeconds: 3600 },
  contact: { maxRequests: 200, windowSeconds: 3600 }
} as const;

export function applyRateLimit(
  userId: string,
  actionType: keyof typeof RATE_LIMIT_CONFIGS = 'default'
): RateLimitResult {
  return checkRateLimit(userId, RATE_LIMIT_CONFIGS[actionType]);
}

/**
 * Cleanup function to run periodically (e.g., every hour)
 */
export function cleanupRateLimitStore(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Format rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString()
  };

  if (!result.allowed && result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}
