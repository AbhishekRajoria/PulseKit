import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const userIdCookie = request.cookies.get("userId");

  if (request.nextUrl.pathname == "/login" && userIdCookie) {
    return NextResponse.redirect(new URL("/projects", request.url));
  }

  if (!userIdCookie && request.nextUrl.pathname != "/login")
    return NextResponse.redirect(new URL("/login", request.url));

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/events/:path*",
    "/login/:path*",
    "/notifications/:path*",
    "/projects/:path*",
  ],
};
