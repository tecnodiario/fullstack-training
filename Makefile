
# ================================
# Makefile - root del progetto
# ================================

# Variabili
COMPOSE := docker compose
BACKEND_DIR := backend
ENV_FILE := $(BACKEND_DIR)/.env

# Per mostrare help
.PHONY: help
help:
	@echo ""
	@echo "Comandi disponibili:"
	@echo "  make build        - Build di tutte le immagini Docker (backend compreso)"
	@echo "  make up           - Avvio servizi in background (db, adminer, backend)"
	@echo "  make logs         - Logs in follow del backend"
	@echo "  make ps           - Stato dei servizi Docker Compose"
	@echo "  make down         - Stop servizi (senza eliminare volumi)"
	@echo "  make clean-soft   - Ferma servizi + pulizia leggera (senza volumi) + cargo clean backend"
	@echo "  make clean        - Pulizia completa: stop + volumi + immagini local + cargo clean backend"
	@echo "  make rebuild      - Rebuild senza cache dell'immagine backend e riavvio"
	@echo "  make restart      - Riavvia stack (down + up)"
	@echo ""

# ----------------
# Build & Run
# ----------------

.PHONY: build
build:
	@echo "==> Build immagini Docker (backend, ecc.)"
	$(COMPOSE) build

.PHONY: up
up:
	@echo "==> Avvio stack Docker in background"
	$(COMPOSE) up -d
	@echo "==> Stack attivo. Usa 'make ps' o 'make logs'"

.PHONY: logs
logs:
	@echo "==> Logs backend (CTRL+C per uscire)"
	$(COMPOSE) logs -f backend

.PHONY: ps
ps:
	$(COMPOSE) ps

.PHONY: down
down:
	@echo "==> Stop stack (senza rimuovere volumi o immagini)"
	$(COMPOSE) down

# ----------------
# Clean & Rebuild
# ----------------

.PHONY: clean-soft
clean-soft:
	@echo "==> Stop stack (senza volumi)"
	$(COMPOSE) down
	@echo "==> cargo clean (backend/)"
	@$(MAKE) -C $(BACKEND_DIR) clean || (cd $(BACKEND_DIR) && cargo clean)
	@echo "==> Prune di risorse Docker non usate (dangling)"
	docker system prune -f || true
	@echo "==> Fatto (clean-soft). I volumi DB NON sono stati rimossi."

.PHONY: clean
clean:
	@echo "==> Stop stack + rimozione volumi e immagini locali"
	$(COMPOSE) down -v --rmi local
	@echo "==> cargo clean (backend/)"
	@$(MAKE) -C $(BACKEND_DIR) clean || (cd $(BACKEND_DIR) && cargo clean)
	@echo "==> Prune di risorse Docker non usate (dangling)"
	docker system prune -f || true
	@echo "==> Pulizia COMPLETA eseguita."

.PHONY: rebuild
rebuild:
	@echo "==> Rebuild backend senza cache"
	$(COMPOSE) build --no-cache backend
	@echo "==> Riavvio stack"
	$(COMPOSE) up -d
	@echo "==> Fatto."

.PHONY: restart
restart:
	@echo "==> Restart stack (down + up)"
	$(COMPOSE) down
	$(COMPOSE) up -d
	@echo "==> Fatto."

