import {
  HostingStatus,
  MeetupStatus,
  ParkingDetails,
  SleepingArrangement,
  SmokingLocation,
} from "pb/api_pb";

export const ACCEPTING = "Accepting guests";
export const MAYBE_ACCEPTING = "Maybe accepting guests";
export const NOT_ACCEPTING = "Not accepting guests";

export const MEETUP = "Wants to meet up";
export const MAYBE_MEETUP = "Open to meeting up";
export const NO_MEETUP = "Cannot meet up";

const UNSURE = "Ask me";

export const smokingLocationLabels = {
  [SmokingLocation.SMOKING_LOCATION_NO]: "No",
  [SmokingLocation.SMOKING_LOCATION_OUTSIDE]: "Outside",
  [SmokingLocation.SMOKING_LOCATION_WINDOW]: "Window",
  [SmokingLocation.SMOKING_LOCATION_YES]: "Yes",
  [SmokingLocation.SMOKING_LOCATION_UNKNOWN]: UNSURE,
  [SmokingLocation.SMOKING_LOCATION_UNSPECIFIED]: UNSURE,
};

export const hostingStatusLabels = {
  [HostingStatus.HOSTING_STATUS_CAN_HOST]: ACCEPTING,
  [HostingStatus.HOSTING_STATUS_MAYBE]: MAYBE_ACCEPTING,
  [HostingStatus.HOSTING_STATUS_CANT_HOST]: NOT_ACCEPTING,
  [HostingStatus.HOSTING_STATUS_UNSPECIFIED]: UNSURE,
  [HostingStatus.HOSTING_STATUS_UNKNOWN]: UNSURE,
};

export const meetupStatusLabels = {
  [MeetupStatus.MEETUP_STATUS_WANTS_TO_MEETUP]: MEETUP,
  [MeetupStatus.MEETUP_STATUS_OPEN_TO_MEETUP]: MAYBE_MEETUP,
  [MeetupStatus.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP]: NO_MEETUP,
  [MeetupStatus.MEETUP_STATUS_UNSPECIFIED]: UNSURE,
  [MeetupStatus.MEETUP_STATUS_UNKNOWN]: UNSURE,
};

export const sleepingArrangementLabels = {
  [SleepingArrangement.SLEEPING_ARRANGEMENT_UNSPECIFIED]: UNSURE,
  [SleepingArrangement.SLEEPING_ARRANGEMENT_UNKNOWN]: UNSURE,
  [SleepingArrangement.SLEEPING_ARRANGEMENT_PRIVATE]: "Private",
  [SleepingArrangement.SLEEPING_ARRANGEMENT_COMMON]: "Common",
  [SleepingArrangement.SLEEPING_ARRANGEMENT_SHARED_ROOM]: "Shared room",
  [SleepingArrangement.SLEEPING_ARRANGEMENT_SHARED_SPACE]: "Shared space",
};

export const parkingDetailsLabels = {
  [ParkingDetails.PARKING_DETAILS_UNSPECIFIED]: UNSURE,
  [ParkingDetails.PARKING_DETAILS_UNKNOWN]: UNSURE,
  [ParkingDetails.PARKING_DETAILS_FREE_ONSITE]: "Free onsite parking",
  [ParkingDetails.PARKING_DETAILS_FREE_OFFSITE]: "Free offsite parking",
  [ParkingDetails.PARKING_DETAILS_PAID_ONSITE]: "Paid onsite parking",
  [ParkingDetails.PARKING_DETAILS_PAID_OFFSITE]: "Paid offsite parking",
};

export default function booleanConversion(value: boolean | undefined) {
  return value === undefined ? UNSURE : value ? "Yes" : "No";
}

export const referencesQueryStaleTime = 10 * 60 * 1000;
