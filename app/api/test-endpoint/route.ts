import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireApiUser } from "@/lib/auth/api-auth";
import { isBlockedUrl } from "@/lib/url-security";
import type { ApiTestResult } from "@/types";

const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { url, method = "GET", headers: reqHeaders = {}, body: reqBody, auth: authConfig } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 });
    }

    const normalizedMethod = String(method).toUpperCase();
    if (!ALLOWED_METHODS.has(normalizedMethod)) {
      return NextResponse.json({ success: false, error: "Unsupported HTTP method" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid URL format" }, { status: 400 });
    }

    if (isBlockedUrl(parsedUrl.toString())) {
      return NextResponse.json({ success: false, error: "Cannot send requests to internal addresses" }, { status: 400 });
    }

    const fetchHeaders: Record<string, string> = { ...reqHeaders };
    if (authConfig?.type === "bearer" && authConfig.value) {
      fetchHeaders["Authorization"] = `Bearer ${authConfig.value}`;
    } else if (authConfig?.type === "basic" && authConfig.value) {
      fetchHeaders["Authorization"] = `Basic ${Buffer.from(authConfig.value).toString("base64")}`;
    }

    const fetchOptions: RequestInit = {
      method: normalizedMethod,
      headers: fetchHeaders,
      signal: AbortSignal.timeout(15000),
      redirect: "manual",
    };

    if (reqBody && !["GET", "HEAD"].includes(normalizedMethod)) {
      fetchOptions.body = reqBody;
      if (!fetchHeaders["Content-Type"]) {
        try { JSON.parse(reqBody); fetchHeaders["Content-Type"] = "application/json"; } catch { fetchHeaders["Content-Type"] = "text/plain"; }
      }
    }

    const start = Date.now();
    let response: Response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      const result: ApiTestResult = {
        id: uuidv4(), url, method, status: 0, statusText: "Network Error",
        latency: Date.now() - start, responseHeaders: {}, responseBody: msg,
        size: 0, success: false, issues: [`Network error: ${msg}`],
        curlCommand: buildCurl(url, method, fetchHeaders, reqBody),
        fetchCode: buildFetch(url, method, fetchHeaders, reqBody),
        axiosCode: buildAxios(url, method, fetchHeaders, reqBody),
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, data: result });
    }

    const latency = Date.now() - start;
    const respText = await response.text();
    const respHeaders: Record<string, string> = {};
    response.headers.forEach((v, k) => { respHeaders[k] = v; });
    const size = new TextEncoder().encode(respText).length;

    const issues = detectIssues(response, respHeaders, latency, respText);

    const result: ApiTestResult = {
      id: uuidv4(), url, method,
      status: response.status,
      statusText: response.statusText,
      latency, responseHeaders: respHeaders,
      responseBody: respText.slice(0, 50000),
      size, success: response.ok,
      issues,
      curlCommand: buildCurl(url, method, fetchHeaders, reqBody),
      fetchCode: buildFetch(url, method, fetchHeaders, reqBody),
      axiosCode: buildAxios(url, method, fetchHeaders, reqBody),
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

function detectIssues(response: Response, headers: Record<string, string>, latency: number, body: string): string[] {
  const issues: string[] = [];
  if (latency > 3000) issues.push(`High latency: ${latency}ms (>3s)`);
  if (latency > 1000) issues.push(`Slow response: ${latency}ms (>1s)`);
  if (!headers["x-content-type-options"]) issues.push("Missing security header: X-Content-Type-Options");
  if (!headers["x-frame-options"] && !headers["content-security-policy"]) issues.push("Missing clickjacking protection: X-Frame-Options or CSP");
  if (response.status === 401) issues.push("Authentication required (401)");
  if (response.status === 403) issues.push("Access forbidden (403) — check permissions");
  if (response.status === 429) issues.push("Rate limited (429) — slow down requests");
  if (response.status >= 500) issues.push(`Server error: ${response.status} — backend issue`);
  if (!headers["cache-control"] && response.ok) issues.push("No Cache-Control header — consider adding caching");
  if (body.toLowerCase().includes("password") || body.toLowerCase().includes("secret")) issues.push("Response may contain sensitive data (password/secret detected)");
  return issues;
}

function buildCurl(url: string, method: string, headers: Record<string, string>, body?: string): string {
  const parts = [`curl -X ${method} '${url}'`];
  for (const [k, v] of Object.entries(headers)) parts.push(`  -H '${k}: ${v}'`);
  if (body) parts.push(`  -d '${body.replace(/'/g, "\\'")}'`);
  return parts.join(" \\\n");
}

function buildFetch(url: string, method: string, headers: Record<string, string>, body?: string): string {
  const opts: Record<string, unknown> = { method };
  if (Object.keys(headers).length) opts.headers = headers;
  if (body) opts.body = body;
  return `const response = await fetch('${url}', ${JSON.stringify(opts, null, 2)});\nconst data = await response.json();\nconsole.log(data);`;
}

function buildAxios(url: string, method: string, headers: Record<string, string>, body?: string): string {
  const config: Record<string, unknown> = { method: method.toLowerCase(), url };
  if (Object.keys(headers).length) config.headers = headers;
  if (body) { try { config.data = JSON.parse(body); } catch { config.data = body; } }
  return `const { data } = await axios(${JSON.stringify(config, null, 2)});\nconsole.log(data);`;
}
