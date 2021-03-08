import { ReferenceType } from "pb/api_pb";

// Profile Overview
export const COMMUNITY_STANDING = "Community Standing";
export const COMMUNITY_STANDING_DESCRIPTION =
  "Community Standing description text";
export const EDIT_PROFILE = "Edit profile";
export const LAST_ACTIVE = "Last active";
export const REFERENCES = "References";
export const VERIFICATION_SCORE = "Verification Score";
export const VERIFICATION_SCORE_DESCRIPTION =
  "Verification Score description text";

// About Me
export const ABOUT_ME = "About";
export const ADDITIONAL = "Additional information";
export const AGE_GENDER = "Age / Gender";
export const EDUCATION = "Education";
export const FAVORITES = "Favorites";
export const HOBBIES = "What I do in my free time";
export const HOME = "Home";
export const HOMETOWN = "Grew up in";
export const JOINED = "Coucher since";
export const LANGUAGES_CONVERSATIONAL = "Conversational in";
export const LANGUAGES_FLUENT = "Fluent languages";
export const MEDIA = "Art, Books, Movies, and Music I like";
export const MISSION = "Current mission";
export const OCCUPATION = "Occupation";
export const OVERVIEW = "Overview";
export const PHOTOS = "Photos";
export const STORY = "My favorite hosting or travel story";
export const TRAVELS = "My travels";
export const WHO = "Who I am";
export const WHY = "Why I use Couchers";

export const SECTIONS = [ABOUT_ME, HOME, REFERENCES, FAVORITES, PHOTOS];

export const SECTION_LABELS = {
  about: ABOUT_ME,
  favorites: FAVORITES,
  home: HOME,
  photos: PHOTOS,
  references: REFERENCES,
};

// Edit Profile
export const COUNTRIES_VISITED = "Countries I've Visited";
export const COUNTRIES_LIVED = "Countries I've Lived In";
export const FEMALE = "Female";
export const FEMALE_PRONOUNS = "she / her";
export const GENDER = "Gender";
export const HOSTING_STATUS = "Hosting status";
export const LANGUAGES_SPOKEN = "Languages I speak";
export const MALE = "Male";
export const MALE_PRONOUNS = "he / him";
export const PRONOUNS = "Pronouns";
export const SAVE = "save";

// Home
export const ABOUT_HOME = "About my home";
export const ACCEPT_DRINKING = "Drinking";
export const ACCEPT_PETS = "Pets";
export const ACCEPT_SMOKING = "Smoking";
export const ACCEPT_KIDS = "Kids";
export const CAMPING = "Camping";
export const HAS_HOUSEMATES = "Has housemates";
export const HOST_DRINKING = "Drinks at home";
export const HOST_KIDS = "Has children";
export const HOST_PETS = "Has pets";
export const HOST_SMOKING = "Smokes at home";
export const HOSTING_PREFERENCES = "Hosting Preferences";
export const HOUSE_RULES = "House Rules";
export const HOUSEMATES = "Housemates";
export const LAST_MINUTE = "Last-minute requests";
export const LOCAL_AREA = "Local area information";
export const MAX_GUESTS = "Max # of guests";
export const PARKING = "Parking available";
export const PARKING_DETAILS = "Parking details";
export const SLEEPING_ARRANGEMENT = "Sleeping arrangement";
export const SPACE = "Private / shared space";
export const TRANSPORTATION = "Transportation, Parking, Accessibility";
export const WHEELCHAIR = "Wheelchair accessible";

// Edit home
export const EDIT_HOME = "Edit my place";

// Community
export const COMMUNITY_HEADING = (name: string) => `Welcome to ${name}!`;
export const DISCUSSIONS_EMPTY_STATE = "No discussions at the moment.";
export const DISCUSSIONS_LABEL = "Discussions";
export const DISCUSSIONS_TITLE = (name: string) => `${name} discussions`;
export const ERROR_LOADING_COMMUNITY = "Error loading the community.";
export const EVENTS_EMPTY_STATE = "No events at the moment.";
export const EVENTS_LABEL = "Events";
export const FIND_HOST = "Find host";
export const HANGOUTS_LABEL = "Hangouts";
export const INVALID_COMMUNITY_ID = "Invalid community id.";
export const LOCAL_POINTS_LABEL = "Local points";
export const MORE_REPLIES = "More replies...";
export const MORE_TIPS = "More tips and information";
export const NEW_POST_LABEL = "New post";
export const PLACES_EMPTY_STATE = "No places to show yet.";
export const SEE_MORE_DISCUSSIONS_LABEL = "See more discussions";
export const SEE_MORE_EVENTS_LABEL = "See more events";
export const SEE_MORE_PLACES_LABEL = "See more places";

// References
export const REFERENCES_FILTER_A11Y_LABEL = "Show references: ";
export const referencesFilterLabels = {
  [ReferenceType.FRIEND]: "From friends",
  [ReferenceType.HOSTED]: "From guests",
  [ReferenceType.SURFED]: "From hosts",
  all: "All references",
  given: "Given to others",
};
export const referenceBadgeLabel = {
  [ReferenceType.FRIEND]: "Friend",
  [ReferenceType.HOSTED]: "Guest",
  [ReferenceType.SURFED]: "Hosted",
};
export const NO_REFERENCES = "No references of this kind yet!";
export const getReferencesGivenHeading = (name: string) =>
  `References ${name} wrote`;
