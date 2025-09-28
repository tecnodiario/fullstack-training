"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

/**
 * Client component: controlli filtro. Aggiorna la querystring, poi SSR ricarica.
 */
export default function Filters() {
  const r = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [city, setCity] = useState(sp.get("city") ?? "");
  const [tag, setTag] = useState(sp.get("tag") ?? "");

  const apply = () => {
    const p = new URLSearchParams({
      ...(q && { q }),
      ...(city && { city }),
      ...(tag && { tag })
    });
    r.push(`/?${p.toString()}`);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <input
        className="border p-2 rounded w-60"
        placeholder="Cerca..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <input
        className="border p-2 rounded w-48"
        placeholder="Città"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />
      <input
        className="border p-2 rounded w-48"
        placeholder="Tag (es. pizza)"
        value={tag}
        onChange={(e) => setTag(e.target.value)}
      />
      <button onClick={apply} className="px-4 py-2 bg-black text-white rounded">
        Filtra
      </button>
    </div>
  );
}
