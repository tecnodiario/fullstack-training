use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};


#[derive(sqlx::FromRow, Serialize, Deserialize, Clone, Debug)]
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


#[derive(Deserialize, Debug)]
pub struct PlaceFilter {
pub q: Option<String>,
pub city: Option<String>,
pub tag: Option<String>,
}