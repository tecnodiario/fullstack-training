import { cookies } from "next/headers";
import { RUST_API_BASE, JWT_COOKIE_NAME } from "@/app/lib/env";

/**
 * Stato utente (facoltativo): se c'è JWT chiediamo ad Axum chi è l'utente.
 * Utile per Navbar o pagine profilo.
 */
export async function GET() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(JWT_COOKIE_NAME)?.value;
  if (!jwt) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }

  const upstream = await fetch(`${RUST_API_BASE}/api/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store"
  });

  if (!upstream.ok) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }

  const user = await upstream.json();
  return new Response(JSON.stringify({ authenticated: true, user }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}
