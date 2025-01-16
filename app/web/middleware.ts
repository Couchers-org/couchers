import { NextRequest, NextResponse } from "next/server";

interface CustomRequestCookies {
  "couchers-sesh"?: string;
}

export function middleware(
  req: NextRequest & { cookies: CustomRequestCookies }
) {
  const cookie = req.cookies.get("couchers-sesh")?.value;

  if (cookie && req.nextUrl.pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}
