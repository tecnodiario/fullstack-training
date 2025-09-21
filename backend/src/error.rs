use axum::{http::StatusCode, response::{IntoResponse, Response}};
use serde::Serialize;


#[derive(Debug, Serialize)]
pub struct ApiError { pub message: String }


impl From<anyhow::Error> for ApiError {
fn from(e: anyhow::Error) -> Self { Self { message: e.to_string() } }
}


impl IntoResponse for ApiError {
fn into_response(self) -> Response {
let body = serde_json::to_string(&self).unwrap_or_else(|_| "{\"message\":\"error\"}".into());
(StatusCode::INTERNAL_SERVER_ERROR, body).into_response()
}
}


pub type ApiResult<T> = Result<T, ApiError>;