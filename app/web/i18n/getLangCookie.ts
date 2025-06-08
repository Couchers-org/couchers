export function getLangCookie() {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("couchers-preferred-language="));
  return match?.split("=")[1] || "en";
}
