import { EventsType } from "queryKeys";

export const details = ({ colon = false }: { colon?: boolean } = {}) =>
  `Details${colon ? ":" : ""}`;
export const getExtraAvatarCountText = (count: number) => `+${count}`;

// All events page
export const PAST = "Past";
export const UPCOMING = "Upcoming";
export const allEventsPageTabLabels: Record<EventsType, string> = {
  upcoming: UPCOMING,
  past: PAST,
};
