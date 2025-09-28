import { cookies } from "next/headers";
import { RUST_API_BASE, JWT_COOKIE_NAME } from "@/app/lib/env";

/**
 * Proxy GET list places: legge eventuale cookie JWT (HttpOnly) e
 * lo inoltra come Authorization verso Axum. Niente CORS lato browser.
 */
export async function GET(req: Request) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(JWT_COOKIE_NAME)?.value;
  const url = new URL(req.url);
  const qs = url.search;
  const upstream = await fetch(`${RUST_API_BASE}/api/places${qs}`, {
    headers: { ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
    cache: "no-store"
  });
  // Restituiamo direttamente lo stream della response upstream
  return new Response(upstream.body, { status: upstream.status, headers: upstream.headers });
}
