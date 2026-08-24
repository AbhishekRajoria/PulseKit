import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("session");

  if (request.nextUrl.pathname == "/login" && sessionCookie) {
    return NextResponse.redirect(new URL("/events", request.url));
  }

  if (!sessionCookie && request.nextUrl.pathname != "/login")
    return NextResponse.redirect(new URL("/login", request.url));

  return NextResponse.next();
}

export const config = { matcher: ["/events/:path*", "/login/:path*"] };
