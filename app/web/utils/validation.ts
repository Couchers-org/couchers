// taken from backend
export const NAME_VALIDATION_PATTERN = /\S+/;
export const USERNAME_VALIDATION_PATTERN = /^[a-z][0-9a-z_]*[a-z0-9]$/i;
export const validatePassword = (password: string) => {
  return password.length >= 8 && password.length < 256;
};
export const EMAIL_VALIDATION_PATTERN =
  /^[0-9a-z][0-9a-z\-_+.]*@([0-9a-z-]+\.)*[0-9a-z-]+\.[a-z]{2,}$/i;
export const TIME_PATTERN = /\d{2}:\d{2}/;

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
