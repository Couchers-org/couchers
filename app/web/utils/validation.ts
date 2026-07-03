// taken from backend
export const nameValidationPattern =
  /^(?!\p{Zs})[\p{L}\p{M}\p{Zs}\p{Pi}\p{Pf}\p{Pd},.'"·・&/|]+(?<!\p{Zs})$/u;
export const nameMinLength = 2;
export const nameMaxLength = 100;
export const usernameValidationPattern = /^[a-z][0-9a-z_]*[a-z0-9]$/i;
export const validatePassword = (password: string) => {
  return password.length >= 8 && password.length < 256;
};
export const emailValidationPattern =
  /^[0-9a-z]([0-9a-z\-_+]|(\.[0-9a-z\-_+]))*@([0-9a-z-]+\.)*[0-9a-z-]+\.[a-z]{2,}$/i;
export const timePattern = /\d{2}:\d{2}/;

export function validatePastDate(stringDate: string) {
  const date = new Date(stringDate);
  return !isNaN(date.getTime()) && date < new Date();
}

export function lowercaseAndTrimField(name: string) {
  return name.trim().toLowerCase();
}
