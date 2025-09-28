import type { Place } from "@/app/lib/types";
import Image from "next/image";

/** Fetch SSR del singolo luogo via BFF */
async function fetchPlace(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/places/${id}`, {
    cache: "no-store"
  });
  if (!res.ok) throw new Error("Failed to load place");
  return (await res.json()) as Place;
}

export default async function PlaceDetail({ params }: { params: { id: string } }) {
  const p = await fetchPlace(params.id);
  return (
    <main>
      <Image
        src={p.images?.[0] || "/sample.jpg"}
        alt={p.name}
        width={800}
        height={256}
        className="w-full h-64 object-cover rounded"
        priority
      />
      <h1 className="text-2xl font-bold mt-4">{p.name}</h1>
      <p className="text-gray-700">{p.city}</p>
      <p className="mt-2">{p.description}</p>
      {/* Placeholder mappa: integra Mapbox/Google in seguito */}
      <div className="mt-4 h-80 w-full border rounded flex items-center justify-center">
        <span>MAPPA: lat {p.latitude}, lng {p.longitude}</span>
      </div>
    </main>
  );
}
