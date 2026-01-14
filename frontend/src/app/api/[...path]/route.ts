import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL || "https://acont-production.up.railway.app";

export async function handler(req: NextRequest) {
  const path = req.nextUrl.pathname.replace(/^\/api/, "");
  const url = `${BACKEND_URL}${path}${req.nextUrl.search}`;

  const headers = new Headers();

  // Forward relevant headers
  const forwardHeaders = ["content-type", "accept", "authorization", "cookie"];

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
    credentials: "include",
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

    // Forward response headers
    const skipHeaders = new Set([
      "content-encoding",
      "transfer-encoding",
      "connection",
    ]);
    backendRes.headers.forEach((value, key) => {
      if (!skipHeaders.has(key.toLowerCase())) {
        response.headers.set(key, value);
      }
    });

    // Forward Set-Cookie headers (important!)
    const setCookies = backendRes.headers.getSetCookie?.() || [];
    for (const cookie of setCookies) {
      response.headers.append("set-cookie", cookie);
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
