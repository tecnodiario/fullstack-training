# Obiettivo

Costruire una **mini‑app funzionante** per autoformazione con:

* **BFF in Rust + Axum** che espone API RESTful e legge/scrive su **PostgreSQL**.
* **Frontend web** in **Next.js 15 + TypeScript + Tailwind**, con **lista filtrabile** di luoghi, scheda dettaglio, immagini e **mappa**.
* **Client mobile** di esempio in **Flutter** che consuma le stesse API.
* Esecuzione locale via **Docker Compose** (Postgres + Adminer).

> Pensata per essere estesa in seguito con ranking, wallet, ecc.

---

## Architettura & Struttura repo



```
training-app/
├─ backend/                    # Axum BFF (Rust)
│  ├─ src/
│  │  ├─ main.rs
│  │  ├─ routes/
│  │  │  ├─ places.rs
│  │  │  └─ mod.rs
│  │  ├─ models.rs
│  │  ├─ db.rs
│  │  └─ error.rs
│  ├─ migrations/
│  │  ├─ 0001_create_tables.sql
│  │  └─ 0002_seed_places.sql
│  ├─ Cargo.toml
│  └─ .env
├─ frontend/                  # Next.js 15 + TS + Tailwind
│  ├─ app/
│  │  ├─ page.tsx            # lista + filtri
│  │  ├─ places/[id]/page.tsx# dettaglio luogo
│  │  └─ api-client.ts       # thin client fetch
│  ├─ components/
│  │  ├─ Filters.tsx
│  │  └─ PlaceCard.tsx
│  ├─ public/
│  │  └─ sample.jpg
│  ├─ tailwind.config.ts
│  ├─ postcss.config.cjs
│  ├─ tsconfig.json
│  ├─ package.json
│  └─ .env.local
├─ mobile/
│  └─ flutter_client_snippet.dart
├─ docker-compose.yml
└─ README.md
```

---

## 1) Docker Compose (PostgreSQL + Adminer)

**`docker-compose.yml`**

```yaml
version: '3.9'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: fullstack_training
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
  adminer:
    image: adminer
    ports:
      - "8080:8080"
volumes:
  db_data:
```

Avvio: `docker compose up -d`

---

## 2) Backend – Axum BFF

### Cargo & dipendenze

**`backend/Cargo.toml`**

```toml
[package]
name = "fullstack_training_bff"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = { version = "0.7", features = ["macros"] }
axum-extra = { version = "0.9", features=["typed-header"] }
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
serde_with = "3"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["fmt", "env-filter"] }
# DB
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "uuid", "chrono", "json"] }
uuid = { version = "1", features = ["serde", "v4"] }
chrono = { version = "0.4", features = ["serde"] }
# Env & CORS
dotenvy = "0.15"
tower-http = { version = "0.5", features = ["cors", "trace"] }
```

### Variabili ambiente

**`backend/.env`**

```
DATABASE_URL=postgres://app:app@localhost:5432/fullstack_training
RUST_LOG=info,axum::rejection=trace
PORT=3001
```

### Schema & seed

**`backend/migrations/0001_create_tables.sql`**

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  description TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**`backend/migrations/0002_seed_places.sql`**

```sql
INSERT INTO places (name, city, tags, latitude, longitude, description, images) VALUES
('Trattoria Da Lello', 'Torino', ARRAY['italiano','pasta','tradizione'], 45.0703, 7.6869, 'Cucina piemontese rustica.', ARRAY['/images/lello1.jpg']),
('Pizzeria Marechiaro', 'Roma', ARRAY['pizza','napoletana','forno a legna'], 41.9028, 12.4964, 'Verace napoletana nel cuore di Roma.', ARRAY['/images/marechiaro1.jpg']),
('Sushi Kaze', 'Milano', ARRAY['sushi','giapponese','fusion'], 45.4642, 9.1900, 'Omakase e rolls creativi.', ARRAY['/images/kaze1.jpg']);
```

Esegui le migrazioni (una tantum) con SQLx CLI **oppure** via codice (vedi `db.rs`).

