import { cookies } from "next/headers";
import { RUST_API_BASE, JWT_COOKIE_NAME } from "@/app/lib/env";

/** Proxy GET place by id */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(JWT_COOKIE_NAME)?.value;
  const upstream = await fetch(`${RUST_API_BASE}/api/places/${params.id}`, {
    headers: { ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
    cache: "no-store"
  });
  return new Response(upstream.body, { status: upstream.status, headers: upstream.headers });
}
