import { Event } from "proto/events_pb";

/**
 * Calculates the total count of attendees (going + maybe)
 * @param event - The event object with goingCount and maybeCount
 * @returns The total attendee count
 */
export function getAttendeeCount(event: Event.AsObject): number {
  return event.goingCount + event.maybeCount;
}
