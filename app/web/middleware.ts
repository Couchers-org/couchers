import { NextRequest, NextResponse } from "next/server";

interface CustomRequestCookies {
  "couchers-sesh"?: string;
  "couchers-preferred-language"?: string;
}

export function middleware(
  req: NextRequest & { cookies: CustomRequestCookies },
) {
  // Cookies are undefined on localhost - needs to be https to work
  const couchersSesh = req.cookies.get("couchers-sesh")?.value;

  // Redirect / to /dashboard if logged in
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
