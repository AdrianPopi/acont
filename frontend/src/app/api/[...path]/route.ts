import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL || "https://acont-production.up.railway.app";

/**
 * Parse a Set-Cookie header string into its components
 */
function parseCookie(cookieStr: string): {
  name: string;
  value: string;
  options: Record<string, string | boolean | number>;
} | null {
  const parts = cookieStr.split(";").map((p) => p.trim());
  if (parts.length === 0) return null;

  const [nameValue, ...attrs] = parts;
  const eqIndex = nameValue.indexOf("=");
  if (eqIndex === -1) return null;

  const name = nameValue.substring(0, eqIndex);
  const value = nameValue.substring(eqIndex + 1);

  const options: Record<string, string | boolean | number> = {};

  for (const attr of attrs) {
    const attrEq = attr.indexOf("=");
    if (attrEq === -1) {
      // Boolean attribute like HttpOnly, Secure
      const key = attr.toLowerCase();
      if (key === "httponly") options.httpOnly = true;
      else if (key === "secure") options.secure = true;
    } else {
      const key = attr.substring(0, attrEq).toLowerCase();
      const val = attr.substring(attrEq + 1);

      if (key === "max-age") options.maxAge = parseInt(val, 10);
      else if (key === "path") options.path = val;
      else if (key === "samesite") {
        // Force Lax for first-party
        options.sameSite = "lax";
      }
      // Skip Domain - we want it to default to current domain
    }
  }

  // Default to Lax if not set
  if (!options.sameSite) options.sameSite = "lax";

  return { name, value, options };
}

/**
 * Extract all Set-Cookie headers from a Response.
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

  // Method 2: Fallback - get raw header
  if (cookies.length === 0) {
    const raw = res.headers.get("set-cookie");
    if (raw) {
      // Split carefully - cookies can contain commas in dates
      const parts = raw.split(/,(?=\s*[a-zA-Z_][a-zA-Z0-9_]*=)/);
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
      "set-cookie",
    ]);

    backendRes.headers.forEach((value, key) => {
      if (!skipHeaders.has(key.toLowerCase())) {
        response.headers.set(key, value);
      }
    });

    // Extract and set cookies using Next.js cookies API
    const setCookies = extractSetCookieHeaders(backendRes);
    console.log(
      `[Proxy] ${req.method} ${path} -> ${backendRes.status}, found ${setCookies.length} cookies`
    );

    for (const cookieStr of setCookies) {
      const parsed = parseCookie(cookieStr);
      if (parsed) {
        console.log(`[Proxy] Setting cookie: ${parsed.name}`);
        response.cookies.set(parsed.name, parsed.value, {
          path: (parsed.options.path as string) || "/",
          httpOnly: parsed.options.httpOnly as boolean,
          secure: parsed.options.secure as boolean,
          sameSite:
            (parsed.options.sameSite as "lax" | "strict" | "none") || "lax",
          maxAge: parsed.options.maxAge as number | undefined,
        });
      }
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
