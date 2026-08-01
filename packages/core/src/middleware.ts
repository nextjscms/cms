import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

export const { auth } = NextAuth(authConfig)

export default auth((req) => {
  // For the MVP, we determine if the CMS is installed based on the presence of a database connection string.
  const isInstalled = !!process.env.DATABASE_URL;
  const isSetupRoute = req.nextUrl.pathname.startsWith('/setup');

  // If not installed and the user is NOT on the setup route, redirect them to /setup
  if (!isInstalled && !isSetupRoute) {
    return NextResponse.redirect(new URL('/setup', req.url));
  }

  // If already installed and trying to access /setup, redirect to /admin
  if (isInstalled && isSetupRoute) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  // Admin route protection
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  const isLoginRoute = req.nextUrl.pathname.startsWith('/admin/login');
  
  if (isAdminRoute && !isLoginRoute && isInstalled) {
    const isLoggedIn = !!req.auth;
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }
  
  if (isLoginRoute && !!req.auth) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  return NextResponse.next();
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
