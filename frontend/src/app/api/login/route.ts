import { cookies } from "next/headers";
import { RUST_API_BASE, JWT_COOKIE_NAME } from "@/app/lib/env";

/**
 * Login Web:
 * 1) riceve credenziali dal form
 * 2) chiama Axum /api/login
 * 3) salva il JWT in cookie HttpOnly
 */
export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(`${RUST_API_BASE}/api/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) return new Response("Unauthorized", { status: 401 });

  // Axum risponde con { token, exp }
  const { token, exp } = await res.json();

  // Cookie HttpOnly: non accessibile da JS lato client → più sicuro
  const cookieStore = await cookies();
  cookieStore.set(JWT_COOKIE_NAME, token,  {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // in prod: true (HTTPS)
    path: "/",
    ...(exp ? { expires: new Date(exp * 1000) } : {})
  });

  return new Response(null, { status: 204 });
}
