import { describe, it, expect } from "vitest";
import { isBlockedUrl, normalizeHttpUrl } from "@/lib/url-security";

describe("url-security", () => {
  it("normalizes URLs without a scheme", () => {
    expect(normalizeHttpUrl("example.com")).toBe("https://example.com/");
  });

  it("rejects invalid URLs", () => {
    expect(normalizeHttpUrl("not a url")).toBeNull();
  });

  it("blocks localhost and private networks", () => {
    expect(isBlockedUrl("http://localhost:3000")).toBe(true);
    expect(isBlockedUrl("http://127.0.0.1/admin")).toBe(true);
    expect(isBlockedUrl("http://192.168.0.1")).toBe(true);
    expect(isBlockedUrl("http://10.0.0.5")).toBe(true);
  });

  it("allows public HTTPS URLs", () => {
    expect(isBlockedUrl("https://example.com")).toBe(false);
    expect(isBlockedUrl("https://api.github.com/repos/vercel/next.js")).toBe(false);
  });

  it("blocks non-http protocols", () => {
    expect(isBlockedUrl("file:///etc/passwd")).toBe(true);
    expect(isBlockedUrl("ftp://example.com")).toBe(true);
  });
});

describe("auth callback redirect", () => {
  it("rejects unsafe next paths", async () => {
    const { getSafeRedirectPath } = await import("@/lib/auth/safe-redirect");
    expect(getSafeRedirectPath("/overview")).toBe("/overview");
    expect(getSafeRedirectPath("//evil.com")).toBe("/overview");
    expect(getSafeRedirectPath("https://evil.com")).toBe("/overview");
    expect(getSafeRedirectPath(null)).toBe("/overview");
  });
});
