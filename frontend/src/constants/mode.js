// Set at container startup from the MODE env var, see
// frontend/docker-entrypoint.d/41-mode-config.sh.
export function isDemoMode() {
  return window.__APP_MODE__ === 'demo';
}
