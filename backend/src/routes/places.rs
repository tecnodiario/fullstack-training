use axum::{extract::{Query, State, Path}, Json};
use serde_json::json;
use uuid::Uuid;


use crate::{db::Db, error::{ApiError, ApiResult}, models::{Place, PlaceFilter}};


pub async fn health() -> Json<serde_json::Value> {
Json(json!({"status":"ok"}))
}


pub async fn list_places(State(db): State<Db>, Query(f): Query<PlaceFilter>) -> ApiResult<Json<Vec<Place>>> {
// build dinamico semplice con bind
let base = "SELECT * FROM places WHERE 1=1";
let mut sql = base.to_string();


// Nota: per semplicità usiamo at most un filtro bindato per q/city;
// per produzione valuta sqlx::QueryBuilder
if let Some(q) = f.q.as_ref() {
sql.push_str(" AND (LOWER(name) LIKE $1 OR LOWER(city) LIKE $1)");
let like = format!("%{}%", q.to_lowercase());
let mut rows: Vec<Place> = sqlx::query_as(&sql).bind(like).fetch_all(&db).await
.map_err(|e| ApiError{ message: e.to_string() })?;
if let Some(tag) = f.tag.as_ref() {
rows.retain(|p| p.tags.iter().any(|t| t.eq_ignore_ascii_case(tag)));
}
return Ok(Json(rows));
}


if let Some(city) = f.city.as_ref() {
sql.push_str(" AND LOWER(city) = $1");
let mut rows: Vec<Place> = sqlx::query_as(&sql).bind(city.to_lowercase()).fetch_all(&db).await
.map_err(|e| ApiError{ message: e.to_string() })?;
if let Some(tag) = f.tag.as_ref() {
rows.retain(|p| p.tags.iter().any(|t| t.eq_ignore_ascii_case(tag)));
}
return Ok(Json(rows));
}


let mut rows: Vec<Place> = sqlx::query_as::<_, Place>(&sql).fetch_all(&db).await
.map_err(|e| ApiError{ message: e.to_string() })?;
if let Some(tag) = f.tag.as_ref() {
rows.retain(|p| p.tags.iter().any(|t| t.eq_ignore_ascii_case(tag)));
}
Ok(Json(rows))
}


pub async fn get_place(State(db): State<Db>, Path(id): Path<Uuid>) -> ApiResult<Json<Place>> {
let p: Place = sqlx::query_as("SELECT * FROM places WHERE id = $1")
.bind(id)
.fetch_one(&db)
.await
.map_err(|e| ApiError{ message: e.to_string() })?;
Ok(Json(p))
}