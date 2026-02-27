import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { user, response } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const url = request.nextUrl.clone();

  // Root: redirect based on session state
  if (pathname === "/") {
    url.pathname = user ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  // All dashboard routes require authentication
  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/audits") ||
    pathname.startsWith("/templates") ||
    pathname.startsWith("/organization") ||
    pathname.startsWith("/impostazioni");

  if (isDashboardRoute && !user) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated users should not see the login page
  if (pathname === "/login" && user) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
