import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const userIdCookie = request.cookies.get("userId");
  const path = request.nextUrl.pathname;

  if (path === "/login" || path === "/signup") {
    if (userIdCookie) {
      return NextResponse.redirect(new URL("/projects", request.url));
    }
    return NextResponse.next();
  }

  if (!userIdCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/events/:path*",
    "/login/:path*",
    "/notifications/:path*",
    "/projects/:path*",
    "/signup/:path*",
  ],
};
