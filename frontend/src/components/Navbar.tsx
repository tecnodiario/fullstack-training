import Link from "next/link";
import { cookies } from "next/headers";
import { JWT_COOKIE_NAME } from "@/app/lib/env";

/**
 * Server Component asincrono: legge i cookie HttpOnly sul server.
 * Se c'è il JWT → mostra badge "Loggato", link Profilo e pulsante Logout.
 */
export default async function Navbar() {
  const cookieStore = await cookies();
  const hasJwt = !!cookieStore.get(JWT_COOKIE_NAME);

  return (
    <nav className="border-b">
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
        <Link href="/" className="font-semibold">fullstack-training</Link>
        <div className="flex items-center gap-3">
          {hasJwt ? (
            <>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Loggato
              </span>
              <form action="/api/logout" method="post">
                <button className="text-sm underline">Logout</button>
              </form>
              <Link href="/profilo" className="text-sm">Profilo</Link>
            </>
          ) : (
            <Link href="/login" className="text-sm">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
