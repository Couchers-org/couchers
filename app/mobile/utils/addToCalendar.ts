import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

// Writes the base64-encoded .ics content (already fetched by the web app, which has the user's
// session cookies) to a cache file and hands it to the OS share sheet so the user can add it to
// their calendar.
export async function addToCalendar(base64: string, filename: string) {
  const file = new File(Paths.cache, filename);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(base64, { encoding: "base64" });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: "text/calendar", UTI: "text/calendar" });
  }
}
