import {
  HostingStatus,
  MeetupStatus,
  ParkingDetails,
  SleepingArrangement,
  SmokingLocation,
  User,
} from "proto/api_pb";
import { ReferenceType } from "proto/references_pb";
import { t as tFunction } from "test/utils";
import { firstName } from "utils/names";

export const ACCEPTING = "Can host";
export const MAYBE_ACCEPTING = "May host";
export const NOT_ACCEPTING = "Can't host";

export const MEETUP = "Wants to meet";
export const MAYBE_MEETUP = "Open to meet";
export const NO_MEETUP = "Can't meet";

export const UNSURE = "Ask me";

// Profile
export const ABOUT_ME = "About Me";
export const AGE_GENDER = "Age / Gender";
export const COMMUNITY_STANDING = "Community Standing";
export const COMMUNITY_STANDING_DESCRIPTION =
  "Community Standing description text";
export const EDIT = "Edit";
export const EDIT_PROFILE = "Edit profile";
export const EDUCATION = "Education";
export const HOME = "My Home";
export const HOMETOWN = "Grew up in";
export const HOSTING_STATUS = "Hosting status";
export const JOINED = "Coucher since";
export const LANGUAGES_CONVERSATIONAL = "Conversational in";
export const LANGUAGES_FLUENT = "Fluent languages";
export const LAST_ACTIVE = "Last active";
export const LOCAL_TIME = "Local time";
export const OCCUPATION = "Occupation";
export const REFERENCES = "References";
export const SEND_REQUEST_SUCCESS = "Request sent!";
export const VERIFICATION_SCORE = "Verification Score";
export const VERIFICATION_SCORE_DESCRIPTION =
  "Verification Score description text";

export const SECTION_LABELS = {
  about: ABOUT_ME,
  home: HOME,
  references: REFERENCES,
};
export const SECTION_LABELS_A11Y_TEXT = "tabs for user's details";

// User reporting
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
export const REFERENCE_FORM_HEADING_FRIEND = "You met with ";
export const REFERENCE_FORM_HEADING_HOSTED = "You hosted ";
export const REFERENCE_FORM_HEADING_SURFED = "You surfed with ";
export const REFERENCE_MOBILE_USER =
  "You are writing a reference for the following person:";
export const REFERENCE_SUBMIT_HEADING = "Thank you for leaving a reference!";
export const REFERENCE_SUCCESS = "Successfully wrote the reference!";
export const REFERENCE_TYPE_NOT_AVAILABLE =
  "This reference type is not available for this user.";
export const REQUIRED = "This step is required.";
export const SAFETY_PRIORITY =
  "Your safety is our priority. It is important that you remain comfortable when interacting with others within the Couchers community. Let us know how you felt regarding this person's behavior.";
export const SUBMIT = "Submit";
export const TEXT_EXPLANATION =
  "Leave a note for your fellow Coucher's Guestbook –– say thank you, or let others know if you enjoyed your time with them.";
export const THANK_YOU =
  "We appreciate you taking the time to help us uphold our community values. Please look over your reference before submitting it.";
export const WAS_APPROPRIATE_REQUIRED =
  "To help us keep our community safe, this question is required.";

export const smokingLocationLabels = (t: typeof tFunction) => ({
  [SmokingLocation.SMOKING_LOCATION_NO]: t("profile:smoking_location.no"),
  [SmokingLocation.SMOKING_LOCATION_OUTSIDE]: t(
    "profile:smoking_location.outside"
  ),
  [SmokingLocation.SMOKING_LOCATION_WINDOW]: t(
    "profile:smoking_location.window"
  ),
  [SmokingLocation.SMOKING_LOCATION_YES]: t("profile:smoking_location.yes"),
  [SmokingLocation.SMOKING_LOCATION_UNKNOWN]: t("profile:unspecified_info"),
  [SmokingLocation.SMOKING_LOCATION_UNSPECIFIED]: t("profile:unspecified_info"),
});

export const hostingStatusLabels = (t: typeof tFunction) => ({
  [HostingStatus.HOSTING_STATUS_CAN_HOST]: t("profile:hosting_status.can_host"),
  [HostingStatus.HOSTING_STATUS_MAYBE]: t("profile:hosting_status.maybe"),
  [HostingStatus.HOSTING_STATUS_CANT_HOST]: t(
    "profile:hosting_status.cant_host"
  ),
  [HostingStatus.HOSTING_STATUS_UNSPECIFIED]: t("profile:unspecified_info"),
  [HostingStatus.HOSTING_STATUS_UNKNOWN]: t("profile:unspecified_info"),
});

export const meetupStatusLabels = (t: typeof tFunction) => ({
  [MeetupStatus.MEETUP_STATUS_WANTS_TO_MEETUP]: t(
    "profile:meetup_status.wants_to_meetup"
  ),
  [MeetupStatus.MEETUP_STATUS_OPEN_TO_MEETUP]: t(
    "profile:meetup_status.open_to_meetup"
  ),
  [MeetupStatus.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP]: t(
    "profile:meetup_status.does_not_want_to_meetup"
  ),
  [MeetupStatus.MEETUP_STATUS_UNSPECIFIED]: t("profile:unspecified_info"),
  [MeetupStatus.MEETUP_STATUS_UNKNOWN]: t("profile:unspecified_info"),
});

