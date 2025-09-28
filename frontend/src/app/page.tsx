import Filters from "@/components/Filters";
import PlaceCard from "@/components/PlaceCard";
import type { Place } from "./lib/types";

/**
 * Fetch SSR verso il BFF interno (/api/places), non direttamente Axum.
 * In questo modo evitiamo CORS e centralizziamo auth/caching lato server.
 */
async function fetchPlaces(params: { q?: string; city?: string; tag?: string }) {
    const searchParams = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
  );
  const qs = searchParams.toString();
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/api/places${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { cache: "no-store" }); // SSR “fresco”
  if (!res.ok) throw new Error("Failed to load places");
  return (await res.json()) as Place[];
}

export default async function Home({
  searchParams
}: {
  searchParams: { q?: string; city?: string; tag?: string };
}) {
  const data = await fetchPlaces(searchParams);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Luoghi</h1>
      <Filters />
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        {data.map((p) => (
          <PlaceCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
