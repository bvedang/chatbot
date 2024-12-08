import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/sign-up(.*)",
  "/forgot-password(.*)",
  "/sign-in(.*)",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/error",
  "/favicon.ico",
  "/api/public/(.*)",
];

// Create a route matcher with proper typing
const isPublicRoute = createRouteMatcher(PUBLIC_ROUTES);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const url = new URL(request.url);
  if (isPublicRoute(request)) {
    // Optional: Redirect logged-in users away from auth pages
    if (userId && ["/sign-up", "/sign-in"].includes(url.pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }
  if (!userId) {
    // Store the attempted URL to redirect back after login
    const callbackUrl = encodeURIComponent(url.pathname + url.search);
    return NextResponse.redirect(
      new URL(`/sign-in?redirect_url=${callbackUrl}`, request.url)
    );
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
