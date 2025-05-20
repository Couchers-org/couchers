import { NextRequest, NextResponse } from "next/server";
import { allLanguages } from "i18n/allLanguages";

interface CustomRequestCookies {
  "couchers-sesh"?: string;
  // add couchers-preferred-language?
  "couchers-preferred-language"?: string;
}

export function middleware(
  req: NextRequest & { cookies: CustomRequestCookies },
) {
  // session
  const seshCookie = req.cookies.get("couchers-sesh")?.value;

  // language preference
  const langCookie =
    req.cookies.get("couchers-preferred-language")?.value || "en"; // default to English if not specified
  const locale = allLanguages.includes(langCookie) ? langCookie : "en"; // default ot English if language code not supported?
  const pathname = req.nextUrl.pathname;

  // Redirect to dashboard (and set language) if user is logged in and visits the root path
  // if (req.cookies.get("couchers-sesh")?.value && req.nextUrl.pathname === "/") {
  //   const url = req.nextUrl.clone();
  //   url.pathname = "/dashboard";
  //   return NextResponse.rewrite(url);
  // }

  if (
    req.cookies.get("couchers-sesh")?.value &&
    req.cookies.get("couchers-preferred-language")?.value
  ) {
    // if user is logged in, check for language pref
    // Skip if already has a locale prefix (e.g., /de, /en)
    const pathnameIsMissingLocale = allLanguages.every(
      (lang) => !pathname.startsWith(`/${lang}`),
    );

    // construct a url so the locale(?) matches the language preference
    if (pathnameIsMissingLocale) {
      const newUrl = req.nextUrl.clone();
      newUrl.pathname = `/${locale}${pathname}`; // manually insert the locale
      return NextResponse.rewrite(newUrl);
    }
    return NextResponse.next();
  }
}

// Add matcher to apply the middleware to the root path
export const config = {
  matcher: ["/", "/dashboard"], // Only apply to these paths
};
