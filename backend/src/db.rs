use sqlx::{Pool, Postgres};
use std::env;


pub type Db = Pool<Postgres>;


pub async fn connect() -> Db {
let url = env::var("DATABASE_URL").expect("DATABASE_URL not set");
sqlx::postgres::PgPoolOptions::new()
.max_connections(10)
.connect(&url)
.await
.unwrap_or_else(|e| panic!("cannot connect to db at {}: {}", url, e))
}