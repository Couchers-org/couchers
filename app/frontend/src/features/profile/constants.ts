import { HostingStatus, MeetupStatus, SmokingLocation } from "../../pb/api_pb";
import BiDirectionalMap from "./utils/BidirectionalMap";

export const ACCEPTING = "Accepting guests";
export const MAYBE_ACCEPTING = "Maybe accepting guests";
export const NOT_ACCEPTING = "Not accepting guests";

export const MEETUP = "Wants to meet up";
export const MAYBE_MEETUP = "Open to meeting up";
export const NO_MEETUP = "Cannot meet up";

export const smokingLocationLabels = {
  [SmokingLocation.SMOKING_LOCATION_NO]: "No",
  [SmokingLocation.SMOKING_LOCATION_OUTSIDE]: "Outside",
  [SmokingLocation.SMOKING_LOCATION_WINDOW]: "Window",
  [SmokingLocation.SMOKING_LOCATION_YES]: "Yes",
  [SmokingLocation.SMOKING_LOCATION_UNKNOWN]: "",
  [SmokingLocation.SMOKING_LOCATION_UNSPECIFIED]: "Unspecified",
};

export const hostingStatusLabels = new BiDirectionalMap<HostingStatus, string>([
  [HostingStatus.HOSTING_STATUS_CAN_HOST, ACCEPTING],
  [HostingStatus.HOSTING_STATUS_MAYBE, MAYBE_ACCEPTING],
  [HostingStatus.HOSTING_STATUS_CANT_HOST, NOT_ACCEPTING],
  [HostingStatus.HOSTING_STATUS_UNSPECIFIED, "Blank hosting ability"],
  [HostingStatus.HOSTING_STATUS_UNKNOWN, "Unknown hosting ability"],
]);

export const meetupStatusLabels = new BiDirectionalMap<MeetupStatus, string>([
  [MeetupStatus.MEETUP_STATUS_WANTS_TO_MEETUP, MEETUP],
  [MeetupStatus.MEETUP_STATUS_OPEN_TO_MEETUP, MAYBE_MEETUP],
  [MeetupStatus.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP, NO_MEETUP],
  [MeetupStatus.MEETUP_STATUS_UNSPECIFIED, "Blank meetup ability"],
  [MeetupStatus.MEETUP_STATUS_UNKNOWN, "Unknown meetup ability"],
]);
