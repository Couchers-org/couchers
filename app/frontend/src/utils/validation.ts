//these are taken from the backend
export const nameValidationPattern = /\S+/;
export const usernameValidationPattern = /^[a-z][0-9a-z_]*[a-z0-9]$/;

export function validatePastDate(stringDate: string) {
  const date = new Date(stringDate);
  return !isNaN(date.getTime()) && date < new Date();
}

export function validateFutureDate(stringDate: string) {
  const date = new Date(stringDate);
  return !isNaN(date.getTime()) && date >= new Date();
}

export function sanitizeName(name: string) {
  return name.trim().toLowerCase();
}
