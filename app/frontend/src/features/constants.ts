// Profile Overview
export const COMMUNITY_STANDING = "Community Standing";
export const COMMUNITY_STANDING_DESCRIPTION =
  "Community Standing description text";
export const EDIT_PROFILE = "Edit profile";
export const EDIT = "Edit";
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
export const LIVED_IN = "Lived in";
export const MEDIA = "Art, Books, Movies, and Music I like";
export const MISSION = "Current mission";
export const OCCUPATION = "Occupation";
export const OVERVIEW = "Overview";
export const PHOTOS = "Photos";
export const STORY = "My favorite hosting or travel story";
export const TRAVELED_TO = "Traveled to";
export const TRAVELS = "My travels";
export const WHO = "Who I am";
export const WHY = "Why I use Couchers";

export const SECTION_LABELS = {
  about: ABOUT_ME,
  home: HOME,
  references: undefined, // REFERENCES,
  photos: undefined, // PHOTOS,
  favorites: undefined, // FAVORITES,
};
export const SECTION_LABELS_A11Y_TEXT = "tabs for user's details";

// Edit Profile
export const ACCOUNT_SETTINGS = "Account Settings";
export const COUNTRIES_VISITED = "Countries I've Visited";
export const COUNTRIES_LIVED = "Countries I've Lived In";
export const FEMALE = "Female";
export const FEMALE_PRONOUNS = "she / her";
export const GENDER = "Gender";
export const HOSTING_STATUS = "Hosting status";
export const LANGUAGES_SPOKEN = "Languages I speak";
export const MALE = "Male";
export const MALE_PRONOUNS = "he / him";
export const MEETUP_STATUS = "Meetup status";
export const NAME = "Name";
export const PRONOUNS = "Pronouns";
export const SAVE = "Save";

// Make Request
export const sendRequest = (name: string) => `Send ${name} a request`;
export const ARRIVAL_DATE = "Arrival Date";
export const CANCEL = "Cancel";
export const DEPARTURE_DATE = "Departure Date";
export const MEETUP_ONLY = "Meet up only";
export const OVERNIGHT_STAY = "Overnight stay";
export const REQUEST = "Request";
export const REQUEST_DESCRIPTION =
  "Share your plans for the visit and include why you're requesting to stay with this particular host";
export const SEND = "Send";
export const SEND_REQUEST_SUCCESS = "Request sent!";
export const STAY_TYPE_A11Y_TEXT = "stay type";

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

// Edit home
export const EDIT_HOME = "Edit home";

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

// Bug Report
export const BUG_DESCRIPTION_NAME = "Report title";
export const BUG_DESCRIPTION_HELPER = "Brief description of the bug";
export const PROBLEM_NAME = "What did you do to trigger the bug?";
export const PROBLEM_HELPER =
  "Brief description of the problem and how to reproduce it";
export const EXPECT_NAME = "What happened? What should have happened?";
export const EXPECT_HELPER =
  "Brief description of what you expected to happen instead";
export const REPORT = "Report a problem";
export const SUBMIT = "Submit";
export const WARNING =
  "Please note that this information, as well as diagnostic information including which page you are on, what browser you are using, and your username will be saved to a public list of bugs.";
export const BUG_REPORT_SUCCESS =
  "Thank you for reporting that bug and making Couchers better, a report was sent to the developers! The bug ID is ";

// Jail
export const PLEASE_CHECK_JAIL =
  "Please check the following in order to continue.";
export const LOCATION_SECTION_HEADING = "Please add your location";
export const JAIL_TOS_TEXT =
  "We've update our Terms of Service. To continue, please read and accept the new ";

// Datepicker
export const CHANGE_DATE = "Change date";

// Landing
export const WELCOME = "Welcome to Couchers.org!";
export const LANDING_MARKDOWN = `We are in the process of building new features like events, forums, community pages, and hangouts. We appreciate your patience and support as we build the platform.

We are always in need of feedback and new volunteers to join the team. Please fill out the form below if you are interested in contributing.

## Finding a host

Use the **map** to find a host, or **search by name** in the search bar (if you know who you're looking for). Go to the user's profile and click the "Request" button: the other user will receive an email. For now, you will need to check back on the "Messages" page (under the "Surfing" tab) to see if they've responded, we will add email notifications for this soon. A dedicated host finding feature will be released soon.

# Updates

*Last updated: 9th May, 2021.*

## Recent changes

* Redesigned the search feature to display results on the map (filters coming soon)
* Added the ability to delete, ban, and block users (email us if you'd like to be deleted or to ban someone)
* Implemented onboarding emails to welcome new users
* Updated the Terms of Service
* Implemented nicer error messages for frontend bugs
* Updated the contributor form
* Fixed internal bugs including with coordinate wrapping and speeding up CI/CD by eliminating duplicate tests due to backend refactoring

## Community features

We are working on events, forums, and pages for local communities. These features will significantly expand the ways in which users can interact with each other. These are highly integrated tools and we are aiming to release them by the end of May.

If you are interested in becoming a community leader, it's not too late to reach out to us by filling in the contributor form below. If you are already heavily involved in a local travel community, please also reach out.

## Mobile applications for iOS and Android

We're ramping up our effort to develop native mobile apps. We're currently looking for people experienced in the relevant technologies (React Native, Flutter, Swift/Kotlin, etc) to help us make solid architectural decisions before we move our development focus to mobile apps. If you have the skills to help, please fill in the contributor form below and we'll be in touch.

This process will take some time, but you can expect to hear more about these apps later this year.

*The Beta is still being worked on at a rapid rate, and things will continue to change quickly for the foreseeable future, so check back often for updates.*

# Bugs

Bugs are to be expected, as we are still in a phase of rapid development. We appreciate you being here to help with that. If you notice any bugs, please report them with the red button in the top right corner.

Please discuss anything else about the app on the [Community Forum](https://community.couchers.org/).`;
