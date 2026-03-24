/**
 * Simple sliding-window rate limiter.
 *
 * Works in Vercel serverless functions using in-memory state per instance.
 * For production with many concurrent instances, swap the store with
 * Upstash Redis (see the comment at the bottom of this file).
 *
 * Usage:
 *   const result = await rateLimit(ip, { limit: 10, windowMs: 15 * 60 * 1000 });
 *   if (!result.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store — shared within a single serverless instance
const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(store)) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

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

export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  // Window has expired or no entry — start a fresh window
  if (!existing || existing.resetAt < now) {
    const resetAt = now + options.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: options.limit - 1, resetAt };
  }

  // Within the window — increment
  existing.count += 1;
  store.set(key, existing);

  const remaining = Math.max(0, options.limit - existing.count);
  return {
    allowed: existing.count <= options.limit,
    remaining,
    resetAt: existing.resetAt,
  };
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

// ─── Upstash Redis drop-in replacement ───────────────────────────────────────
//
// When you have many Vercel instances (high traffic), replace the in-memory
// store above with Upstash Redis for shared state across instances.
//
// 1. Install: npm install @upstash/ratelimit @upstash/redis
// 2. Add to .env.local:
//      UPSTASH_REDIS_REST_URL=...
//      UPSTASH_REDIS_REST_TOKEN=...
// 3. Replace the `rateLimit` function with:
//
//   import { Ratelimit } from "@upstash/ratelimit";
//   import { Redis } from "@upstash/redis";
//
//   const redis = new Redis({
//     url: process.env.UPSTASH_REDIS_REST_URL!,
//     token: process.env.UPSTASH_REDIS_REST_TOKEN!,
//   });
//
//   const limiter = new Ratelimit({
//     redis,
//     limiter: Ratelimit.slidingWindow(10, "15 m"),
//   });
//
//   export async function rateLimit(key: string) {
//     return limiter.limit(key);
//   }