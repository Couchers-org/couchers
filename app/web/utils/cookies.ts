/**
 * Reads a cookie by name, returning undefined if it isn't set or there's no document (SSR).
 */
export function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;

  const prefix = `${name}=`;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(prefix))
    ?.slice(prefix.length);
}
