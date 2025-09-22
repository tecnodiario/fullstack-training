# ---------- STAGE 1: build ----------
FROM rust:latest AS builder
# (opzionale, ma innocuo)
RUN rustup update stable

# Imposta la dir di lavoro
WORKDIR /app

# Copia i manifest per sfruttare la cache dei deps
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migrations ./migrations

# Compila in modalità release
RUN cargo build --release

# ---------- STAGE 2: runtime ----------
FROM debian:bookworm-slim

# Dipendenze runtime minime (certificati TLS, ecc.)
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia l'eseguibile dal builder
COPY --from=builder /app/target/release/fullstack_training_bff /usr/local/bin/fullstack_training_bff

# Espone la porta del backend
EXPOSE 3001

# Variabili ambiente di default
ENV RUST_LOG=info
ENV PORT=3001

# Avvia l'app
CMD ["fullstack_training_bff"]
