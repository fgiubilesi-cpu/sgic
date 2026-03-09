import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";

export async function middleware(request: NextRequest) {
  try {
    const { user, response } = await updateSession(request);
    const { pathname } = request.nextUrl;

    const url = request.nextUrl.clone();

    // Root: redirect based on session state and role
    if (pathname === "/") {
      if (!user) {
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }

      // Check user's role to redirect to appropriate dashboard
      const ctx = await getOrganizationContext();
      if (ctx?.role === "client") {
        url.pathname = "/client-dashboard";
        return NextResponse.redirect(url);
      }

      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // All dashboard routes require authentication
    const isDashboardRoute =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/client-dashboard") ||
      pathname.startsWith("/audits") ||
      pathname.startsWith("/clients") ||
      pathname.startsWith("/templates") ||
      pathname.startsWith("/organization") ||
      pathname.startsWith("/settings") ||
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
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/error", request.url));
  }
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
