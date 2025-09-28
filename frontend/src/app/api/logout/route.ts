import { cookies } from "next/headers";
import { JWT_COOKIE_NAME } from "@/app/lib/env";

/** Logout: rimuove il cookie JWT */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(JWT_COOKIE_NAME);
  return new Response(null, { status: 204 });
}
