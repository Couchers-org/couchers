// Adds a calendar file to the user's calendar.
// On web: downloads the .ics file
// TODO(#9226): Mobile implementation (isNativeEmbed)
export async function addToCalendar(url: string, filename: string) {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Failed to fetch calendar file: ${response.status}`);
  }
  const blob = await response.blob();

  const blobUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    link.click();
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