### Codice backend

**`backend/src/models.rs`**

```rust
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(sqlx::FromRow, Serialize, Deserialize, Clone)]
pub struct Place {
    pub id: Uuid,
    pub name: String,
    pub city: String,
    pub tags: Vec<String>,
    pub latitude: f64,
    pub longitude: f64,
    pub description: Option<String>,
    pub images: Vec<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Deserialize)]
pub struct PlaceFilter {
    pub q: Option<String>,      // testo libero
    pub city: Option<String>,
    pub tag: Option<String>,
}
```

**`backend/src/error.rs`**

```rust
use axum::{http::StatusCode, response::{IntoResponse, Response}};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct ApiError { pub message: String }

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let body = serde_json::to_string(&self).unwrap_or_else(|_| "{\"message\":\"error\"}".into());
        (StatusCode::INTERNAL_SERVER_ERROR, body).into_response()
    }
}

pub type ApiResult<T> = Result<T, ApiError>;
```

**`backend/src/db.rs`**

```rust
use sqlx::{Pool, Postgres};
use std::env;

pub type Db = Pool<Postgres>;

pub async fn connect() -> Db {
    let url = env::var("DATABASE_URL").expect("DATABASE_URL not set");
    sqlx::postgres::PgPoolOptions::new()
        .max_connections(10)
        .connect(&url)
        .await
        .expect("cannot connect to db")
}
```

**`backend/src/routes/places.rs`**

```rust
use axum::{extract::{Query, State, Path}, Json};
use serde_json::json;

use crate::{db::Db, error::{ApiError, ApiResult}, models::{Place, PlaceFilter}};

pub async fn list_places(State(db): State<Db>, Query(f): Query<PlaceFilter>) -> ApiResult<Json<Vec<Place>>> {
    let mut query = String::from("SELECT * FROM places WHERE 1=1");
    let mut params: Vec<String> = Vec::new();

    if let Some(q) = f.q.as_ref() { query.push_str(" AND (LOWER(name) LIKE $1 OR LOWER(city) LIKE $1)"); params.push(format!("%{}%", q.to_lowercase())); }
    if f.q.is_none() && f.city.is_some() { query.push_str(" AND LOWER(city) = $1"); }

    let rows: Vec<Place> = if let Some(qval) = params.get(0) {
        sqlx::query_as(&query).bind(qval).fetch_all(&db).await.map_err(|e| ApiError{message:e.to_string()})?
    } else if let Some(city) = f.city.as_ref() {
        sqlx::query_as(&query).bind(city.to_lowercase()).fetch_all(&db).await.map_err(|e| ApiError{message:e.to_string()})?
    } else {
        sqlx::query_as(&query).fetch_all(&db).await.map_err(|e| ApiError{message:e.to_string()})?
    };

    // filtro lato app opzionale per tag
    let rows = if let Some(tag) = f.tag { rows.into_iter().filter(|p| p.tags.iter().any(|t| t.eq_ignore_ascii_case(&tag))).collect() } else { rows };

    Ok(Json(rows))
}

pub async fn get_place(State(db): State<Db>, Path(id): Path<uuid::Uuid>) -> ApiResult<Json<Place>> {
    let place: Place = sqlx::query_as("SELECT * FROM places WHERE id = $1")
        .bind(id)
        .fetch_one(&db)
        .await
        .map_err(|e| ApiError{message:e.to_string()})?;
    Ok(Json(place))
}

pub async fn health() -> Json<serde_json::Value> {
    Json(json!({"status":"ok"}))
}
```

**`backend/src/routes/mod.rs`**

```rust
use axum::{routing::get, Router};
use tower_http::cors::{Any, CorsLayer};

use crate::db::Db;

pub mod places;

pub fn app(db: Db) -> Router {
    let cors = CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any);

    Router::new()
        .route("/api/health", get(places::health))
        .route("/api/places", get(places::list_places))
        .route("/api/places/:id", get(places::get_place))
        .layer(cors)
        .with_state(db)
}
```