export const sleepingArrangementLabels = (t: typeof tFunction) => ({
  [SleepingArrangement.SLEEPING_ARRANGEMENT_PRIVATE]: t(
    "profile:sleeping_arrangement.private"
  ),
  [SleepingArrangement.SLEEPING_ARRANGEMENT_COMMON]: t(
    "profile:sleeping_arrangement.common"
  ),
  [SleepingArrangement.SLEEPING_ARRANGEMENT_SHARED_ROOM]: t(
    "profile:sleeping_arrangement.shared_room"
  ),
  [SleepingArrangement.SLEEPING_ARRANGEMENT_SHARED_SPACE]: t(
    "profile:sleeping_arrangement.shared_space"
  ),
  [SleepingArrangement.SLEEPING_ARRANGEMENT_UNSPECIFIED]: t(
    "profile:unspecified_info"
  ),
  [SleepingArrangement.SLEEPING_ARRANGEMENT_UNKNOWN]: t(
    "profile:unspecified_info"
  ),
});

export const parkingDetailsLabels = (t: typeof tFunction) => ({
  [ParkingDetails.PARKING_DETAILS_FREE_ONSITE]: t(
    "profile:parking_details.free_onsite"
  ),
  [ParkingDetails.PARKING_DETAILS_FREE_OFFSITE]: t(
    "profile:parking_details.free_offsite"
  ),
  [ParkingDetails.PARKING_DETAILS_PAID_ONSITE]: t(
    "profile:parking_details.paid_onsite"
  ),
  [ParkingDetails.PARKING_DETAILS_PAID_OFFSITE]: t(
    "profile:parking_details.paid_offsite"
  ),
  [ParkingDetails.PARKING_DETAILS_UNSPECIFIED]: t("profile:unspecified_info"),
  [ParkingDetails.PARKING_DETAILS_UNKNOWN]: t("profile:unspecified_info"),
});

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

// Make Request
export const sendRequest = (name: string) => `Send ${name} a request`;
export const ARRIVAL_DATE = "Arrival Date";
export const DEPARTURE_DATE = "Departure Date";
export const MEETUP_ONLY = "Meet up only";
export const OVERNIGHT_STAY = "Overnight stay";
export const REQUEST = "Request";
export const REQUEST_DESCRIPTION =
  "Share your plans for the visit and include why you're requesting to stay with this particular host";
export const STAY_TYPE_A11Y_TEXT = "stay type";

// Edit Profile
export const ACCOUNT_SETTINGS = "Account Settings";
export const REGIONS_VISITED = "Regions I've Visited";
export const REGIONS_LIVED = "Regions I've Lived In";
export const WOMAN = "Woman";
export const WOMAN_PRONOUNS = "she / her";
export const GENDER = "Gender";
export const LANGUAGES_SPOKEN = "Languages I speak";
export const MAN = "Man";
export const MAN_PRONOUNS = "he / him";
export const MEETUP_STATUS = "Meetup status";
export const NAME = "Name";
export const PRONOUNS = "Pronouns";
export const SAVE = "Save";

// About Me
export const ADDITIONAL = "Additional information";
export const FAVORITES = "Favorites";
export const HOBBIES = "What I do in my free time";
export const LIVED_IN = "Lived in";
export const MEDIA = "Art, Books, Movies, and Music I like";
export const MISSION = "Current mission";
export const OVERVIEW = "Overview";
export const PHOTOS = "Photos";
export const STORY = "My favorite hosting or travel story";
export const TRAVELED_TO = "Traveled to";
export const TRAVELS = "My travels";
export const WHO = "Who I am";
export const WHY = "Why I use Couchers";

// Home
export const ABOUT_HOME = "About my home";
export const ACCEPT_DRINKING = "Accept drinking";
export const ACCEPT_PETS = "Accept pets";
export const ACCEPT_SMOKING = "Accept smoking";
export const ACCEPT_KIDS = "Accept children";
export const ACCEPT_CAMPING = "Accept Camping";
export const GENERAL = "General";
export const HAS_HOUSEMATES = "Has housemates";
export const HOST_DRINKING = "Drinks at home";
export const HOST_KIDS = "Has children";
export const HOST_PETS = "Has pets";
export const HOST_SMOKING = "Smokes at home";
export const HOSTING_PREFERENCES = "Hosting Preferences";
export const HOUSE_RULES = "House rules";
export const HOUSEMATES = "Housemates";
export const HOUSEMATE_DETAILS = "Housemate details";
export const KID_DETAILS = "Children details";
export const LAST_MINUTE = "Last-minute requests";
export const LOCAL_AREA = "Local area information";
export const MAX_GUESTS = "Max # of guests";
export const MY_HOME = "My home";
export const PARKING = "Parking available";
export const PARKING_DETAILS = "Parking details";
export const PET_DETAILS = "Pet details";
export const SLEEPING_ARRANGEMENT = "Sleeping arrangement";
export const SPACE = "Private / shared space";
export const TRANSPORTATION = "Transportation, Parking, Accessibility";
export const WHEELCHAIR = "Wheelchair accessible";
