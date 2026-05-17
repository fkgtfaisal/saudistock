import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { nextUrl, cookies } = request;

  // Check if any of the standard NextAuth session cookies are present
  const hasAuthjsDev = cookies.has("authjs.session-token");
  const hasAuthjsProd = cookies.has("__Secure-authjs.session-token");
  const hasNextAuthDev = cookies.has("next-auth.session-token");
  const hasNextAuthProd = cookies.has("__Secure-next-auth.session-token");

  const isLoggedIn = hasAuthjsDev || hasAuthjsProd || hasNextAuthDev || hasNextAuthProd;

  // Define public paths that don't require authentication
  const isAuthRoute = nextUrl.pathname === "/login" || nextUrl.pathname === "/register";
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isStaticRoute = 
    nextUrl.pathname.startsWith("/_next") || 
    nextUrl.pathname.endsWith(".ico") || 
    nextUrl.pathname.endsWith(".png") || 
    nextUrl.pathname.endsWith(".jpg") ||
    nextUrl.pathname.endsWith(".svg") ||
    nextUrl.pathname.startsWith("/api/quote") || 
    nextUrl.pathname.startsWith("/api/market");

  // Allow next-auth API routes and static assets always
  if (isApiAuthRoute || isStaticRoute) {
    return NextResponse.next();
  }

  // If user is logged in and trying to access /login or /register, redirect to home
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  // If user is not logged in and trying to access any other page, redirect to login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
}

// Matcher to run middleware on all routes except static assets, images, etc.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
