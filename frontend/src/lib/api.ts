// Use /api proxy in production (empty NEXT_PUBLIC_API_URL), or direct URL for local dev
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

function requireApiBase() {
  return API_BASE;
}

// uses sessionStorage
function getAccessToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("access_token");
}
function setAccessToken(token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("access_token", token);
}
function clearAccessToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("access_token");
}

function parseErrorText(text: string) {
  try {
    const j = JSON.parse(text);
    return j.detail || j.message || text;
  } catch {
    return text;
  }
}

export async function refreshAccessToken(): Promise<string> {
  const base = requireApiBase();

  const res = await fetch(`${base}/auth/refresh`, {
    method: "POST",
    credentials: "include", // ✅ sends refresh cookie
  });

  const text = await res.text();
  if (!res.ok) throw new Error(parseErrorText(text));

  const data = JSON.parse(text) as { access_token: string };
  setAccessToken(data.access_token);
  return data.access_token;
}

type ApiFetchOptions = RequestInit & {
  retry?: boolean;
  /** if endpoint doesn t return  JSON (ex: download), set json=false */
  json?: boolean;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const base = requireApiBase();

  const token = getAccessToken();
  const headers = new Headers(options.headers);

  // Content-Type only if  FormData is not set
  const isForm = options.body instanceof FormData;
  if (!headers.has("Content-Type") && !isForm) {
    headers.set("Content-Type", "application/json");
  }

  // Authorization header (optional)
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers,
    credentials: "include", // ✅ cookies (access+refresh)
  });

  // 401 -> try refresh one time
  if (res.status === 401 && options.retry !== false) {
    await refreshAccessToken();
    return apiFetch<T>(path, { ...options, retry: false });
  }

  // 204 no content
  if (res.status === 204) return undefined as T;

  // errors
  const text = await res.text();
  if (!res.ok) throw new Error(parseErrorText(text));

  // json vs non-json
  if (options.json === false) return text as unknown as T;
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export function clientLogoutLocal() {
  clearAccessToken();
}