**`backend/src/main.rs`**

```rust
mod routes; mod models; mod db; mod error;
use std::net::SocketAddr;
use tracing_subscriber::{EnvFilter, FmtSubscriber};

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    let subscriber = FmtSubscriber::builder()
        .with_env_filter(EnvFilter::from_default_env())
        .finish();
    tracing::subscriber::set_global_default(subscriber).unwrap();

    let db = db::connect().await;
    // (opzionale) eseguire migrazioni con sqlx::migrate!("./migrations").run(&db).await.unwrap();

    let app = routes::app(db);
    let port: u16 = std::env::var("PORT").ok().and_then(|p| p.parse().ok()).unwrap_or(3001);
    let addr = SocketAddr::from(([0,0,0,0], port));
    tracing::info!("listening on {}", addr);
    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app).await.unwrap();
}
```

**Avvio backend**

```
cd backend
cargo run
# API:
# GET http://localhost:3001/api/health
# GET http://localhost:3001/api/places?q=roma&tag=pizza
# GET http://localhost:3001/api/places/{id}
```

---

## 3) Frontend – Next.js 15 + TS + Tailwind

### Setup

```
cd frontend
npm create next-app@latest . -- --ts --eslint --app --src-dir --tailwind --no-experimental-app-router false
npm i
```

**`frontend/.env.local`**

```
NEXT_PUBLIC_API_BASE=http://localhost:3001
```

**`frontend/app/api-client.ts`**

