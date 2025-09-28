/**
 * Pagina protetta da middleware: viene servita solo se esiste il cookie JWT.
 * (Per maggior sicurezza, qui potresti anche chiamare /api/me e mostrare i dati utente)
 */
export const dynamic = "force-dynamic"; // evita caching

export default async function ProfiloPage() {
  return (
    <main className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Il mio profilo</h1>
      <p>Se vedi questa pagina, sei autenticato (middleware).</p>
    </main>
  );
}
