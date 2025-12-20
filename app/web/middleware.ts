import { NextRequest, NextResponse } from "next/server";

import { sessionCookieName } from "./appConstants";
import { allLanguages } from "./i18n/allLanguages";
import { getBrowserLocaleFromHeader } from "./utils/getBrowserLocaleFromHeader";

function getBestLocale(request: NextRequest): string {
  // Priority 1: NEXT_LOCALE cookie (set by backend or language picker)
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && allLanguages.includes(cookieLocale)) {
    return cookieLocale;
  }

  // Priority 2: Accept-Language header (browser language)
  const acceptLanguage = request.headers.get("accept-language");
  const browserLocale = getBrowserLocaleFromHeader(
    acceptLanguage || undefined,
    allLanguages,
  );
  if (browserLocale) {
    return browserLocale;
  }

  // Priority 3: Default to English
  return "en";
}

export function middleware(request: NextRequest) {
  const { pathname, locale: currentLocale } = request.nextUrl;
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  const isAuthenticated = !!request.cookies.get(sessionCookieName);

  // Determine target locale with the following priority:
  // 1. NEXT_LOCALE cookie (set by backend from ui_language_preference after login, or by client after language change)
  // 2. Current URL locale (if non-default and no cookie exists)
  // 3. Browser Accept-Language header detection (for first-time visitors)
  let targetLocale: string;

  if (cookieLocale && allLanguages.includes(cookieLocale)) {
    targetLocale = cookieLocale;
  } else if (currentLocale !== "en") {
    targetLocale = currentLocale;
  } else {
    targetLocale = getBestLocale(request);
  }

  // Redirect to target locale if it differs from current
  if (currentLocale !== targetLocale) {
    const url = request.nextUrl.clone();
    url.locale = targetLocale;

    // Redirect authenticated users from root to dashboard
    if (isAuthenticated && pathname === "/") {
      url.pathname = "/dashboard";
    }

    const response = NextResponse.redirect(url);
    response.cookies.set("NEXT_LOCALE", targetLocale, {
      path: "/",
      maxAge: 31536000, // 1 year
      sameSite: "lax",
    });
    return response;
  }

  // Rewrite root path to dashboard for authenticated users
  if (isAuthenticated && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.rewrite(url);
  }

  // Sync cookie with current locale if needed
  if (!cookieLocale || cookieLocale !== currentLocale) {
    const response = NextResponse.next();
    response.cookies.set("NEXT_LOCALE", currentLocale, {
      path: "/",
      maxAge: 31536000, // 1 year
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
