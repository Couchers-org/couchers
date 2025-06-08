import { NextRequest, NextResponse } from "next/server";

interface CustomRequestCookies {
  "couchers-sesh"?: string;
  NEXT_LOCALE?: string;
}

export function middleware(
  req: NextRequest & { cookies: CustomRequestCookies },
) {
  const { pathname, locale } = req.nextUrl;

  const couchersSesh = req.cookies.get("couchers-sesh")?.value;
  const nextLocale = req.cookies.get("NEXT_LOCALE")?.value || "en";
  const langChanged = req.nextUrl.searchParams.has("lang-changed");

  // --- 1. User just changed language manually -> honor cookie and redirect ---
  if (langChanged && nextLocale !== locale) {
    const url = req.nextUrl.clone();
    url.locale = nextLocale;
    url.searchParams.delete("lang-changed");
    return NextResponse.redirect(url);
  }

  // --- 2. Redirect / to /dashboard if logged in ---
  if (couchersSesh && pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

// Add matcher to apply the middleware to the root path
export const config = {
  matcher: ["/"], // Only apply to these paths
};
