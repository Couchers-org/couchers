import { NextRequest, NextResponse } from "next/server";

interface CustomRequestCookies {
  "couchers-sesh"?: string;
  NEXT_LOCALE?: string;
}

export function middleware(
  req: NextRequest & { cookies: CustomRequestCookies },
) {
  const { pathname, locale } = req.nextUrl;

  // Cookies are undefined on localhost - needs to be https to work
  const couchersSesh = req.cookies.get("couchers-sesh")?.value;
  const nextLocale = req.cookies.get("NEXT_LOCALE")?.value || "en";
  const langChanged = req.nextUrl.searchParams.has("lang-changed");

  const isApiRoute = pathname.startsWith("/api");
  const isStaticAsset = pathname.startsWith("/_next");

  console.log("NEXT_LOCALE:", nextLocale);
  console.log(
    "LOCALE:",
    locale,
    "nextLocale !== locale",
    nextLocale !== locale,
  );
  console.log("LANG CHANGED:", langChanged);
  // 1. Skip redirect if user just changed locale via picker
  if (langChanged) {
    const url = req.nextUrl.clone();
    url.searchParams.delete("lang-changed");
    return NextResponse.redirect(url);
  }

  // 2. Redirect to preferred locale if it differs from the current URL
  if (nextLocale && nextLocale !== locale && !isApiRoute && !isStaticAsset) {
    const url = req.nextUrl.clone();
    url.locale = nextLocale;
    return NextResponse.redirect(url);
  }

  // 3. Redirect / to /dashboard if logged in
  if (couchersSesh && pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

// Add matcher to apply the middleware to the root path
export const config = {
  matcher: ["/", "/dashboard"], // Only apply to these paths
};
