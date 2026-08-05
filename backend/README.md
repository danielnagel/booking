# Backend

Express-API unter `/api`, PostgreSQL über `pg` + `node-pg-migrate`. Auth läuft
über ein JWT, das als httpOnly-, `SameSite=Strict`-Cookie gesetzt wird (kein
`localStorage`).

## Dev-Kommandos

```bash
npm run dev --workspace=backend    # nodemon src/server.js, Hot-Reload
npm run start --workspace=backend  # node src/server.js (ohne Hot-Reload)
npm test --workspace=backend       # Vitest + Supertest (führt Migrationen vorher via "pretest" aus)
```

**Tests brauchen eine eigene, isolierte Datenbank** – `tests/helpers/db.js`
leert vor jedem Test alle Tabellen (`TRUNCATE ... RESTART IDENTITY CASCADE`).
Einmal lief das versehentlich gegen die echte lokale Dev-Datenbank statt einer
Test-DB, weswegen es jetzt zwei Absicherungen gibt:

1. `npm test`/`npm run pretest` laufen über
   `scripts/run-with-test-db.js`, das `DATABASE_URL` zwingend auf
   `TEST_DATABASE_URL` (aus `.env`) umbiegt.
2. `resetDb()` prüft zusätzlich den tatsächlichen Datenbanknamen und bricht
   mit einem Fehler ab, falls er nicht `"test"` enthält – unabhängig davon,
   wie `DATABASE_URL` zustande kam.

Vor dem ersten lokalen Testlauf einmalig die isolierte Test-DB starten
(separater Postgres-Container, eigener Port, kein persistentes Volume – siehe
`docker-compose.yml`, Service `db-test`):

```bash
docker compose --profile test up -d db-test
```

`.env.example` enthält die zugehörigen `TEST_POSTGRES_*`/`TEST_DATABASE_URL`-
Variablen mit funktionierenden Defaults für Port `5433`.

## Umgebungsvariablen

Werden aus `.env` gelesen (siehe `.env.example` am Repo-Root; lokal per
`dotenv` geladen, siehe `src/db/pool.js`/`src/server.js`):

- `DATABASE_URL` – vollständiger Postgres-Connection-String. Ist er gesetzt,
  hat er Vorrang vor den einzelnen `PGHOST`/`PGPORT`/`PGUSER`/`PGPASSWORD`/
  `PGDATABASE`-Variablen (Fallback bei lokalem Betrieb ohne Docker).
- `JWT_SECRET` – Secret zum Signieren/Verifizieren des Auth-Cookies.
- `PORT` – Port, auf dem die Express-App lauscht (Default `3000`).
- `NODE_ENV` – wird auf `production` gesetzt, damit das Auth-Cookie zusätzlich
  `Secure` ist (setzt TLS-Terminierung davor voraus, siehe Meilenstein 2).

## Migrationen

```bash
npm run migrate --workspace=backend        # alle offenen Migrationen anwenden
npm run migrate:down --workspace=backend   # letzte Migration zurückrollen
```

Migrationen liegen unter `migrations/` (`node-pg-migrate`) und legen die
Tabellen `users`, `invite_codes`, `password_reset_codes` und `bookings` an.
Im Docker-Compose-Stack laufen sie automatisch beim Start des
`backend`-Containers (siehe `Dockerfile`); im CI-Lauf via `pretest` vor den
Backend-Tests.

## API-Endpunkte

Alle Endpunkte außer den Auth-Endpunkten erfordern das Auth-Cookie (Middleware
`requireAuth`, `src/middleware/auth.js`); ohne gültiges Cookie antworten sie
mit `401`. `requireAuth` prüft dafür bei jedem Request zusätzlich zur
JWT-Signatur/-Gültigkeit, ob der User (`sub`-Claim) noch existiert – ein
gelöschter User wird damit sofort ausgesperrt, statt bis zum Ablauf des
Tokens (12h) weiter Zugriff zu haben. Ein Passwort-Reset invalidiert
bestehende Sessions dagegen (noch) nicht – ein altes, aber noch gültiges
Cookie funktioniert bis zum Ablauf weiter, auch nach einem Reset.

### Auth (`/api/auth`)

