import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isProtected =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/forms/create") ||
    nextUrl.pathname.includes("/edit") ||
    nextUrl.pathname.includes("/analytics") ||
    nextUrl.pathname.includes("/profile") ||
    nextUrl.pathname.includes("/settings") ||
    nextUrl.pathname.includes("/responses");

  if (isProtected && !isLoggedIn) {
    const signInUrl = new URL("/auth/signin", nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return Response.redirect(signInUrl);
  }

  return undefined; // allow request to proceed
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};