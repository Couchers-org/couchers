//these are taken from the backend
export const nameValidationPattern = /\S+/;
export const usernameValidationPattern = /^[a-z][0-9a-z_]*[a-z0-9]$/;

export function validateBirthdate(stringDate: string) {
  return !isNaN(new Date(stringDate).getTime());
}
