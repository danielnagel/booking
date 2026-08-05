export const PASSWORD_POLICY_MESSAGE =
  'Passwort muss mindestens 12 Zeichen sowie Groß-/Kleinschreibung, eine Zahl und ein Sonderzeichen enthalten.';

export function isPasswordValid(password) {
  if (typeof password !== 'string' || password.length < 12) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}
