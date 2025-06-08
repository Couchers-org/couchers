import { allLanguages } from "i18n/allLanguages";
import { NextRequest, NextResponse } from "next/server";

interface CustomRequestCookies {
  "couchers-sesh"?: string;
  "couchers-preferred-language"?: string;
}

export function middleware(
  req: NextRequest & { cookies: CustomRequestCookies },
) {
  //getAll cookies
  console.log(
    "Middleware running fo route:",
    req.nextUrl.pathname,
    "COOKIES:",
    req.cookies.getAll(),
  );
  // Cookies are undefined on localhost - needs to be https to work
  const couchersSesh = req.cookies.get("couchers-sesh")?.value;
  const couchersPreferredLanguage = req.cookies.get(
    "couchers-preferred-language",
  )?.value;
  const currentLocale = req.nextUrl.locale;

  // Only run logic if user is logged in and has a preferred language cookie
  if (
    couchersSesh &&
    couchersPreferredLanguage &&
    couchersPreferredLanguage !== currentLocale
  ) {
    // Check if the preferred language is valid
    if (!allLanguages.includes(couchersPreferredLanguage)) {
      console.error(
        `Invalid preferred language cookie: ${couchersPreferredLanguage}. `,
      );

      return NextResponse.next();
    }

    const url = req.nextUrl.clone();
    url.locale = couchersPreferredLanguage;

    return NextResponse.redirect(url);
  }

  // Example: redirect / to /dashboard if logged in
  if (couchersSesh && req.nextUrl.pathname === "/") {
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
