// Web URLs carry a locale prefix (/de/messages), mobile routes and notification links don't
export function stripLocalePrefix(path: string): string {
  return path.replace(/^\/[a-z]{2,3}(-[A-Za-z0-9]+)?\//, "/");
}
