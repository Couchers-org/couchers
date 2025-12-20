import { NextRequest, NextResponse } from "next/server";

import { sessionCookieName } from "./appConstants";
import { allLanguages } from "./i18n/allLanguages";

function getBestLocale(request: NextRequest): string {
  // Priority 1: NEXT_LOCALE cookie (set by backend or language picker)
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && allLanguages.includes(cookieLocale)) {
    return cookieLocale;
  }

  // Priority 2: Accept-Language header (browser language)
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(",")
      .map((lang) => {
        const [code, q = "1"] = lang.trim().split(";q=");
        return { code: code.split("-")[0], quality: parseFloat(q) };
      })
      .sort((a, b) => b.quality - a.quality);

    for (const lang of languages) {
      const match = allLanguages.find((supported) =>
        supported.startsWith(lang.code),
      );
      if (match) return match;
    }
  }

  // Priority 3: Default to English
  return "en";
}

export function middleware(request: NextRequest) {
  const { pathname, locale: currentLocale } = request.nextUrl;
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  const isAuthenticated = !!request.cookies.get(sessionCookieName);

  console.log(
    `[MIDDLEWARE] pathname: ${pathname}, currentLocale: ${currentLocale}, cookieLocale: ${cookieLocale}, isAuthenticated: ${isAuthenticated}`,
  );

  // Determine target locale based on context:
  // 1. If user explicitly navigated to a non-default locale (via language picker or direct URL), respect it
  // 2. If current locale is default (en) and cookie exists, use cookie
  // 3. Otherwise detect from browser
  let targetLocale: string;

  if (currentLocale !== "en" && !cookieLocale) {
    // User navigated to a non-default locale without a cookie (e.g., via language picker)
    targetLocale = currentLocale;
    console.log(
      `[MIDDLEWARE] Using explicit navigation locale: ${targetLocale}`,
    );
  } else if (cookieLocale && allLanguages.includes(cookieLocale)) {
    // Cookie exists - use it (but only if we're on default locale or cookie matches)
    if (currentLocale === "en" || currentLocale === cookieLocale) {
      targetLocale = cookieLocale;
      console.log(`[MIDDLEWARE] Using cookie locale: ${targetLocale}`);
    } else {
      // User explicitly navigated to a different locale - respect it and update cookie
      targetLocale = currentLocale;
      console.log(
        `[MIDDLEWARE] Respecting explicit navigation to: ${targetLocale} (overriding cookie: ${cookieLocale})`,
      );
    }
  } else {
    // No cookie - detect from browser
    targetLocale = getBestLocale(request);
    console.log(`[MIDDLEWARE] Detecting locale: ${targetLocale}`);
  }

  // If Next.js's current locale doesn't match our target, redirect
  if (currentLocale !== targetLocale) {
    console.log(
      `[MIDDLEWARE] Redirecting from ${currentLocale} to ${targetLocale}`,
    );
    const url = request.nextUrl.clone();
    url.locale = targetLocale;

    // If authenticated and on root, redirect to dashboard
    if (isAuthenticated && pathname === "/") {
      url.pathname = "/dashboard";
    }

    const response = NextResponse.redirect(url);
    response.cookies.set("NEXT_LOCALE", targetLocale, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return response;
  }

  // Locale matches - handle dashboard rewrite for authenticated users on root
  if (isAuthenticated && pathname === "/") {
    console.log(
      `[MIDDLEWARE] Rewriting / to /dashboard for authenticated user`,
    );
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.rewrite(url);
  }

  // Locale matches - ensure cookie is set
  if (!cookieLocale || cookieLocale !== currentLocale) {
    console.log(`[MIDDLEWARE] Syncing cookie to: ${currentLocale}`);
    const response = NextResponse.next();
    response.cookies.set("NEXT_LOCALE", currentLocale, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
