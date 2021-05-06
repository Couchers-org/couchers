import { CommunityTab } from "routes";

export const communityTabBarLabels: Record<CommunityTab, string> = {
  overview: "Overview",
  "find-host": "Find host",
  events: "Events",
  "local-points": "Local points",
  discussions: "Discussions",
  hangouts: "Hangouts",
};

export const COMMUNITY_HEADING = (name: string) => `Welcome to ${name}!`;
export const COMMUNITY_TABS_A11Y_LABEL = "Tabs for community sub-pages";
export const DISCUSSIONS_EMPTY_STATE = "No discussions at the moment.";
export const DISCUSSIONS_LABEL = "Discussions";
export const DISCUSSIONS_TITLE = "Discussions";
export const ERROR_LOADING_COMMUNITY = "Error loading the community.";
export const EVENTS_EMPTY_STATE = "No events at the moment.";
export const EVENTS_LABEL = "Events";
export const EVENTS_TITLE = "Events";
export const FIND_HOST = "Find host";
export const HANGOUTS_LABEL = "Hangouts";
export const INVALID_COMMUNITY_ID = "Invalid community id.";
export const INVALID_REFERENCE_TYPE = "Invalid reference type";
export const LOCAL_INFO_LABEL = "Local info";
export const MORE_REPLIES = "More replies...";
export const MORE_TIPS = "More tips and information";
export const NEW_POST_LABEL = "New post";
export const OVERVIEW_LABEL = "Overview";
export const PLACES_EMPTY_STATE = "No places to show yet.";
export const PLACES_TITLE = "Places";
export const SEE_MORE_DISCUSSIONS_LABEL = "See more discussions";
export const SEE_MORE_EVENTS_LABEL = "See more events";
export const SEE_MORE_PLACES_LABEL = "See more places";

// REFERENCES:
export const REFERENCE_FORM_HEADING = "You met with ";
export const REFERENCE_TYPE_NOT_AVAILABLE =
  "This reference type is not available for this user.";
export const PRIVATE_ANSWER = "Your answer will remain private and anonymous.";
export const PUBLIC_ANSWER =
  "This will appear publically in the References section of their profile.";
export const NEXT = "Next";

export const APPROPRIATE_EXPLANATION =
  "Awesome –– We hope you had a great time! To help keep our community safe, we want to ask about your interaction with your fellow Coucher.";
export const APPROPRIATE_BEHAVIOR = "Appropriate Behavior";
export const SAFETY_PRIORITY =
  "Your safety is our priority. It is important that you remain comfortable when interacting with others within the Couchers community. Let us know how you felt regarding this person's behavior.";
export const APPROPRIATE_QUESTION =
  "Did you feel safe with this person's behavior?";
export const WAS_APPROPRIATE_REQUIRED =
  "To help us keep our community safe, this question is required.";

export const RATING_EXPLANATION =
  "Please drag the marker to the spot that reflects your experience.";
export const RATING_QUESTION =
  "How would you rate your overall experience with ";
export const QUESTION_MARK = "?";

export const TEXT_EXPLANATION =
  "Leave a note for your fellow Coucher's Guestbook –– say thank you, or let others know if you enjoyed your time with them.";

export const REFERENCE_SUBMIT_HEADING = "Thank you for leaving a reference!";
export const THANK_YOU =
  "We appreciate you taking the time to help us uphold our community values.";
export const REFERENCE_CONFIRM = "You left a review for the following person:";
export const FURTHER =
  "If you have any questions or wish to provide additional information, please contact us";
