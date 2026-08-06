# Backend

Express API under `/api`, PostgreSQL via `pg` + `node-pg-migrate`. Auth is
handled via a JWT set as an httpOnly, `SameSite=Strict` cookie (no
`localStorage`).

## Dev commands

```bash
npm run dev --workspace=backend    # nodemon src/server.js, hot reload
npm run start --workspace=backend  # node src/server.js (without hot reload)
npm test --workspace=backend       # Vitest + Supertest (runs migrations beforehand via "pretest")
```

**Tests need their own, isolated database** – `tests/helpers/db.js` truncates
all tables before every test (`TRUNCATE ... RESTART IDENTITY CASCADE`). This
once ran accidentally against the real local dev database instead of a test
DB, which is why there are now two safeguards:

1. `npm test`/`npm run pretest` run via
   `scripts/run-with-test-db.js`, which forces `DATABASE_URL` to
   `TEST_DATABASE_URL` (from `.env`).
2. `resetDb()` additionally checks the actual database name and aborts with
   an error if it doesn't contain `"test"` – regardless of how
   `DATABASE_URL` was set.

Before the first local test run, start the isolated test DB once (separate
Postgres container, own port, no persistent volume – see
`docker-compose.yml`, service `db-test`):

```bash
docker compose --profile test up -d db-test
```

`.env.example` contains the corresponding `TEST_POSTGRES_*`/
`TEST_DATABASE_URL` variables with working defaults for port `5433`.

## Environment variables

Read from `.env` (see `.env.example` at the repo root; loaded locally via
`dotenv`, see `src/db/pool.js`/`src/server.js`):

- `DATABASE_URL` – full Postgres connection string. If set, it takes
  precedence over the individual `PGHOST`/`PGPORT`/`PGUSER`/`PGPASSWORD`/
  `PGDATABASE` variables (fallback for local operation without Docker).
- `JWT_SECRET` – secret for signing/verifying the auth cookie.
- `PORT` – port the Express app listens on (default `3000`).
- `NODE_ENV` – set to `production` so the auth cookie is additionally
  `Secure` (requires TLS termination in front of it, see milestone 2).
- `TRUST_PROXY_HOPS` – number of reverse proxy hops in front of this service
  (default `0` = direct connection, no proxy). Must exactly match the real
  hop count of the given environment, see the comment in `src/app.js`
  (set incorrectly, it either breaks `authRateLimiter`'s per-IP counting or
  – if too generous – can be bypassed via a spoofed `X-Forwarded-For`). The
  local `docker-compose.yml` already sets this to `1` (one `frontend` nginx
  hop).

## Migrations

```bash
npm run migrate --workspace=backend        # apply all pending migrations
npm run migrate:down --workspace=backend   # roll back the last migration
```

Migrations live under `migrations/` (`node-pg-migrate`) and create the
`users`, `invite_codes`, `password_reset_codes` and `bookings` tables. In the
Docker Compose stack they run automatically on `backend` container startup
(see `Dockerfile`); in CI via `pretest` before the backend tests.

## API endpoints

All endpoints except the auth endpoints require the auth cookie (middleware
`requireAuth`, `src/middleware/auth.js`); without a valid cookie they
respond with `401`. For every request, `requireAuth` also checks, in
addition to the JWT signature/validity, whether the user (`sub` claim)
still exists – a deleted user is thus locked out immediately instead of
retaining access until the token expires (12h). A password reset, however,
does (not yet) invalidate existing sessions – an old but still valid cookie
keeps working until it expires, even after a reset.

### Auth (`/api/auth`)

| Method | Path | Body | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | `{ inviteCode, username, password }` | Creates a user, provided the invite code is valid (not expired, not revoked) and the username is still available. |
| `POST` | `/api/auth/reset-password` | `{ resetCode, newPassword }` | Resets the password of the user bound to `resetCode`, provided the code is valid and not yet used; marks it as used afterwards. No username field needed. |
| `POST` | `/api/auth/login` | `{ username, password }` | Checks credentials, sets the JWT auth cookie on success (valid for 12h). |
| `GET` | `/api/auth/me` | – | Returns `{ id, username }` of the logged-in user, otherwise `401`. Used by the frontend on app start to check the session. |

### Bookings (`/api/bookings`, each behind `requireAuth`)

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/bookings` | List with query parameters `search` (ILIKE across all text columns), `sortBy`/`sortDir` (`asc`/`desc`), `page` (1-based). Fixed `pageSize` of 50. Response: `{ data, page, pageSize, total }`. |
| `GET` | `/api/bookings/:id` | Load a single entry. |
| `POST` | `/api/bookings` | Create a new entry. Only required field: `event_name`. `created_by` is set server-side from the JWT. |
| `PUT` | `/api/bookings/:id` | Update an entry (same fields as on create, `event_name` still required). `updated_by`/`updated_at` are set server-side. No owner check – any logged-in user may modify any entry. |
| `DELETE` | `/api/bookings/:id` | Delete an entry. No owner check. |

Writable fields on `POST`/`PUT`: `event_name`, `event_date`, `organizer`,
`organizer_website`, `organizer_email`, `application_text`, `venue_street`,
`venue_zip`, `venue_city`, `fee`. The `created_by`, `created_at`,
`updated_by`, `updated_at` metadata is included in responses but is purely
DB metadata and is not set by the client.

## User management

There is **no open self-registration**: a new user can only register with a
valid invite code. All of the following commands are CLI scripts in the
backend package (`backend/src/cli/`) and connect to the database via the
same `DATABASE_URL` as the API.

**Important:** these commands are intended for operating against the
production database, not for local development. They are therefore run
**inside the running backend container**, not locally on the developer
machine:

```bash
docker compose exec backend npm run invite:create
docker compose exec backend npm run invite:list
docker compose exec backend npm run invite:revoke -- <code>
docker compose exec backend npm run password-reset:create -- <username>
docker compose exec backend npm run user:list
```

(Prerequisite: the `backend` service is running, e.g. via
`docker compose up -d backend db`.)

### Invite codes

- `invite:create` – generates a new invite code, prints the code and
  expiry date to the console. Valid for **30 days** from creation and
  **reusable any number of times** during that period – a code can, for
  example, be shared once in the team chat, with each member registering
  themselves.
- `invite:list` – lists all active (not expired, not revoked) invite codes
  with their creation and expiry dates.
- `invite:revoke -- <code>` – immediately revokes an active invite code
  (sets `revoked_at`); registration with this code then fails.

### Password reset

- `password-reset:create -- <username>` – generates a password reset code
  for an **existing** user, prints the code and expiry date to the console.
  Valid for **72h** and **single-use** (after a successful reset via
  `POST /api/auth/reset-password` the code is locked). The code is already
  bound to the user server-side, so resetting only requires the code plus
  the new password, no username.

### User overview

- `user:list` – lists all users with their creation date and last login
  (`nie`, if no login has occurred yet).
