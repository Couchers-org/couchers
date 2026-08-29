// taken from backend, keep in sync with app/backend/src/couchers/constants.py
// Split into two patterns instead of using a lookbehind for the trailing whitespace: Safari before
// 16.4 doesn't support lookbehind assertions and throws "invalid regular expression: invalid group
// specifier name" when the regex literal is evaluated. A name must match both patterns.
export const nameCharactersValidationPattern = /^[\p{L}\p{M}\p{Zs}\p{Pi}\p{Pf}\p{Pd},.'"·・&/|]+$/u;
export const nameNoSurroundingWhitespaceValidationPattern = /^\P{Zs}(?:[\s\S]*\P{Zs})?$/u;
export const nameMinLength = 2;
export const nameMaxLength = 100;

export function validateName(name: string) {
  return nameCharactersValidationPattern.test(name) && nameNoSurroundingWhitespaceValidationPattern.test(name);
}

export const usernameValidationPattern = /^[a-z][0-9a-z_]*[a-z0-9]$/i;
export const validatePassword = (password: string) => {
  return password.length >= 8 && password.length < 256;
};
export const emailValidationPattern =
  /^[0-9a-z]([0-9a-z\-_+]|(\.[0-9a-z\-_+]))*@([0-9a-z-]+\.)*[0-9a-z-]+\.[a-z]{2,}$/i;
export const timePattern = /\d{2}:\d{2}/;

export const profileAboutMeMinLength = 150;

export function validatePastDate(stringDate: string) {
  const date = new Date(stringDate);
  return !isNaN(date.getTime()) && date < new Date();
}

export function lowercaseAndTrimField(name: string) {
  return name.trim().toLowerCase();
}
