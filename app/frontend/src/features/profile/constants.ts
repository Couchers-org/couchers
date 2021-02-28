import { HostingStatus, MeetupStatus, ParkingDetails, SleepingArrangement, SmokingLocation } from "../../pb/api_pb";

export default function booleanConversion(value: boolean | undefined) {
  return value === undefined ? UNSURE : (value ? 'Yes' : 'No');
}

const UNSURE = "Ask me";

export const hostingStatusLabels = {
  [HostingStatus.HOSTING_STATUS_CAN_HOST]: "Can host",
  [HostingStatus.HOSTING_STATUS_MAYBE]: "Can maybe host",
  [HostingStatus.HOSTING_STATUS_CANT_HOST]: "Can't host",
  [HostingStatus.HOSTING_STATUS_UNSPECIFIED]: UNSURE,
  [HostingStatus.HOSTING_STATUS_UNKNOWN]: UNSURE,
};

export const meetupStatusLabels = {
  [MeetupStatus.MEETUP_STATUS_WANTS_TO_MEETUP]: "Wants to meet up",
  [MeetupStatus.MEETUP_STATUS_OPEN_TO_MEETUP]: "Maybe wants to meet up",
  [MeetupStatus.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP]: "Can't meet up",
  [MeetupStatus.MEETUP_STATUS_UNSPECIFIED]: UNSURE,
  [MeetupStatus.MEETUP_STATUS_UNKNOWN]: UNSURE,
};

export const smokingLocationLabels = {
  [SmokingLocation.SMOKING_LOCATION_NO]: "No",
  [SmokingLocation.SMOKING_LOCATION_OUTSIDE]: "Outside",
  [SmokingLocation.SMOKING_LOCATION_WINDOW]: "Window",
  [SmokingLocation.SMOKING_LOCATION_YES]: "Yes",
  [SmokingLocation.SMOKING_LOCATION_UNKNOWN]: UNSURE,
  [SmokingLocation.SMOKING_LOCATION_UNSPECIFIED]: UNSURE,
};

export const sleepingArrangementLabels = {
  [SleepingArrangement.SLEEPING_ARRANGEMENT_UNSPECIFIED]: UNSURE,
  [SleepingArrangement.SLEEPING_ARRANGEMENT_UNKNOWN]: UNSURE,
  [SleepingArrangement.SLEEPING_ARRANGEMENT_PRIVATE]: "Private",
  [SleepingArrangement.SLEEPING_ARRANGEMENT_COMMON]: "Common",
  [SleepingArrangement.SLEEPING_ARRANGEMENT_SHARED_ROOM]: "Shared room",
  [SleepingArrangement.SLEEPING_ARRANGEMENT_SHARED_SPACE]: "Shared space",
}

export const parkingDetailsLabels = {
  [ParkingDetails.PARKING_DETAILS_UNSPECIFIED]: UNSURE,
  [ParkingDetails.PARKING_DETAILS_UNKNOWN]: UNSURE,
  [ParkingDetails.PARKING_DETAILS_FREE_ONSITE]: "Free onsite parking",
  [ParkingDetails.PARKING_DETAILS_FREE_OFFSITE]: "Free offsite parking",
  [ParkingDetails.PARKING_DETAILS_PAID_ONSITE]: "Paid onsite parking",
  [ParkingDetails.PARKING_DETAILS_PAID_OFFSITE]: "Paid offsite parking",
}