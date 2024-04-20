import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  if (req.cookies["couchers-sesh"] && req.nextUrl.pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}
