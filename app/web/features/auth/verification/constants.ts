// Mirrors the backend constants of the same names in
// app/backend/src/couchers/constants.py. Keep the two in sync: these only feed
// explanatory copy, so a stale value misleads rather than breaks anything.
export const GALLERY_MAX_PHOTOS_NOT_VERIFIED = 2;
export const GALLERY_MAX_PHOTOS_VERIFIED = 5;

export const POSTAL_VERIFICATION_CODE_LENGTH = 6;
export const POSTAL_VERIFICATION_MAX_ATTEMPTS = 5;
export const POSTAL_VERIFICATION_CODE_LIFETIME_DAYS = 90;
