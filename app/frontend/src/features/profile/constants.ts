import {
  HostingStatus,
  MeetupStatus,
  ParkingDetails,
  SleepingArrangement,
  SmokingLocation,
  User,
} from "pb/api_pb";
import { ReferenceType } from "pb/references_pb";
import { firstName } from "utils/names";

export const ACCEPTING = "Accepting guests";
export const MAYBE_ACCEPTING = "Maybe accepting guests";
export const NOT_ACCEPTING = "Not accepting guests";

export const MEETUP = "Wants to meet up";
export const MAYBE_MEETUP = "Open to meeting up";
export const NO_MEETUP = "Cannot meet up";

const UNSURE = "Ask me";

// User reporting
export const CANCEL = "Cancel";
export const MORE_PROFILE_ACTIONS = "...";
export const MORE_PROFILE_ACTIONS_A11Y_TEXT = "More profile actions";
export const REPORT_DETAILS = "Details";
export const REPORT_REASON = "Reason";
export const REPORT_USER = "Report this user";
export const SEND = "Send";

export const getReportDialogTitle = (name: string) => `Report ${name}`;
export const getReportUserExplainer = (name: string) =>
  `You can anonymously report ${name} to moderators. Give as much details as you can and are comfortable with.`;
export const getReportUserSuccessMessage = (name: string) =>
  `${name} has been reported to the Couchers safety team`;

// References
export const REFERENCES_FILTER_A11Y_LABEL = "Show references: ";
export const referencesFilterLabels = {
  [ReferenceType.REFERENCE_TYPE_FRIEND]: "From friends",
  [ReferenceType.REFERENCE_TYPE_HOSTED]: "From hosts",
  [ReferenceType.REFERENCE_TYPE_SURFED]: "From guests",
  all: "All references",
  given: "Given to others",
};
export const referenceBadgeLabel = {
  [ReferenceType.REFERENCE_TYPE_FRIEND]: "Friend",
  [ReferenceType.REFERENCE_TYPE_HOSTED]: "Hosted",
  [ReferenceType.REFERENCE_TYPE_SURFED]: "Guest",
};
export const NO_REFERENCES = "No references of this kind yet!";
export const getReferencesGivenHeading = (name: string) =>
  `References ${name} wrote`;

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
  [HostingStatus.HOSTING_STATUS_UNSPECIFIED]: `${UNSURE} about hosting`,
  [HostingStatus.HOSTING_STATUS_UNKNOWN]: `${UNSURE} about hosting`,
};

export const meetupStatusLabels = {
  [MeetupStatus.MEETUP_STATUS_WANTS_TO_MEETUP]: MEETUP,
  [MeetupStatus.MEETUP_STATUS_OPEN_TO_MEETUP]: MAYBE_MEETUP,
  [MeetupStatus.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP]: NO_MEETUP,
  [MeetupStatus.MEETUP_STATUS_UNSPECIFIED]: `${UNSURE} about meeting up`,
  [MeetupStatus.MEETUP_STATUS_UNKNOWN]: `${UNSURE} about meeting up`,
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

export const aboutText = (user: User.AsObject) => {
  const missingAbout = user.aboutMe.length === 0;
  return missingAbout
    ? `${firstName(user?.name)} hasn't said anything about themselves yet`
    : user.aboutMe.length < 300
    ? user.aboutMe
    : user.aboutMe.substring(0, 300) + "...";
};

export const LAST_ACTIVE_FALSE = "Unknown";
export const LANGUAGES_FLUENT_FALSE = "Not given";
export const MESSAGE = "Message";
