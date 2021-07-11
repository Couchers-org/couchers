// taken from backend
export const nameValidationPattern = /\S+/;
export const usernameValidationPattern = /^[a-z][0-9a-z_]*[a-z0-9]$/;
export const emailValidationPattern =
  /^[0-9a-z][0-9a-z\-_+.]*@([0-9a-z-]+\.)*[0-9a-z-]+\.[a-z]{2,}$/;

export function validatePastDate(stringDate: string) {
  const date = new Date(stringDate);
  return !isNaN(date.getTime()) && date < new Date();
}

export function validateFutureDate(stringDate: string) {
  const date = new Date(stringDate);
  return !isNaN(date.getTime()) && date >= new Date();
}

export function lowercaseAndTrimField(name: string) {
  return name.trim().toLowerCase();
}
