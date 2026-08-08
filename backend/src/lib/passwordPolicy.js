// A stable error code, not display text - the frontend translates it based
// on the selected UI language (see frontend/src/i18n/errors.js).
export const PASSWORD_POLICY_ERROR_CODE = 'invalid_password_policy';

export function isPasswordValid(password) {
  if (typeof password !== 'string' || password.length < 12) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}
