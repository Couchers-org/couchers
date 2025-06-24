import { NextRequest, NextResponse } from "next/server";

interface CustomRequestCookies {
  "couchers-sesh"?: string;
  NEXT_LOCALE?: string;
}

export function middleware(
  req: NextRequest & { cookies: CustomRequestCookies },
) {
  const { pathname } = req.nextUrl;
  const couchersSesh = req.cookies.get("couchers-sesh")?.value;

  // Redirect root "/" to dashboard if logged in ---
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
