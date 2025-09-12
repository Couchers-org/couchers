import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "./appConstants";
import { allLanguages } from "./i18n/allLanguages";

const getBrowserLocale = (
  acceptLanguage: string | undefined,
): string | undefined => {
  if (!acceptLanguage) return undefined;

  // Parse Accept-Language header
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, quality = "1"] = lang.trim().split(";q=");
      return { code: code.split("-")[0], quality: parseFloat(quality) };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find the first supported language
  for (const lang of languages) {
    const supportedLang = allLanguages.find((supported) =>
      supported.startsWith(lang.code),
    );
    if (supportedLang) {
      return supportedLang;
    }
  }

  return undefined;
};

export const middleware = (request: NextRequest) => {
  if (
    request.cookies.get(SESSION_COOKIE_NAME) &&
    request.nextUrl.pathname === "/"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.rewrite(url);
  }

  const response = NextResponse.next();

  // Check if NEXT_LOCALE cookie exists and is valid
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;

  // Only set cookie if it doesn't exist OR if it exists but is not a valid language
  if (!cookieLocale || !allLanguages.includes(cookieLocale)) {
    // No valid cookie exists, detect browser language and set cookie
    const browserLocale = getBrowserLocale(
      request.headers.get("accept-language") || undefined,
    );
    const detectedLocale =
      browserLocale && allLanguages.includes(browserLocale)
        ? browserLocale
        : "en";

    // Set the NEXT_LOCALE cookie
    response.cookies.set("NEXT_LOCALE", detectedLocale, {
      path: "/",
      maxAge: 31536000, // 1 year
      sameSite: "lax",
    });
  }

  return response;
};

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