| Methode | Pfad | Body | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | `{ inviteCode, username, password }` | Legt einen Nutzer an, sofern der Invite-Code gültig (nicht abgelaufen, nicht deaktiviert) und der Username noch frei ist. |
| `POST` | `/api/auth/reset-password` | `{ resetCode, newPassword }` | Setzt das Passwort des an `resetCode` gebundenen Nutzers neu, sofern der Code gültig und noch nicht verwendet ist; markiert ihn danach als verwendet. Kein Username-Feld nötig. |
| `POST` | `/api/auth/login` | `{ username, password }` | Prüft Zugangsdaten, setzt bei Erfolg das JWT-Auth-Cookie (12h gültig). |
| `GET` | `/api/auth/me` | – | Liefert `{ id, username }` des eingeloggten Nutzers, sonst `401`. Wird vom Frontend beim App-Start zur Session-Prüfung genutzt. |

### Bookings (`/api/bookings`, jeweils hinter `requireAuth`)

| Methode | Pfad | Beschreibung |
| --- | --- | --- |
| `GET` | `/api/bookings` | Liste mit Query-Parametern `search` (ILIKE über alle Textspalten), `sortBy`/`sortDir` (`asc`/`desc`), `page` (1-basiert). Feste `pageSize` von 50. Antwort: `{ data, page, pageSize, total }`. |
| `GET` | `/api/bookings/:id` | Einzelnen Eintrag laden. |
| `POST` | `/api/bookings` | Neuen Eintrag anlegen. Einziges Pflichtfeld: `event_name`. `created_by` wird serverseitig aus dem JWT gesetzt. |
| `PUT` | `/api/bookings/:id` | Eintrag aktualisieren (gleiche Felder wie beim Anlegen, `event_name` weiterhin Pflicht). `updated_by`/`updated_at` werden serverseitig gesetzt. Kein Owner-Check – jeder eingeloggte Nutzer darf jeden Eintrag ändern. |
| `DELETE` | `/api/bookings/:id` | Eintrag löschen. Kein Owner-Check. |

Schreibbare Felder bei `POST`/`PUT`: `event_name`, `event_date`, `organizer`,
`organizer_website`, `organizer_email`, `application_text`, `venue_street`,
`venue_zip`, `venue_city`, `fee`. Die Metadaten `created_by`, `created_at`,
`updated_by`, `updated_at` werden in den Antworten mitgeliefert, sind aber
reine DB-Metadaten und werden vom Client nicht gesetzt.

## Benutzerverwaltung

Es gibt **keine offene Selbstregistrierung**: Ein neuer Nutzer kann sich nur
mit einem gültigen Invite-Code registrieren. Alle folgenden Befehle sind
CLI-Skripte im Backend-Package (`backend/src/cli/`) und verbinden sich über
dieselbe `DATABASE_URL` wie die API zur Datenbank.

**Wichtig:** Diese Befehle sind für den Betrieb gegen die produktive
Datenbank gedacht, nicht für die lokale Entwicklung. Sie werden deshalb **im
laufenden Backend-Container** ausgeführt, nicht lokal auf dem
Entwickler-Rechner:

```bash
docker compose exec backend npm run invite:create
docker compose exec backend npm run invite:list
docker compose exec backend npm run invite:revoke -- <code>
docker compose exec backend npm run password-reset:create -- <username>
docker compose exec backend npm run user:list
```

(Voraussetzung: der `backend`-Service läuft, z. B. via
`docker compose up -d backend db`.)

### Invite-Codes

- `invite:create` – erzeugt einen neuen Invite-Code, gibt Code und
  Ablaufdatum auf der Konsole aus. **30 Tage** ab Erstellung gültig und in
  dieser Zeit **beliebig oft wiederverwendbar** – ein Code kann z. B. einmal
  in der Bandgruppe geteilt werden, jedes Mitglied registriert sich damit
  selbst.
- `invite:list` – listet alle aktiven (nicht abgelaufenen, nicht
  deaktivierten) Invite-Codes mit Erstellungs- und Ablaufdatum auf.
- `invite:revoke -- <code>` – deaktiviert einen aktiven Invite-Code sofort
  (setzt `revoked_at`); danach schlägt eine Registrierung mit diesem Code
  fehl.

### Passwort-Reset

- `password-reset:create -- <username>` – erzeugt für einen **bestehenden**
  Nutzer einen Passwort-Reset-Code, gibt Code und Ablaufdatum auf der Konsole
  aus. **72h** gültig und **einmal verwendbar** (nach erfolgreichem Reset über
  `POST /api/auth/reset-password` wird der Code gesperrt). Der Code ist
  serverseitig bereits an den Nutzer gebunden, beim Zurücksetzen ist daher nur
  Code + neues Passwort nötig, kein Username.

### Benutzer-Übersicht

- `user:list` – listet alle Nutzer mit Erstellungsdatum und letztem Login auf
  (`nie`, falls noch kein Login stattgefunden hat).
