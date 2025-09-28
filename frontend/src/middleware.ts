import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware: protegge /profilo.
 * Se manca il cookie JWT → redirect a /login?redirect=/profilo
 * Nota: qui controlliamo solo la PRESENZA del cookie, non la validità del token.
 * In produzione valuta una validazione più robusta lato BFF o un check /api/me nel server component.
 */
export function middleware(req: NextRequest) {
  const cookie =
    req.cookies.get(process.env.JWT_COOKIE_NAME || "ggf_session");
  const isAuthed = !!cookie?.value;

  if (req.nextUrl.pathname.startsWith("/profilo") && !isAuthed) {
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profilo"]
};
