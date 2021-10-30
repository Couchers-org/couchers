import { EventsType } from "queryKeys";

export const ATTENDEES = "Attendees";
export const details = ({ colon = false }: { colon?: boolean } = {}) =>
  `Details${colon ? ":" : ""}`;
export const CREATE_AN_EVENT = "Create an event";
export const CREATE_EVENT = "Create event";
export const CREATE_EVENT_DISCLAIMER =
  "By selecting this button, your event will be publicly displayed for the Couchers.org community to see.";
export const DATE_REQUIRED = "Please enter a date.";
export const EDIT_EVENT = "Edit event";
export const END_DATE = "End date";
export const END_TIME = "End time";
export const END_TIME_ERROR =
  "The event end time must be after the start time.";
export const EVENT_DETAILS = "Event details";
export const EVENT_DETAILS_REQUIRED = "Please fill in the event details field.";
export const EVENT_DISCUSSION = "Event discussion";
export const EVENT_IMAGE_INPUT_ALT = "Event image input";
export const EVENT_LINK = "Event link";
export const EVENTS_EMPTY_STATE = "No events at the moment.";
export const EVENTS_LABEL = "Events";
export const EVENTS_TITLE = "Events";
export const getExtraAvatarCountText = (count: number) => `+${count}`;
export const INVALID_TIME = "Time must be in 24-hour format HH:MM.";
export const JOIN_EVENT = "Join event";
export const LEAVE_EVENT = "Leave event";
export const LINK_REQUIRED = "Please provide a meeting link for the event.";
export const LOAD_MORE_ATTENDEES = "Load more attendees";
export const LOAD_MORE_ORGANIZERS = "Load more organizers";
export const LOCATION = "Location";
export const LOCATION_REQUIRED = "Please provide a location for the event.";
export const NO_ATTENDEES = "There isn't anyone attending this event yet!";
export const NO_ORGANIZERS = "There are no organizers for the event.";
export const ORGANIZERS = "Organizers";
export const PAST_DATE_ERROR =
  "The given date must be the same as today or in the future.";
export const PAST_TIME_ERROR = "The given time must be in the future.";
export const SEE_ALL = "See all";
export const SEE_MORE_EVENTS_LABEL = "See more events";
export const SHOW_ALL_EVENTS = "Show all events";
export const START_DATE = "Start date";
export const START_TIME = "Start time";
export const TITLE_REQUIRED = "Please provide a title for the event.";
export const UPLOAD_HELPER_TEXT = "Click to begin uploading an image";
export const VIEW_DETAILS_FOR_LINK = "View details for link";
export const VIRTUAL_EVENT = "Virtual event";
export const VIRTUAL_EVENT_LINK = "Event link";
export const VIRTUAL_EVENTS_SUBTEXT =
  "Virtual events will be added to the global community.";

// All events page
export const PAST = "Past";
export const UPCOMING = "Upcoming";
export const allEventsPageTabLabels: Record<EventsType, string> = {
  upcoming: UPCOMING,
  past: PAST,
};
export const ALL_EVENTS_PAGE_TABS_A11Y_LABEL =
  "Tabs for the events listing page";
export const DISCOVER_EVENTS_SUBTITLE =
  "Check out upcoming and future events hosted by Couchers.org community members!";
export const DISCOVER_EVENTS_TITLE = "Discover Couchers.org events";
