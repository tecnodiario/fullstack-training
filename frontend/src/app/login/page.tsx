"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Pagina Login minimale:
 * invia email/password a /api/login che salva il JWT in cookie HttpOnly,
 * poi redireziona a /profilo (o al redirect param).
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const r = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      const sp = new URLSearchParams(window.location.search);
      const redirect = sp.get("redirect") || "/profilo";
      r.push(redirect);
      r.refresh();
    } else {
      setError("Credenziali non valide");
    }
  }

  return (
    <main className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="border p-2 rounded w-full"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border p-2 rounded w-full"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="px-4 py-2 bg-black text-white rounded w-full">
          Entra
        </button>
      </form>
    </main>
  );
}
