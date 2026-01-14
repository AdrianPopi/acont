import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL || "https://acont-production.up.railway.app";

/**
 * Rewrite Set-Cookie headers from backend to work with the frontend domain:
 * - Remove Domain= attribute so cookie is set for current domain
 * - Change SameSite=None to SameSite=Lax (now first-party)
 * - Keep Secure for HTTPS
 */
function rewriteSetCookie(cookie: string): string {
  return (
    cookie
      // Remove Domain attribute entirely
      .replace(/;\s*Domain=[^;]*/gi, "")
      // Change SameSite=None to Lax (first-party now)
      .replace(/;\s*SameSite=None/gi, "; SameSite=Lax")
  );
}

/**
 * Extract all Set-Cookie headers from a Response.
 * Uses multiple methods for compatibility across environments.
 */
function extractSetCookieHeaders(res: Response): string[] {
  const cookies: string[] = [];

  // Method 1: getSetCookie() (modern browsers/Node 18+)
  if (typeof res.headers.getSetCookie === "function") {
    const fromMethod = res.headers.getSetCookie();
    if (fromMethod && fromMethod.length > 0) {
      cookies.push(...fromMethod);
    }
  }

  // Method 2: Fallback - get raw header (may be comma-joined)
  if (cookies.length === 0) {
    const raw = res.headers.get("set-cookie");
    if (raw) {
      // Split carefully - cookies can contain commas in dates
      // Pattern: split on comma followed by space and cookie name=
      const parts = raw.split(/,(?=\s*[^=;]+=[^;]*)/);
      cookies.push(...parts.map((c) => c.trim()));
    }
  }

  return cookies;
}

export async function handler(req: NextRequest) {
  const path = req.nextUrl.pathname.replace(/^\/api/, "");
  const url = `${BACKEND_URL}${path}${req.nextUrl.search}`;

  const headers = new Headers();

  // Forward relevant headers
  const forwardHeaders = ["content-type", "accept", "authorization"];

  for (const name of forwardHeaders) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }

  // Forward cookies from request
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  // Forward body for non-GET requests
  if (req.method !== "GET" && req.method !== "HEAD") {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      fetchOptions.body = await req.text();
    } else if (contentType.includes("multipart/form-data")) {
      fetchOptions.body = await req.arrayBuffer();
    } else {
      fetchOptions.body = await req.text();
    }
  }

  try {
    const backendRes = await fetch(url, fetchOptions);

    // Create response with backend body
    const responseBody = await backendRes.arrayBuffer();
    const response = new NextResponse(responseBody, {
      status: backendRes.status,
      statusText: backendRes.statusText,
    });

    // Forward response headers (skip certain headers)
    const skipHeaders = new Set([
      "content-encoding",
      "transfer-encoding",
      "connection",
      "set-cookie", // Handle separately
    ]);

    backendRes.headers.forEach((value, key) => {
      if (!skipHeaders.has(key.toLowerCase())) {
        response.headers.set(key, value);
      }
    });

    // Forward and REWRITE Set-Cookie headers for first-party
    const setCookies = extractSetCookieHeaders(backendRes);
    console.log(
      `[API Proxy] ${req.method} ${path} -> ${backendRes.status}, cookies: ${setCookies.length}`
    );

    for (const cookie of setCookies) {
      const rewritten = rewriteSetCookie(cookie);
      console.log(`[API Proxy] Set-Cookie: ${rewritten.substring(0, 80)}...`);
      response.headers.append("set-cookie", rewritten);
    }

    return response;
  } catch (error) {
    console.error("API Proxy error:", error);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
