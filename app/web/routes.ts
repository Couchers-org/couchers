/*
The source of truth for URLs is
//docs/urls.md
Please make sure this file stays in sync with that file as well as
//app/backend/src/couchers/urls.py
*/
import { ReferenceType } from "@couchers/services/references";

import {
  SearchFilters,
  parseSearchFiltersToQuery,
} from "@/utils/searchFilters";

export const BASE_ROUTE = "/";

export const GITHUB_URL = "https://github.com/Couchers-org/couchers";
export const INSTAGRAM_URL = "https://www.instagram.com/couchersorg";
export const REDDIT_URL = "https://www.reddit.com/r/couchers/";
export const BLUESKY_URL = "https://bsky.app/profile/couchers.bsky.social";
export const FACEBOOK_URL = "https://www.facebook.com/Couchers.org";
export const HELP_CENTER_URL = "https://help.couchers.org";
export const GITHUB_UPDATES_URL =
  "https://github.com/Couchers-org/couchers/commits/develop";
export const NEWSLETTER_SIGNUP_URL =
  "https://newsletter.couchers.org/subscription/form";

export const TRANSLATE_JOB_URL = "https://couchers.org/volunteer/translator";

export const LANDING_ROUTE = "/landing";
export const DASHBOARD_ROUTE = "/dashboard";
export const BLOG_ROUTE = "/blog";
export const FAQ_ROUTE = "/faq";
export const MISSION_ROUTE = "/mission";
export const FOUNDATION_ROUTE = "/foundation";
export const PLAN_ROUTE = "/plan";
export const TEAM_ROUTE = "/team";
export const DONATIONS_ROUTE = "/donate";
export const BUILT_WITH_ROUTE = "/open-source";
export const CONTACT_ROUTE = "/contact";
export const ROADMAP_ROUTE = "/roadmap";

export const LOGIN_ROUTE = "/login";
export const RESET_PASSWORD_ROUTE = "/password-reset";
export const FEATURE_PREVIEW_ROUTE = "/preview";
export const CONFIRM_CHANGE_EMAIL_ROUTE = "/confirm-email";

export const SIGNUP_ROUTE = "/signup";

export const SETTINGS_ROUTE = "/account-settings";
export const NOTIFICATION_SETTINGS_ROUTE = `${SETTINGS_ROUTE}/notifications`;
export const LOGINS_SETTINGS_ROUTE = `${SETTINGS_ROUTE}/logins`;

export const TRANSLATE_ROUTE = "/translate";

// profile
export const USER_TABS = [
  "about",
  "mod",
  "home",
  "references",
  "favorites",
  "photos",
] as const;
export const EDIT_USER_TABS = ["about", "home"] as const;
export type UserTab = (typeof USER_TABS)[number];
export type EditUserTab = (typeof EDIT_USER_TABS)[number];

const PROFILE_BASE_ROUTE = "/profile";
export const routeToProfile = (tab?: UserTab) => {
  return `${PROFILE_BASE_ROUTE}${tab ? `/${tab}` : ""}`;
};

export const routeToEditProfile = (tab?: EditUserTab) => {
  return `${PROFILE_BASE_ROUTE}/edit${tab ? `/${tab}` : ""}`;
};

// user
const USER_BASE_ROUTE = "/user";

export const routeToUser = (username: string, tab?: UserTab) => {
  return `${USER_BASE_ROUTE}/${username}${tab ? `/${tab}` : ""}`;
};

export const MESSAGES_ROUTE = "/messages";
export const MESSAGE_TYPE_STRINGS = ["chats", "hosting", "surfing"] as const;
export type MessageType = (typeof MESSAGE_TYPE_STRINGS)[number];
export const GROUP_CHATS_ROUTE = `${MESSAGES_ROUTE}/chats`;
export const routeToCreateMessage = (username: string) =>
  `${GROUP_CHATS_ROUTE}?to=${username}`;
export const SURFING_REQUESTS_ROUTE = `${MESSAGES_ROUTE}/surfing`;
export const HOSTING_REQUESTS_ROUTE = `${MESSAGES_ROUTE}/hosting`;
export const HOST_REQUEST_ROUTE = `${MESSAGES_ROUTE}/request`;
export const routeToGroupChat = (id: number) => `${GROUP_CHATS_ROUTE}/${id}`;
export const routeToHostRequest = (id: number) => `${HOST_REQUEST_ROUTE}/${id}`;

// REFERENCES
export const LEAVE_REFERENCE_BASE_ROUTE = "/leave-reference";
export const routeToLeaveReference = (
  referenceType: ReferenceTypeRouteStrings,
  userId: number,
  hostRequestId?: number,
) =>
  `${LEAVE_REFERENCE_BASE_ROUTE}/${referenceType}/${userId}/${hostRequestId ?? ""}`;
export const REFERENCE_TYPE_ROUTE_STRINGS = [
  "friend",
  "surfed",
  "hosted",
] as const;
export type ReferenceTypeRouteStrings =
  (typeof REFERENCE_TYPE_ROUTE_STRINGS)[number];
export const REFERENCE_TYPE_ROUTE: Record<
  ReferenceType,
  ReferenceTypeRouteStrings
