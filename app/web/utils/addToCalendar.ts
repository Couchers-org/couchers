import { addToCalendarNatively, isNativeEmbed } from "utils/nativeLink";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // Discard data url prefixes:
      // data:text/calendar;base64,QkVHSU46VkNBTEVOREFS...
      resolve(dataUrl.slice(dataUrl.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);

    // Reads as a data: URL string with the blob contents base64-encoded.
    reader.readAsDataURL(blob);
  });
}

// Adds a calendar file to the user's calendar.
// On web: downloads the .ics file
// On mobile: saves the .ics file and shares it so the user can select their calendar app.
export async function addToCalendar(url: string, filename: string) {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Failed to fetch calendar file: ${response.status}`);
  }
  const blob = await response.blob();

  if (isNativeEmbed()) {
    const base64 = await blobToBase64(blob);
    addToCalendarNatively(base64, filename);
    return;
  }

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
