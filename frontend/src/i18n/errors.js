import i18n from './index.js';

/**
 * Backend error responses carry a stable code (e.g. "invalid_credentials"),
 * not display text, so it can be shown in whichever language is selected.
 */
export function translateError(code) {
  const key = `errors.${code}`;
  return i18n.global.te(key) ? i18n.global.t(key) : i18n.global.t('errors.unknown_error');
}
