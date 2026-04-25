/**
 * Production-ready rate limiter with Redis support for Vercel.
 *
 * Uses Upstash Redis in production for shared state across serverless instances.
 * Falls back to in-memory store for development.
 *
 * Usage:
 *   const result = await rateLimit(ip, { limit: 10, windowMs: 15 * 60 * 1000 });
 *   if (!result.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

import { Redis } from "@upstash/redis";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  /** Maximum number of requests allowed per window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// In-memory store for development / fallback
const memoryStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of Array.from(memoryStore)) {
      if (entry.resetAt < now) memoryStore.delete(key);
    }
  }, 5 * 60 * 1000);
}

// Redis client (initialized lazily)
let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (url && token) {
    redis = new Redis({ url, token });
  }
  
  return redis;
}

// In-memory rate limiting for development
function memoryRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + options.windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: options.limit - 1, resetAt };
  }

  existing.count += 1;
  memoryStore.set(key, existing);

  const remaining = Math.max(0, options.limit - existing.count);
  return {
    allowed: existing.count <= options.limit,
    remaining,
    resetAt: existing.resetAt,
  };
}

// Redis-based rate limiting for production
async function redisRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) {
    return memoryRateLimit(key, options);
  }

  const now = Date.now();
  const windowMs = options.windowMs;
  const resetAt = now + windowMs;
  
  const redisKey = `ratelimit:${key}`;
  
  try {
    // Get current count and expiration
    const current = await redis.get<{ count: number; resetAt: number }>(redisKey);
    
    if (!current || current.resetAt < now) {
      // New window
      await redis.set(redisKey, { count: 1, resetAt }, { ex: Math.ceil(windowMs / 1000) });
      return { allowed: true, remaining: options.limit - 1, resetAt };
    }
    
    // Increment count
    const newCount = current.count + 1;
    const ttl = Math.ceil((current.resetAt - now) / 1000);
    await redis.set(redisKey, { count: newCount, resetAt: current.resetAt }, { ex: ttl });
    
    const remaining = Math.max(0, options.limit - newCount);
    return {
      allowed: newCount <= options.limit,
      remaining,
      resetAt: current.resetAt,
    };
  } catch (error) {
    // Fallback to memory if Redis fails
    console.error("Redis rate limit error, falling back to memory:", error);
    return memoryRateLimit(key, options);
  }
}

// Main rate limit function - async to support Redis
export async function rateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const redis = getRedis();
  if (redis) {
    return redisRateLimit(key, options);
  }
  return memoryRateLimit(key, options);
}

/**
 * Extract the real client IP from Vercel / Next.js request headers.
 * Falls back to "unknown" if no IP can be found.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Global rate limiting config for production.
 * Use these presets for consistent rate limiting across your app.
 */
export const RateLimitPresets = {
  // Login endpoints - strict
  login: { limit: 5, windowMs: 15 * 60 * 1000 },
  // Registration - stricter
  register: { limit: 3, windowMs: 60 * 60 * 1000 },
  // API mutations - moderate
  apiMutation: { limit: 100, windowMs: 60 * 1000 },
  // API queries - generous
  apiQuery: { limit: 200, windowMs: 60 * 1000 },
  // File uploads - strict due to storage costs
  upload: { limit: 20, windowMs: 60 * 1000 },
};
