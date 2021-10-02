import {
  HostingStatus,
  MeetupStatus,
  ParkingDetails,
  SleepingArrangement,
  SmokingLocation,
  User,
} from "proto/api_pb";
import { ReferenceType } from "proto/references_pb";
import { firstName } from "utils/names";

export const ACCEPTING = "Can host";
export const MAYBE_ACCEPTING = "May host";
export const NOT_ACCEPTING = "Can't host";

export const MEETUP = "Wants to meet";
export const MAYBE_MEETUP = "Open to meet";
export const NO_MEETUP = "Can't meet";

export const UNSURE = "Ask me";

// User reporting
export const CANCEL = "Cancel";
export const MORE_PROFILE_ACTIONS = "...";
export const MORE_PROFILE_ACTIONS_A11Y_TEXT = "More profile actions";
export const REPORT_DETAILS = "Details";
export const REPORT_REASON = "Reason";
export const REPORT_USER = "Report this user";
export const SEND = "Send";

// Friend Requests
export const ACCEPT_FRIEND_ACTION = "Accept";
export const ACCEPT_FRIEND_LABEL = "Accept friend request";
export const DECLINE_FRIEND_ACTION = "Decline";
export const DECLINE_FRIEND_LABEL = "Decline friend request";

// References:
// Viewing References
export const NO_REFERENCES = "No references of this kind yet!";
export const REFERENCES_FILTER_A11Y_LABEL = "Show references: ";
export const SEE_MORE_REFERENCES = "See more references";
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
export const WRITE_REFERENCE = "Write Reference";

// Giving References
export const APPROPRIATE_BEHAVIOR = "Appropriate Behavior";
export const APPROPRIATE_EXPLANATION =
  "Awesome –– We hope you had a great time! To help keep our community safe, we want to ask about your interaction with your fellow Coucher.";
export const APPROPRIATE_QUESTION =
  "Did you feel safe with this person's behavior?";
export const CONTACT_LINK = "mailto:support@couchers.org";
export const CONTACT_US = "contact us here.";
export const COUCHER_WAS_APPROPRIATE =
  "Yes, this person's behavior was appropriate.";
export const COUCHER_WAS_NOT_APPROPRIATE =
  "No, this person's behavior was not appropriate.";
export const FURTHER =
  "If you have any questions or wish to provide additional information, please don't hesitate to ";
export const HOST_REQUEST_REFERENCE_SUCCESS_DIALOG =
  "host-request-reference-success-dialog";
export const HOST_REQUEST_REFERENCE_EXPLANATION =
  "Host request references are only made visible once both references have been written, or after 2 weeks. Hold tight!";
export const INVALID_REFERENCE_TYPE = "Invalid reference type";
export const INVALID_STEP = "Invalid form step";
export const NEXT = "Next";
export const OKAY = "Okay";
export const PREVIOUS_STEP = "Previous step";
export const PRIVATE_ANSWER =
  "Your answer will not be seen by the other person, and will remain private.";
export const PRIVATE_REFERENCE =
  "You will also submit the following private answers:";
export const PUBLIC_ANSWER =
  "This will appear publicly in the References section of their profile.";
export const PUBLIC_REFERENCE =
  "You are leaving the following reference on your fellow Coucher's Guestbook:";
export const RATING = "Your experience made you feel like ";
export const RATING_EXPLANATION = `- **Negative:** You did not enjoy this person's company.
- **Neutral:** You didn't have strong feelings either way about this person. Their community standing will not be affected.
- **Positive:** You had a wonderful time with this person. This will improve their community standing.
- **Amazing:** This person exceeded all your expectations and is an asset to the Couchers community.`;
export const RATING_HOW = "How should I rate my experience?";
export const RATING_QUESTION =
  "How would you rate your overall experience with";
export const getRatingQuestion = (name: string) =>
  `${RATING_QUESTION} ${name}?`;
export const RATING_STEP = "rating";
export const REFERENCE_FORM_HEADING_FRIEND = "You met with ";
export const REFERENCE_FORM_HEADING_HOSTED = "You hosted ";
export const REFERENCE_FORM_HEADING_SURFED = "You surfed with ";
export const REFERENCE_MOBILE_USER =
  "You are writing a reference for the following person:";
export const REFERENCE_SUBMIT_HEADING = "Thank you for leaving a reference!";
export const REFERENCE_STEP = "reference";
export const REFERENCE_SUCCESS = "Successfully wrote the reference!";
export const REFERENCE_TYPE_NOT_AVAILABLE =
  "This reference type is not available for this user.";
export const REQUIRED = "This step is required.";
export const SAFETY_PRIORITY =
  "Your safety is our priority. It is important that you remain comfortable when interacting with others within the Couchers community. Let us know how you felt regarding this person's behavior.";
export const SUBMIT = "Submit";
export const SUBMIT_STEP = "submit";
export const TEXT_EXPLANATION =
  "Leave a note for your fellow Coucher's Guestbook –– say thank you, or let others know if you enjoyed your time with them.";
export const THANK_YOU =
  "We appreciate you taking the time to help us uphold our community values. Please look over your reference before submitting it.";
export const WAS_APPROPRIATE_REQUIRED =
  "To help us keep our community safe, this question is required.";

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
