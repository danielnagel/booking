# Frontend

Vue 3 + Vite + Tailwind CSS. Auth state via Pinia, routing via Vue Router
with an auth guard, overview table via the headless `@tanstack/vue-table`.

## Dev commands

```bash
npm run dev --workspace=frontend      # Vite dev server with hot reload, proxies /api to http://localhost:3000
npm run build --workspace=frontend    # production build to dist/
npm run preview --workspace=frontend  # serve the built dist/ output locally
npm test --workspace=frontend         # Vitest + @testing-library/vue
```

The dev server proxy (`vite.config.js`) expects a locally running backend
on port 3000 (`npm run dev --workspace=backend`).

## Component overview

- **`App.vue`** – root component, wraps `<router-view>` with
  `AppHeader`/`AppFooter`, so they appear on every page including login/
  register/password reset.
- **`router/index.js`** – routes `/login`, `/registrieren`,
  `/passwort-zuruecksetzen`, `/` (overview), `/eingabe` (new entry) and
  `/eingabe/:id` (edit, same component as create). A navigation guard checks
  the auth status before every route change and redirects to `/login` if
  there is no session.
- **`stores/auth.js`** (Pinia) – login/logout/registration/password reset
  and the currently logged-in user; `fetchCurrentUser()` checks the session
  on app start via `GET /api/auth/me`.
- **`api/client.js`** – fetch wrapper with `credentials: 'include'` (uses
  the httpOnly auth cookie) and centralized `401` handling (redirects to
  `/login`, except for the initial `/auth/me` check itself).
- **`views/LoginView.vue`** – login form with links to `/registrieren` and
  `/passwort-zuruecksetzen`.
- **`views/RegisterView.vue`** – registration with invite code, username and
  password.
- **`views/ResetPasswordView.vue`** – password reset with reset code and new
  password (no username field, see backend README).
- **`views/OverviewView.vue`** – loads bookings server-side (search, sort,
  paging), renders `BookingTable` and the "New entry" button, controls the
  delete confirmation dialog.
- **`views/EntryFormView.vue`** – used for both `/eingabe` (create) and
  `/eingabe/:id` (edit); in the edit case it loads the existing entry and
  renders `BookingForm`.
- **`components/AppHeader.vue`** – logo top left, visible only on desktop
  (`hidden md:flex`).
- **`components/AppFooter.vue`** – the same logo at the bottom, visible only
  on mobile (`md:hidden`).
- **`components/BookingTable.vue`** – overview table based on
  `@tanstack/vue-table`: global search (debounced), column sorting,
  grouping, paging controls. The column header for the fee reads
  "Gage (€)".
- **`components/BookingForm.vue`** – entry form, reused for create and edit
  (controlled via the `isEditMode` prop). Only required field: event name.
  Two submit buttons: "Hinzufügen und nächster Eintrag" (saves, resets the
  form, stays on the page) and "Hinzufügen und zurück zur Übersicht" (saves,
  navigates to `/`); in edit mode the equivalent "Speichern und ..."
  variants.
- **`components/FormField.vue`** – generic label+input, used by
  `BookingForm` for each of the ten visible fields (the `created_by`/
  `created_at`/`updated_by`/`updated_at` metadata is not a form field).
- **`components/ConfirmDialog.vue`** – generic delete confirmation dialog.

## Known behavior: grouping + server-side paging

Search, sorting and paging run server-side – the frontend only ever holds
the currently loaded page (max. 50 rows) in memory. The grouping feature of
`@tanstack/vue-table` in `BookingTable.vue` therefore groups **only within
the currently loaded page**, not across the entire dataset. An entry on a
different page will not show up in the current page's grouping. This is
intentional, known behavior and not a bug.
