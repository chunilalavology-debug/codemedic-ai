import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimitStore, rateLimitKey } from "@/lib/rate-limit";

describe("rate-limit", () => {
  beforeEach(() => resetRateLimitStore());

  it("allows requests under limit", () => {
    const key = rateLimitKey("user-1", "analyze");
    expect(checkRateLimit(key)).toBeNull();
    expect(checkRateLimit(key)).toBeNull();
  });

  it("blocks after max requests", () => {
    const key = rateLimitKey("user-2", "chat");
    for (let i = 0; i < 60; i++) {
      checkRateLimit(key);
    }
    const blocked = checkRateLimit(key);
    expect(blocked?.status).toBe(429);
  });
});