```ts
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;
export type Place = {
  id: string; name: string; city: string; tags: string[];
  latitude: number; longitude: number; description?: string; images: string[];
};
export async function fetchPlaces(params?: { q?: string; city?: string; tag?: string }): Promise<Place[]> {
  const qs = new URLSearchParams(params as any).toString();
  const res = await fetch(`${API_BASE}/api/places${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed');
  return res.json();
}
export async function fetchPlace(id: string): Promise<Place> {
  const res = await fetch(`${API_BASE}/api/places/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed');
  return res.json();
}
```

**`frontend/components/Filters.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Filters() {
  const r = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const [city, setCity] = useState(sp.get('city') ?? '');
  const [tag, setTag] = useState(sp.get('tag') ?? '');

  const apply = () => {
    const p = new URLSearchParams({ ...(q && { q }), ...(city && { city }), ...(tag && { tag }) });
    r.push(`/?${p.toString()}`);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <input className="border p-2 rounded w-60" placeholder="Cerca..." value={q} onChange={e=>setQ(e.target.value)} />
      <input className="border p-2 rounded w-48" placeholder="Città" value={city} onChange={e=>setCity(e.target.value)} />
      <input className="border p-2 rounded w-48" placeholder="Tag (es. pizza)" value={tag} onChange={e=>setTag(e.target.value)} />
      <button onClick={apply} className="px-4 py-2 bg-black text-white rounded">Filtra</button>
    </div>
  );
}
```

**`frontend/components/PlaceCard.tsx`**

```tsx
import Link from 'next/link';
import type { Place } from '../app/api-client';

export default function PlaceCard({ p }: { p: Place }) {
  return (
    <Link href={`/places/${p.id}`} className="block border rounded-xl p-4 hover:shadow-md transition">
      <div className="flex gap-4 items-center">
        <img src={p.images?.[0] || '/sample.jpg'} alt={p.name} className="w-24 h-24 object-cover rounded" />
        <div>
          <h3 className="text-lg font-semibold">{p.name}</h3>
          <p className="text-sm text-gray-600">{p.city}</p>
          <div className="mt-1 flex gap-2 flex-wrap">
            {p.tags?.map(t => <span key={t} className="text-xs bg-gray-100 px-2 py-1 rounded">{t}</span>)}
          </div>
        </div>
      </div>
    </Link>
  );
}
```

**`frontend/app/page.tsx`** (lista + filtri)

```tsx
import Filters from "../components/Filters";
import { fetchPlaces } from "./api-client";

export default async function Home({ searchParams }: { searchParams: { q?: string; city?: string; tag?: string } }) {
  const data = await fetchPlaces(searchParams);
  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Luoghi</h1>
      <Filters />
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        {data.map(p => <div key={p.id} className=""><!-- @ts-expect-error async server component -->{require('../components/PlaceCard').default({ p })}</div>)}
      </div>
    </main>
  );
}
```

**`frontend/app/places/[id]/page.tsx`** (dettaglio + mappa placeholder)

```tsx
import { fetchPlace } from "../../api-client";

export default async function PlaceDetail({ params }: { params: { id: string } }) {
  const p = await fetchPlace(params.id);
  return (
    <main className="max-w-3xl mx-auto p-6">
      <img src={p.images?.[0] || '/sample.jpg'} alt={p.name} className="w-full h-64 object-cover rounded" />
      <h1 className="text-2xl font-bold mt-4">{p.name}</h1>
      <p className="text-gray-700">{p.city}</p>
      <p className="mt-2">{p.description}</p>
      <div className="mt-4 h-80 w-full border rounded flex items-center justify-center">
        {/* Integra Mapbox/Google in seguito. */}
        <span>MAPPA: lat {p.latitude}, lng {p.longitude}</span>
      </div>
    </main>
  );
}
```

Avvio Next: `npm run dev` (porta predefinita 3000)

---

## 4) Client Mobile – Flutter (snippet)

**`mobile/flutter_client_snippet.dart`**

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class Place {  
  final String id, name, city;  
  final List<dynamic> tags;  
  Place({required this.id, required this.name, required this.city, required this.tags});
  factory Place.fromJson(Map<String, dynamic> j) => Place(
    id: j['id'], name: j['name'], city: j['city'], tags: j['tags'] ?? []);
}

class ApiClient {
  final String base = 'http://10.0.2.2:3001'; // Android emulator → localhost
  Future<List<Place>> fetchPlaces({String? q, String? city, String? tag}) async {
    final qp = {
      if (q != null && q.isNotEmpty) 'q': q,
      if (city != null && city.isNotEmpty) 'city': city,
      if (tag != null && tag.isNotEmpty) 'tag': tag,
    };
    final uri = Uri.parse('$base/api/places').replace(queryParameters: qp);
    final res = await http.get(uri);
    if (res.statusCode != 200) throw Exception('failed');
    final list = jsonDecode(res.body) as List;
    return list.map((e) => Place.fromJson(e)).toList();
  }
}
```

Uso in una `ListView.builder` per mostrare nome/città e aggiungere un `TextField` per filtro rapido.

---

## 5) Istruzioni rapide

1. **DB**: `docker compose up -d` (Postgres su 5432, Adminer su 8080).
2. **Backend**: `cd backend && cargo run` (API su `http://localhost:3001`).
3. **Migrazioni**: importa i due SQL della cartella `migrations` (via Adminer o `sqlx migrate run`).
4. **Frontend**: `cd frontend && npm run dev` (Web su `http://localhost:3000`).
5. **Flutter**: usa `10.0.2.2` come host per chiamare il BFF da emulatore Android.

---

## 6) Estensioni consigliate (step successivi)

* **Mappe**: integra **Mapbox GL** o **Google Maps JS** nella pagina dettaglio.
* **Upload immagini**: endpoint POST `/api/places/:id/images` (S3/Cloudinary in futuro, locale per ora).
* **Auth semplice**: JWT opzionale per POST/PUT; per ora solo GET pubblici.
* **Pagination & caching**: query param `page/limit` e Redis in futuro.
* **Test**: `tokio::test` per rotte Axum e component test in Next.

---

## 7) Criterio di completamento

* Lista luoghi filtrabile per **q/city/tag** su web **e** mobile.
* Dettaglio con immagini e mappa (anche placeholder iniziale).
* Tutto gira in locale con Docker (DB), `cargo run`, `npm run dev`, Flutter emulatore.

Buon divertimento! Puoi incollare questa struttura in un nuovo repo e partire subito. In caso vuoi, posso generare anche i file reali in uno zip con i contenuti di esempio.
