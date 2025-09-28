import Link from "next/link";
import Image from "next/image";
import type { Place } from "@/app/lib/types";

/** Card semplice con immagine, città e tag */
export default function PlaceCard({ p }: { p: Place }) {
  return (
    <Link
      href={`/places/${p.id}`}
      className="block border rounded-xl p-4 hover:shadow-md transition"
    >
        <Image
          src={p.images?.[0] || "/sample.jpg"}
          alt={p.name}
          width={96}
          height={96}
          className="w-24 h-24 object-cover rounded"
        />
        <div>
          <h3 className="text-lg font-semibold">{p.name}</h3>
          <p className="text-sm text-gray-600">{p.city}</p>
          <div className="mt-1 flex gap-2 flex-wrap">
            {p.tags?.map((t) => (
              <span key={t} className="text-xs bg-gray-100 px-2 py-1 rounded">
                {t}
              </span>
            ))}
          </div>
        </div>
    </Link>
  );
}
