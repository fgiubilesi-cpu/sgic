import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PATHS = ["/dashboard", "/organization"];

export async function middleware(request: NextRequest) {
  const { user, response } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const url = request.nextUrl.clone();

  // Root: redirect in base alla sessione
  if (pathname === "/") {
    url.pathname = user ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  // Pagine protette senza sessione -> login
  if (PROTECTED_PATHS.includes(pathname) && !user) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Utente loggato non deve vedere la pagina di login
  if (pathname === "/login" && user) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/", "/login", "/dashboard", "/organization"],
};