> = {
  [ReferenceType.REFERENCE_TYPE_FRIEND]: "friend",
  [ReferenceType.REFERENCE_TYPE_SURFED]: "surfed",
  [ReferenceType.REFERENCE_TYPE_HOSTED]: "hosted",
};
export const REFERENCE_STEP_STRINGS = [
  "did-stay",
  "private-feedback",
  "reference",
  "submit",
  "thank-you",
] as const;
export type ReferenceStep = (typeof REFERENCE_STEP_STRINGS)[number];

export const EVENTS_ROUTE = "/events";
export const COMMUNITIES_ROUTE = "/communities";
export const LOGOUT_ROUTE = "/logout";
export const CONNECTIONS_ROUTE = "/connections";
export const FRIENDS_ROUTE = `${CONNECTIONS_ROUTE}/friends`;

export const SEARCH_ROUTE = "/search";
export const routeToSearch = (filters: SearchFilters) =>
  `${SEARCH_ROUTE}?${parseSearchFiltersToQuery(filters)}`;

export const JAIL_ROUTE = "/restricted";
export const TOS_ROUTE = "/terms";

const PLACE_BASE_ROUTE = "/place";
export const routeToPlace = (id: number, slug: string) =>
  `${PLACE_BASE_ROUTE}/${id}/${slug}`;
export const NEW_PLACE_ROUTE = `${PLACE_BASE_ROUTE}/new`;

const GUIDE_BASE_ROUTE = "/guide";
export const routeToGuide = (id: number, slug: string) =>
  `${GUIDE_BASE_ROUTE}/${id}/${slug}`;
export const NEW_GUIDE_ROUTE = `${GUIDE_BASE_ROUTE}/new`;

const GROUP_BASE_ROUTE = "/group";
export const routeToGroup = (id: number, slug: string) =>
  `${GROUP_BASE_ROUTE}/${id}/${slug}`;

export const DISCUSSION_BASE_ROUTE = "/discussion";
export const routeToDiscussion = (id: number, slug: string) =>
  `${DISCUSSION_BASE_ROUTE}/${id}/${slug}`;

export const EVENT_BASE_ROUTE = "/event";
export const NEW_EVENT_ROUTE = `${EVENT_BASE_ROUTE}/new`;
export const routeToNewEvent = (communityId?: number) =>
  `${NEW_EVENT_ROUTE}${communityId ? `?communityId=${communityId}` : ""}`;
export const routeToEvent = (id: number, slug: string) =>
  `${EVENT_BASE_ROUTE}/${id}/${slug}`;
export const routeToEditEvent = (id: number, slug: string) =>
  `${routeToEvent(id, slug)}/edit`;

const COMMUNITY_BASE_ROUTE = "/community";
export const COMMUNITY_TABS = [
  "overview",
  "info",
  "discussions",
  "events",
  "members",
] as const;
export type CommunityTab = (typeof COMMUNITY_TABS)[number];

export const routeToCommunity = (
  id: number,
  slug: string,
  page?: CommunityTab,
) => `${COMMUNITY_BASE_ROUTE}/${id}/${slug}${page ? `/${page}` : ""}`;
export const routeToEditCommunityPage = (id: number, slug: string) =>
  `${routeToCommunity(id, slug, "info")}/edit`;

export const COMPOSING_DISCUSSION_HASH = "new";
export const VOLUNTEER_ROUTE = "/volunteer";

export const BADGES_ROUTE = "/badges";
export const routeToBadge = (id: string) => `${BADGES_ROUTE}/${id}`;

export const STRONG_VERIFICATION_URL = `${Config.consoleBaseUrl}/strong-verification`;
export const adminPanelUserLink = (username: string) => {
  return `${Config.consoleBaseUrl}/admin/user/${username}`;
};

// mod
export const routeToModUser = (username: string, tab?: UserTab) => {
  return `/mod/user/${username}${tab ? `/${tab}` : ""}`;
};

export const HOW_TO_RESPOND_REQUEST_GUIDE_URL =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1715125658-what-are-some-things-i-should-think-about-before-responding-to-a-request";
export const HOW_TO_WRITE_REQUEST_GUIDE_URL =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1725943310-quick-reference-writing-great-requests";
export const HOW_TO_DONATE_URL =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1715125658-how-do-i-donate-money-to-couchers-org";
export const HOW_TO_COMPLETE_PROFILE_URL =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1725919152-why-do-i-need-to-complete-my-profile-to-use-some-features";
export const HOW_TO_INVITE_COMMUNITY_URL =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1720304409-how-does-the-invite-the-community-feature-work";
export const HOW_TO_MAKE_GREAT_PROFILE_URL =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1725919197-how-do-i-create-a-great-profile";
export const HELP_CENTER_REPORT_CONTENT_URL =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1715125657-how-do-i-report-someone-or-something-that-violates-the-community-guidelines-or-terms-of-use-to_u";
export const HELP_CENTER_PRIVATE_FEEDBACK_URL =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1747589427-providing-private-feedback-when-leaving-a-reference";
export const HELP_CENTER_HOW_TO_LEAVE_GOOD_REFERENCE_URL =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1717360836-how-to";
export const HELP_CENTER_COMMUNITY_BUILDER_URL =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1743977410-what-is-a-community-builder";

// Note: Url must end with financials year digits
export const LATEST_FINANCIALS_URL =
  "/blog/2025/04/20/couchers-inc-financials-2024";

export const communityCreationFormUrl = (username?: string) =>
  `https://forms.monday.com/forms/d7b6f1bd47a092e23b63f6ef9db1594b?r=use1&username=${username || ""}`;
