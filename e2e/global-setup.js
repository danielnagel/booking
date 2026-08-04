// Verifies that the Docker Compose stack (`docker compose up -d` at the repo
// root) is already running and reachable before any test runs. This suite
// deliberately does not start/stop the stack itself (see plans/
// intial-plan-simple-booking-website-for-bands.md, Testing / E2E section) -
// it only waits a reasonable amount of time for it to become reachable and
// fails with a clear message if it never does.

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost';
const TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 2000;

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default async function globalSetup() {
  const deadline = Date.now() + TIMEOUT_MS;
  let lastError;

  while (Date.now() < deadline) {
    try {
      // Unauthenticated, so a healthy backend answers 401 here - any HTTP
      // response (not a connection error) means the stack is reachable.
      const response = await fetch(`${BASE_URL}/api/auth/me`);
      if (response.status === 401 || response.ok) {
        return;
      }
      lastError = new Error(`Unerwarteter Status ${response.status} von ${BASE_URL}/api/auth/me`);
    } catch (error) {
      lastError = error;
    }

    await wait(POLL_INTERVAL_MS);
  }

  throw new Error(
    `Der Stack unter ${BASE_URL} ist nicht erreichbar. Bitte zuerst "docker compose up -d" ` +
      `am Repo-Root ausfuehren, bevor die E2E-Suite laeuft.\nLetzter Fehler: ${lastError?.message}`,
  );
}
