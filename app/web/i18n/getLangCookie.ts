export function getLangCookie() {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("NEXT_LOCALE="));
  return match?.split("=")[1] || "en";
}
