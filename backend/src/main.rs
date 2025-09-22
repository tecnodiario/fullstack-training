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


let pool = db::connect().await;

// Esegui le migrazioni dal backend/migrations
sqlx::migrate!("./migrations")
    .run(&pool)
    .await
    .expect("cannot run migrations");

let app = routes::app(pool);


let port: u16 = std::env::var("PORT").ok().and_then(|p| p.parse().ok()).unwrap_or(3001);
let addr = SocketAddr::from(([0,0,0,0], port));
tracing::info!("listening on {}", addr);


axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
.await
.unwrap();
}