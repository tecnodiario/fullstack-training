use axum::{routing::get, Router};
use tower_http::cors::{Any, CorsLayer};


use crate::db::Db;


pub mod places;


fn cors_layer() -> CorsLayer {
CorsLayer::new()
.allow_origin(Any) // in produzione: whitelist precisa
.allow_methods(Any)
.allow_headers(Any)
}


pub fn app(db: Db) -> Router {
Router::new()
.route("/api/health", get(places::health))
.route("/api/places", get(places::list_places))
.route("/api/places/{id}", get(places::get_place))
.layer(cors_layer())
.with_state(db)
}