import { NextRequest, NextResponse } from "next/server";

interface CustomRequestCookies {
  "couchers-sesh"?: string;
}

export function middleware(
  req: NextRequest & { cookies: CustomRequestCookies },
) {
  // Redirect to dashboard if user is logged in and visits the root path
  if (req.cookies.get("couchers-sesh")?.value && req.nextUrl.pathname === "/") {
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
