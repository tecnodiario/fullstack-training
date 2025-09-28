/**
 * Tipi condivisi per i dati provenienti dall'API Axum.
 */
export type Place = {
  id: string;
  name: string;
  city: string;
  tags: string[];
  latitude: number;
  longitude: number;
  description?: string | null;
  images: string[];
  created_at?: string;
};
