# Booking

<p align="center">
  <img src="frontend/public/logo.default.svg" alt="Logo" width="96" height="96">
</p>

Internes Booking-Tool für die Band: Bandmitglieder tragen hier Bewerbungen für
Auftritte ein (Veranstalter, Gage, Ort, Bewerbungstext, ...) und behalten in
einer durchsuch-, sortier- und gruppierbaren Übersicht den Überblick, wer sich
wann bei wem beworben hat. Zugriff nur nach Login; Registrierung ist nur mit
einem vom Admin per CLI erzeugten Invite-Code möglich, es gibt keine offene
Selbstregistrierung.

## Architektur

Monorepo mit npm Workspaces (`frontend`, `backend`, `e2e`):

- **`backend/`** – Node.js + Express-API unter `/api`, PostgreSQL über `pg`
  und `node-pg-migrate` für versionierte Migrationen. JWT-Login, dessen Token
  als httpOnly-Cookie gesetzt wird (kein `localStorage`). Details, API-Liste
  und Benutzerverwaltung: [`backend/README.md`](backend/README.md).
- **`frontend/`** – Vue 3 + Vite + Tailwind CSS, Pinia für den Auth-Store,
  Vue Router mit Auth-Guard, `@tanstack/vue-table` für die Übersichtstabelle
  (Suche/Sortierung/Gruppierung/Paging). Komponentenüberblick:
  [`frontend/README.md`](frontend/README.md).
- **`e2e/`** – Playwright-End-to-End-Tests gegen den per Docker Compose
  hochgefahrenen Gesamtstack.

Im laufenden Betrieb liefert nginx (im Frontend-Container) die gebauten
Frontend-Dateien aus und proxied Anfragen an `/api` an den Backend-Container
weiter (siehe `frontend/nginx.conf`, `frontend/Dockerfile`).

## Lokale Entwicklung (ohne Docker-Rebuild-Zyklus)

Voraussetzung: Node.js 22, laufender Postgres (am einfachsten per Docker
Compose, siehe unten).

```bash
npm install                # einmalig, installiert alle Workspaces
cp .env.example .env       # Postgres-Zugangsdaten/JWT_SECRET anpassen
docker compose up db       # nur Postgres starten
```

Danach in zwei Terminals mit Hot-Reload entwickeln:

```bash
npm run dev --workspace=backend    # nodemon, Express-API auf Port 3000
npm run dev --workspace=frontend   # Vite-Dev-Server, proxied /api auf Port 3000
```

Die Backend-Migrationen vor dem ersten Start ausführen (Details dazu in
[`backend/README.md`](backend/README.md)):

```bash
npm run migrate --workspace=backend
```

Frontend ist danach unter der von Vite ausgegebenen Adresse erreichbar
(Standard: `http://localhost:5173`), das Backend unter `http://localhost:3000`.

## Docker-Compose-Setup

Für einen produktionsnahen Gesamtstack (Postgres + Backend + nginx/Frontend)
am Repo-Root:

```bash
cp .env.example .env   # falls noch nicht geschehen
docker compose up --build
```

Das startet drei Services:

- `db` – `postgres:16-alpine` mit persistentem Volume `postgres-data`.
- `backend` – die Express-API (Migrationen laufen beim Start, siehe
  `backend/Dockerfile`).
- `frontend` – Multi-Stage-Build (Vite-Build → `nginx:alpine`), liefert die
  statischen Dateien aus und proxied `/api` auf `backend`.

Die App ist danach unter `http://localhost` erreichbar (Port über
`FRONTEND_PORT` in `.env` konfigurierbar). Für Benutzerverwaltung
(Invite-Codes, Passwort-Reset) im laufenden Container siehe
[`backend/README.md`](backend/README.md).

## Tests

- Backend: `npm test --workspace=backend` (Vitest + Supertest gegen echtes
  Postgres, Migrationen laufen automatisch vorher via `pretest`).
- Frontend: `npm test --workspace=frontend` (Vitest + Testing Library).
- E2E: `npm run test:e2e` (Playwright, erwartet einen laufenden Stack z. B.
  über `docker compose up --build -d`).
- Lint (beide Packages inkl. `e2e`): `npm run lint`.

Die GitHub Action unter `.github/workflows/ci.yml` führt alle vier Jobs bei
jedem Push/PR gegen `main` aus.

## Weiterführende Dokumentation

- [`backend/README.md`](backend/README.md) – API-Endpunkte, Migrationen,
  Benutzerverwaltung (Invite-Codes, Passwort-Reset).
- [`frontend/README.md`](frontend/README.md) – Komponentenüberblick,
  Dev-Kommandos, Hinweis zum Gruppierungs-Verhalten der Tabelle.
