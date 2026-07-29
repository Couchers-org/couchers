import { lookupAcceptLanguage } from "i18n/acceptLanguage";
import { allLanguages } from "i18n/allLanguages";
import { NextRequest, NextResponse } from "next/server";

import { sessionCookieName } from "./appConstants";
import { ALMOST_DONE_CUTOFF } from "./features/translate/constants";
import {
  fetchWeblateStats,
  WeblateLanguage,
} from "./features/weblate/useWeblateStats";

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
 * Get the list of locale codes that are production-ready (>= 80% translated)
 * Uses server-side Weblate stats with caching
 */
async function getProductionReadyLocales(): Promise<string[]> {
  const languages = await getCachedWeblateStats();

  // Convert locale format (e.g., "es_419" to "es-419" to match allLanguages)
  const productionReadyLocales = languages
    .filter((lang) => lang.translated_percent >= ALMOST_DONE_CUTOFF)
    .map((lang) => lang.code.replace("_", "-"));

  // English is always production-ready
  return allLanguages.filter(
    (locale) => locale === "en" || productionReadyLocales.includes(locale),
  );
}

/**
 * Check if a locale is production-ready (>= 80% translated)
 * Uses server-side Weblate stats with caching
 */
async function isLanguageProductionReady(locale: string): Promise<boolean> {
  const productionReadyLocales = await getProductionReadyLocales();
  return productionReadyLocales.includes(locale);
}

/**
 * Determine if a locale should be blocked based on translation completeness.
 *
 * @param currentLocale - The locale from the URL
 * @param cookieLocale - The NEXT_LOCALE cookie value (undefined if not set)
 * @param isProductionReady - Whether the current locale is >= 80% translated
 * @returns true if the locale should be blocked (redirect to English)
 */
export function shouldBlockIncompleteLanguage(
  currentLocale: string,
  cookieLocale: string | undefined,
  isProductionReady: boolean,
): boolean {
  if (currentLocale === "en") {
    return false;
  }

  if (cookieLocale) {
    return false; // User explicitly selected this language
  }

  return !isProductionReady; // Browser detection: only allow >= 80%
}

/** Detects the user's preferred locale from the Accept-Language header */
export function getBrowserLocaleFromHeader(
  acceptLanguage: string | undefined,
  supportedLocales: string[],
): string | undefined {
  if (!acceptLanguage) return undefined;

  return lookupAcceptLanguage(acceptLanguage, supportedLocales);
}

async function getBestLocale(request: NextRequest): Promise<string> {
  // Priority 1: NEXT_LOCALE cookie (set by backend or language picker)
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && allLanguages.includes(cookieLocale)) {
    return cookieLocale;
  }

  // Priority 2: Accept-Language header (browser language)
  // Only consider languages that are production-ready (>= 80% translated),
  // falling through to the next preferred language in the header otherwise
  const acceptLanguage = request.headers.get("accept-language");
  const productionReadyCodes = await getProductionReadyLocales();
  return (
    getBrowserLocaleFromHeader(
      acceptLanguage || undefined,
      productionReadyCodes,
    ) || "en"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, locale: currentLocale } = request.nextUrl;
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  const isAuthenticated = !!request.cookies.get(sessionCookieName);

  // Skip locale redirect if this is a client-side navigation
  // The Next.js router handles locale changes client-side
  const isClientNavigation = request.headers.get("x-nextjs-data");

  // Check if current locale should be blocked
  const isProductionReady = await isLanguageProductionReady(currentLocale);
  const shouldBlock = shouldBlockIncompleteLanguage(
    currentLocale,
    cookieLocale,
    isProductionReady,
  );

  if (shouldBlock) {
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

  // Determine target locale: cookie > URL locale > browser detection
  let targetLocale: string;

  if (cookieLocale && allLanguages.includes(cookieLocale)) {
    targetLocale = cookieLocale;
  } else if (currentLocale !== "en") {
    targetLocale = currentLocale;
  } else {
    targetLocale = await getBestLocale(request);
  }

  // Redirect to target locale if it differs from current
  // BUT only on initial page loads, not during client-side navigations
  if (currentLocale !== targetLocale && !isClientNavigation) {
    const url = request.nextUrl.clone();
    url.locale = targetLocale;

    // Redirect authenticated users from root to dashboard
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
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|img/|logo.*\\.png|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|json)$).*)",
  ],
};
