# Frontend

Vue 3 + Vite + Tailwind CSS. Auth-State über Pinia, Routing über Vue Router
mit Auth-Guard, Übersichtstabelle über das headless `@tanstack/vue-table`.

## Dev-Kommandos

```bash
npm run dev --workspace=frontend      # Vite-Dev-Server mit Hot-Reload, proxied /api auf http://localhost:3000
npm run build --workspace=frontend    # Produktions-Build nach dist/
npm run preview --workspace=frontend  # gebauten dist/-Output lokal servieren
npm test --workspace=frontend         # Vitest + @testing-library/vue
```

Der Dev-Server-Proxy (`vite.config.js`) erwartet ein lokal laufendes Backend
auf Port 3000 (`npm run dev --workspace=backend`).

## Komponentenüberblick

- **`App.vue`** – Wurzelkomponente, bindet `AppHeader`/`AppFooter` fest um
  `<router-view>` ein, erscheinen also auf jeder Seite inkl. Login/
  Registrieren/Passwort-Reset.
- **`router/index.js`** – Routen `/login`, `/registrieren`,
  `/passwort-zuruecksetzen`, `/` (Übersicht), `/eingabe` (neuer Eintrag) und
  `/eingabe/:id` (bearbeiten, selbe Komponente wie Anlegen). Ein
  Navigation-Guard prüft vor jedem Routenwechsel den Auth-Status und leitet
  bei fehlender Session zu `/login` um.
- **`stores/auth.js`** (Pinia) – Login/Logout/Registrierung/Passwort-Reset
  sowie der aktuell eingeloggte Nutzer; `fetchCurrentUser()` prüft die
  Session beim App-Start über `GET /api/auth/me`.
- **`api/client.js`** – fetch-Wrapper mit `credentials: 'include'` (nutzt das
  httpOnly-Auth-Cookie) und zentraler `401`-Behandlung (Redirect zu
  `/login`, außer bei der initialen `/auth/me`-Prüfung selbst).
- **`views/LoginView.vue`** – Login-Formular mit Links zu `/registrieren` und
  `/passwort-zuruecksetzen`.
- **`views/RegisterView.vue`** – Registrierung mit Invite-Code, Username und
  Passwort.
- **`views/ResetPasswordView.vue`** – Passwort-Reset mit Reset-Code und neuem
  Passwort (kein Username-Feld, siehe Backend-README).
- **`views/OverviewView.vue`** – lädt Bookings serverseitig (Suche,
  Sortierung, Paging), rendert `BookingTable` und den "Neuer
  Eintrag"-Button, steuert das Lösch-Bestätigungsdialog.
- **`views/EntryFormView.vue`** – wird sowohl für `/eingabe` (Anlegen) als
  auch `/eingabe/:id` (Bearbeiten) verwendet, lädt im Edit-Fall den
  bestehenden Eintrag und rendert `BookingForm`.
- **`components/AppHeader.vue`** – Band-Logo oben links, nur auf Desktop
  sichtbar (`hidden md:flex`).
- **`components/AppFooter.vue`** – dasselbe Logo unten, nur auf Mobile
  sichtbar (`md:hidden`).
- **`components/BookingTable.vue`** – Übersichtstabelle auf Basis von
  `@tanstack/vue-table`: globale Suche (debounced), Spalten-Sortierung,
  Gruppierung, Paging-Steuerung. Spaltenüberschrift für die Gage lautet
  "Gage (€)".
- **`components/BookingForm.vue`** – Eingabemaske, wird von Anlegen und
  Bearbeiten wiederverwendet (per `isEditMode`-Prop gesteuert). Einziges
  Pflichtfeld: Veranstaltungsname. Zwei Submit-Buttons: "Hinzufügen und
  nächster Eintrag" (speichert, setzt das Formular zurück, bleibt auf der
  Seite) und "Hinzufügen und zurück zur Übersicht" (speichert, navigiert zu
  `/`); im Edit-Modus entsprechend "Speichern und ..."-Varianten.
- **`components/FormField.vue`** – generisches Label+Input, wird von
  `BookingForm` für jedes der zehn sichtbaren Felder genutzt (die Metadaten
  `created_by`/`created_at`/`updated_by`/`updated_at` sind kein Formularfeld).
- **`components/ConfirmDialog.vue`** – generischer Lösch-Bestätigungsdialog.

## Bekanntes Verhalten: Gruppierung + serverseitiges Paging

Suche, Sortierung und Paging laufen serverseitig – das Frontend hat zu jedem
Zeitpunkt nur die aktuell geladene Seite (max. 50 Zeilen) im Speicher. Die
Gruppierungs-Funktion von `@tanstack/vue-table` in `BookingTable.vue`
gruppiert deshalb **nur innerhalb der aktuell geladenen Seite**, nicht über
den gesamten Datenbestand. Ein Eintrag, der auf einer anderen Seite liegt,
taucht in der Gruppierung der aktuellen Seite nicht mit auf. Das ist
bewusstes, bekanntes Verhalten und kein Bug.
