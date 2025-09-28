/**
 * Centralizziamo la lettura delle env: lato server le leggiamo a runtime.
 * NB: le variabili NEXT_PUBLIC_* vengono embeddate anche lato client.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;
export const RUST_API_BASE = process.env.RUST_API_BASE!; // usata nei Route Handlers (server)
export const JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME || "ggf_session";
export const JWT_EXPIRE_DAYS = Number(process.env.JWT_EXPIRE_DAYS || "7");
export const SMTP_HOST = process.env.SMTP_HOST!;
export const SMTP_PORT = Number(process.env.SMTP_PORT || "587");
export const SMTP_USER = process.env.SMTP_USER!;
export const SMTP_PASS = process.env.SMTP_PASS!;
export const EMAIL_FROM = process.env.EMAIL_FROM || "fullstack_training"