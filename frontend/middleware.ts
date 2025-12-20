import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { jwtVerify } from "jose";
import { locales, defaultLocale } from "./src/i18n/routing";

const intlMiddleware = createIntlMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
});

const ACCESS_COOKIE = "acont_access";

function getLocaleFromPath(pathname: string) {
  const seg = pathname.split("/")[1];
  return (locales as readonly string[]).includes(seg) ? seg : defaultLocale;
}

function isProtected(pathname: string) {
  return (
    pathname.includes("/dashboard/merchant") || pathname.includes("/admin")
  );
}

async function getRoleFromJwt(token: string): Promise<string | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "");
    const issuer = process.env.JWT_ISSUER;

    const { payload } = await jwtVerify(
      token,
      secret,
      issuer ? { issuer } : undefined
    );

    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

function roleHome(role: string, locale: string) {
  if (role === "merchant_admin") return `/${locale}/dashboard/merchant`;
  if (role === "platform_admin") return `/${locale}/admin`;
  return `/${locale}/auth/login`;
}

export default async function middleware(req: NextRequest) {
  // 1) next-intl middleware (păstrează locale routing)
  const intlRes = intlMiddleware(req);

  const { pathname } = req.nextUrl;
  const locale = getLocaleFromPath(pathname);

  // 2) public pages:
  if (!isProtected(pathname)) return intlRes;

  // 3) guard pe cookie access
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/auth/login`;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const role = await getRoleFromJwt(token);
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/auth/login`;
    return NextResponse.redirect(url);
  }

  // 4) enforce role paths
  if (pathname.includes("/dashboard/merchant") && role !== "merchant_admin") {
    const url = req.nextUrl.clone();
    url.pathname = roleHome(role, locale);
    return NextResponse.redirect(url);
  }

  if (pathname.includes("/admin") && role !== "platform_admin") {
    const url = req.nextUrl.clone();
    url.pathname = roleHome(role, locale);
    return NextResponse.redirect(url);
  }

  return intlRes;
}

export const config = {
  // (safe)
  matcher: ["/", "/(ro|en|fr|nl)/:path*"],
};
