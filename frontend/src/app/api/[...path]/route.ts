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
    }
  }

  if (!options.sameSite) options.sameSite = "lax";
  return { name, value, options };
}

/**
 * Extract all Set-Cookie headers from a Response.
 */
function extractSetCookieHeaders(res: Response): string[] {
  const cookies: string[] = [];

  // Method 1: getSetCookie() (Node 18+)
  type HeadersWithGetSetCookie = Headers & { getSetCookie?: () => string[] };
  const headersWithGetSetCookie = res.headers as HeadersWithGetSetCookie;
  if (typeof headersWithGetSetCookie.getSetCookie === "function") {
    const fromMethod = headersWithGetSetCookie.getSetCookie();
    if (fromMethod && fromMethod.length > 0) cookies.push(...fromMethod);
  }

  // Method 2: raw header fallback
  if (cookies.length === 0) {
    const raw = res.headers.get("set-cookie");
    if (raw) {
      const parts = raw.split(/,(?=\s*[a-zA-Z_][a-zA-Z0-9_]*=)/);
      cookies.push(...parts.map((c) => c.trim()));
    }
  }

  return cookies;
}

async function fetchWithManualRedirect(
  initialUrl: string,
  initialOptions: RequestInit,
  req: NextRequest
) {
  const url = initialUrl;
  let res = await fetch(url, initialOptions);

  // Follow up to a few redirects to be safe (avoid loops)
  for (let i = 0; i < 5; i++) {
    const status = res.status;
    const isRedirect = [301, 302, 303, 307, 308].includes(status);
    if (!isRedirect) break;

    const location = res.headers.get("location");
    if (!location) break;

    const target = location.startsWith("http")
      ? location
      : `${BACKEND_URL}${location}`;

    // 301/302/303: only follow automatically for GET/HEAD
    if ([301, 302, 303].includes(status)) {
      if (req.method !== "GET" && req.method !== "HEAD") break;

      res = await fetch(target, {
        method: req.method,
        headers: initialOptions.headers,
        redirect: "manual",
      });
      continue;
    }

    // 307/308: repeat same method + body
    res = await fetch(target, {
      method: req.method,
      headers: initialOptions.headers,
      redirect: "manual",
      body: (initialOptions as { body?: BodyInit | null }).body,
    });
  }

  return res;
}

export async function handler(req: NextRequest) {
  const path = req.nextUrl.pathname.replace(/^\/api/, "");
  const url = `${BACKEND_URL}${path}${req.nextUrl.search}`;

  const headers = new Headers();

  // Forward minimal headers
  const forwardHeaders = ["content-type", "accept"];
  for (const name of forwardHeaders) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }

  // Help backend avoid proto/host redirects (optional but useful)
  headers.set("x-forwarded-proto", "https");
  const host = req.headers.get("host");
  if (host) headers.set("x-forwarded-host", host);

  // Forward cookies + auth
  const cookieHeader = req.headers.get("cookie");
  let accessToken: string | null = null;
  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
    const match = cookieHeader.match(/acont_access=([^;]+)/);
    if (match) accessToken = match[1];
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader) headers.set("authorization", authHeader);
  else if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

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
    const backendRes = await fetchWithManualRedirect(url, fetchOptions, req);

    const responseBody = await backendRes.arrayBuffer();
    const response = new NextResponse(responseBody, {
      status: backendRes.status,
      statusText: backendRes.statusText,
    });

    // Preserve content-type
    const ct = backendRes.headers.get("content-type");
    if (ct) response.headers.set("content-type", ct);

    // Forward Set-Cookie as first-party
    const setCookies = extractSetCookieHeaders(backendRes);
    for (const cookieStr of setCookies) {
      const parsed = parseCookie(cookieStr);
      if (parsed) {
        response.cookies.set(parsed.name, parsed.value, {
          path: (parsed.options.path as string) || "/",
          httpOnly: Boolean(parsed.options.httpOnly),
          secure: Boolean(parsed.options.secure),
          sameSite:
            (parsed.options.sameSite as "lax" | "strict" | "none") || "lax",
          maxAge: parsed.options.maxAge as number | undefined,
        });
      } else {
        response.headers.append("set-cookie", cookieStr);
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
