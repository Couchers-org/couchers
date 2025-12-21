import { NextRequest, NextResponse } from "next/server";

import { sessionCookieName } from "./appConstants";
import { ALMOST_DONE_CUTOFF } from "./features/translate/constants";
import {
  fetchWeblateStats,
  WeblateLanguage,
} from "./features/weblate/useWeblateStats";
import { allLanguages } from "./i18n/allLanguages";
import { getBrowserLocaleFromHeader } from "./utils/getBrowserLocaleFromHeader";

// In-memory cache for Weblate stats
let statsCache: {
  data: WeblateLanguage[];
  timestamp: number;
} | null = null;

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Get cached Weblate stats or fetch fresh data if cache is stale
 */
async function getCachedWeblateStats(): Promise<WeblateLanguage[]> {
  const now = Date.now();

  // Return cached data if it exists and is still fresh
  if (statsCache && now - statsCache.timestamp < CACHE_TTL) {
    return statsCache.data;
  }

  // Fetch fresh data
  const languages = await fetchWeblateStats();

  // Update cache
  statsCache = {
    data: languages,
    timestamp: now,
  };

  return languages;
}

/**
 * Check if a language is production-ready (>= 80% translated)
 * Uses server-side Weblate stats with caching
 */
async function isLanguageProductionReady(locale: string): Promise<boolean> {
  // English is always production-ready
  if (locale === "en") {
    return true;
  }

  const languages = await getCachedWeblateStats();
  if (!languages.length) {
    // If stats fail to load, only allow English to be safe
    return false;
  }

  // Convert locale format (e.g., "es-419" to "es_419" for Weblate)
  const weblateCode = locale.replace("-", "_");
  const languageStats = languages.find((lang) => lang.code === weblateCode);

  return (
    !!languageStats && languageStats.translated_percent >= ALMOST_DONE_CUTOFF
  );
}

async function getBestLocale(request: NextRequest): Promise<string> {
  // Priority 1: NEXT_LOCALE cookie (set by backend or language picker)
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && allLanguages.includes(cookieLocale)) {
    return cookieLocale;
  }

  // Priority 2: Accept-Language header (browser language)
  // Only use if language is production-ready (>= 80% translated)
  const acceptLanguage = request.headers.get("accept-language");
  const browserLocale = getBrowserLocaleFromHeader(
    acceptLanguage || undefined,
    allLanguages,
  );
  if (browserLocale && (await isLanguageProductionReady(browserLocale))) {
    return browserLocale;
  }

  // Priority 3: Default to English
  return "en";
}

export async function middleware(request: NextRequest) {
  const { pathname, locale: currentLocale } = request.nextUrl;
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  const isAuthenticated = !!request.cookies.get(sessionCookieName);

  // Check if current locale is production-ready (>= 80% translated)
  // If not, redirect to English
  if (!(await isLanguageProductionReady(currentLocale))) {
    const url = request.nextUrl.clone();
    url.locale = "en";

    if (isAuthenticated && pathname === "/") {
      url.pathname = "/dashboard";
    }

    const response = NextResponse.redirect(url);
    response.cookies.set("NEXT_LOCALE", "en", {
      path: "/",
      maxAge: 31536000, // 1 year
      sameSite: "lax",
    });
    return response;
  }

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
    targetLocale = await getBestLocale(request);
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

  // Set cookie if it doesn't exist yet
  if (!cookieLocale) {
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
     * - manifest.json (PWA manifest)
     * - img (static images)
     * - logo files (PWA icons)
     * - robots.txt, sitemap.xml (SEO files)
     * - Files with common static extensions
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|img/|logo.*\\.png|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
  ],
};
