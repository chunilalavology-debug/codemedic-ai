import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

export function checkRateLimit(key: string): NextResponse | null {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      {
        success: false,
        error: `Rate limit exceeded. Try again in ${retryAfter}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  entry.count += 1;
  return null;
}

export function rateLimitKey(userId: string, route: string): string {
  return `${userId}:${route}`;
}

/** Test helper */
export function resetRateLimitStore() {
  store.clear();
}
