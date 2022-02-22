import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  if (req.cookies["couchers-sesh"] && req.nextUrl.pathname === "/") {
    return NextResponse.rewrite("/dashboard");
  }
  return NextResponse.next();
}
