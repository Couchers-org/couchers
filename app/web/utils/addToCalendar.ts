import { Event } from "proto/events_pb";
import { useCallback } from "react";
import { routeToEvent } from "routes";
import { timestampToInstant } from "utils/date";
import { sendNativeAddToCalendar, useIsNativeEmbed } from "utils/nativeLink";
import stripMarkdown from "utils/stripMarkdown";

// Downloads the event's .ics file
async function downloadCalendarFile(event: Event.AsObject) {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${event.eventId}/calendar`;
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Failed to fetch calendar file: ${response.status}`);
  }
  const blob = await response.blob();

  const blobUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${event.slug || "event"}.ics`;
    link.click();
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

// Returns a function that adds an event to the user's calendar.
// In the native app: asks the app to add it. On web: downloads the event's .ics file.
export function useAddToCalendar() {
  const isNativeEmbed = useIsNativeEmbed();

  return useCallback(
    async (event: Event.AsObject) => {
      if (!isNativeEmbed) {
        return downloadCalendarFile(event);
      }
      const url = `${window.location.origin}${routeToEvent(event.eventId, event.slug)}`;
      sendNativeAddToCalendar({
        title: event.title,
        startDate: timestampToInstant(event.startTime!).toString(),
        endDate: timestampToInstant(event.endTime!).toString(),
        timeZone: event.timezone,
        location: event.location?.address ?? "",
        url,
        // Same as the .ics description. Android has no URL field
        notes: `${stripMarkdown(event.content)}\n\n${url}`,
      });
    },
    [isNativeEmbed],
  );
}
