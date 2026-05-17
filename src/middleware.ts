import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // Define public paths that don't require authentication
  const isAuthRoute = nextUrl.pathname === "/login" || nextUrl.pathname === "/register";
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isStaticRoute = nextUrl.pathname.startsWith("/_next") || nextUrl.pathname.endsWith(".ico") || nextUrl.pathname.endsWith(".png") || nextUrl.pathname.endsWith(".jpg");

  // Allow next-auth API routes and static assets always
  if (isApiAuthRoute || isStaticRoute) {
    return;
  }

  // If user is logged in and trying to access /login or /register, redirect to home
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/", nextUrl));
    }
    return;
  }

  // If user is not logged in and trying to access any other page, redirect to login
  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }
});

// Matcher to run middleware on all routes except static assets, images, etc.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
