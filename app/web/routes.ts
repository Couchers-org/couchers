/*
The source of truth for URLs is
//docs/urls.md
Please make sure this file stays in sync with that file as well as
//app/backend/src/couchers/urls.py
*/
import { ReferenceType } from "couchers/proto/references_pb";
import SearchFilters, { parseSearchFiltersToQuery } from "utils/searchFilters";

export const baseRoute = "/";

export const githubURL = "https://github.com/Couchers-org/couchers";
export const instagramURL = "https://www.instagram.com/couchersorg";
export const redditURL = "https://www.reddit.com/r/couchers/";
export const facebookURL = "https://www.facebook.com/Couchers.org";
export const blueskyURL = "https://bsky.app/profile/couchers.bsky.social";
export const tiktokURL = "https://www.tiktok.com/@couchersorg";
export const helpCenterURL = "https://help.couchers.org";
export const githubUpdatesURL =
  "https://github.com/Couchers-org/couchers/commits/develop";
export const newsletterSignupURL =
  "https://newsletter.couchers.org/subscription/form";

export const translateJobURL = "https://couchers.org/volunteer/translator";

export const couchersAppStoreURL =
  "https://apps.apple.com/us/app/couchers-org/id6623776751";
export const couchersGooglePlayURL =
  "https://play.google.com/store/apps/details?id=org.couchers.android";

export const landingRoute = "/landing";
export const dashboardRoute = "/dashboard";
export const blogRoute = "/blog";
export const faqRoute = "/faq";
export const missionRoute = "/mission";
export const foundationRoute = "/foundation";
export const planRoute = "/plan";
export const teamRoute = "/team";
export const donationsRoute = "/donate";
export const builtWithRoute = "/open-source";
export const contactRoute = "/contact";
export const roadmapRoute = "/roadmap";
export const shopRoute = "/shop";
export const whatIsCouchSurfingRoute = "/what-is-couch-surfing";
export const pressRoute = "/press";

export const loginRoute = "/login";
export const resetPasswordRoute = "/password-reset";

export const signupRoute = "/signup";
export const inviteRoute = "/invite";
export const inviteCodesRoute = "/invite-codes";

export const settingsRoute = "/account-settings";
export const notificationSettingsRoute = `${settingsRoute}/notifications`;
export const loginsSettingsRoute = `${settingsRoute}/logins`;
export const strongVerificationRoute = "/strong-verification";

export const translateRoute = "/translate";

// profile
export const userTabs = [
  "about",
  "mod",
  "home",
  "references",
  "favorites",
  "photos",
] as const;
export const editUserTabs = ["about", "home"] as const;
export type UserTab = (typeof userTabs)[number];
export type EditUserTab = (typeof editUserTabs)[number];

const profileBaseRoute = "/profile";
export function routeToProfile(tab?: UserTab) {
  return `${profileBaseRoute}${tab ? `/${tab}` : ""}`;
}

export function routeToEditProfile(tab?: EditUserTab) {
  return `${profileBaseRoute}/edit${tab ? `/${tab}` : ""}`;
}

// user
const userBaseRoute = "/user";

export function routeToUser(username: string, tab?: UserTab) {
  return `${userBaseRoute}/${username}${tab ? `/${tab}` : ""}`;
}

export const messagesRoute = "/messages";
export const messageTypeStrings = [
  "all",
  "unread",
  "chats",
  "hosting",
  "surfing",
  "archived",
] as const;
export type MessageType = (typeof messageTypeStrings)[number];
export const groupChatsRoute = `${messagesRoute}/chats`;
export const routeToCreateMessage = (username: string) =>
  `${groupChatsRoute}?to=${username}`;
const hostRequestRoute = `${messagesRoute}/request`;
export const routeToGroupChat = (id: number) => `${groupChatsRoute}/${id}`;
export const routeToHostRequest = (id: number) => `${hostRequestRoute}/${id}`;

// REFERENCES
export const leaveReferenceBaseRoute = "/leave-reference";
export const routeToLeaveReference = (
  referenceType: ReferenceTypeRouteStrings,
  userId: number,
  hostRequestId?: number,
) => `${leaveReferenceBaseRoute}/${referenceType}/${userId}/${hostRequestId}`;
export const referenceTypeRouteStrings = [
  "friend",
  "surfed",
  "hosted",
] as const;
type ReferenceTypeRouteStrings = (typeof referenceTypeRouteStrings)[number];
export const referenceTypeRoute: Record<
  ReferenceType,
  ReferenceTypeRouteStrings
> = {
  [ReferenceType.REFERENCE_TYPE_FRIEND]: "friend",
  [ReferenceType.REFERENCE_TYPE_SURFED]: "surfed",
  [ReferenceType.REFERENCE_TYPE_HOSTED]: "hosted",
};
export const referenceStepStrings = [
  "did-stay",
  "private-feedback",
  "reference",
  "submit",
  "thank-you",
] as const;
export type ReferenceStep = (typeof referenceStepStrings)[number];

export const eventsRoute = "/events";
export const communitiesRoute = "/communities";
export const logoutRoute = "/logout";
export const connectionsRoute = "/connections";

export const searchRoute = "/search";
export const routeToSearch = (filters: SearchFilters) =>
  `${searchRoute}?${parseSearchFiltersToQuery(filters)}`;

export const jailRoute = "/restricted";
export const tosRoute = "/terms";

const placeBaseRoute = "/place";
export const routeToPlace = (id: number, slug: string) =>
  `${placeBaseRoute}/${id}/${slug}`;

const guideBaseRoute = "/guide";
export const routeToGuide = (id: number, slug: string) =>
  `${guideBaseRoute}/${id}/${slug}`;

const groupBaseRoute = "/group";
export const routeToGroup = (id: number, slug: string) =>
  `${groupBaseRoute}/${id}/${slug}`;

export const discussionBaseRoute = "/discussion";
export const routeToDiscussion = (id: number, slug: string) =>
  `${discussionBaseRoute}/${id}/${slug}`;
export const routeToEditDiscussion = (id: number, slug: string) =>
  `${routeToDiscussion(id, slug)}/edit`;

export const eventBaseRoute = "/event";
export const newEventRoute = `${eventBaseRoute}/new`;
export const routeToNewEvent = (communityId?: number) =>
  `${newEventRoute}${communityId ? `?communityId=${communityId}` : ""}`;
export const routeToDuplicateEvent = (eventId: number) =>
  `${newEventRoute}?duplicateEventId=${eventId}`;
export const routeToEvent = (id: number, slug: string) =>
  `${eventBaseRoute}/${id}/${slug}`;
export const routeToEditEvent = (id: number, slug: string) =>
  `${routeToEvent(id, slug)}/edit`;

const communityBaseRoute = "/community";
export const communityTabs = [
  "overview",
  "info",
  "public-trips",
  "discussions",
  "events",
  "members",
] as const;
export type CommunityTab = (typeof communityTabs)[number];

export const routeToCommunity = (
  id: number,
  slug: string,
  page?: CommunityTab,
) => `${communityBaseRoute}/${id}/${slug}${page ? `/${page}` : ""}`;
export const routeToEditCommunityPage = (id: number, slug: string) =>
  `${routeToCommunity(id, slug, "info")}/edit`;

export const myPublicTripsRoute = "/public-trips";

export const composingDiscussionHash = "new";
export const volunteerRoute = "/volunteer";

const badgesRoute = "/badges";
export const routeToBadge = (id: string) => `${badgesRoute}/${id}`;

export function adminPanelUserLink(username: string) {
  return `${process.env.NEXT_PUBLIC_CONSOLE_BASE_URL}/admin/user/${username}`;
}

//mod
export function routeToModUser(username: string, tab?: UserTab) {
  return `/mod/user/${username}${tab ? `/${tab}` : ""}`;
}

export const howToRespondRequestGuideUrl =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1715125658-what-are-some-things-i-should-think-about-before-responding-to-a-request";
export const howToWriteRequestGuideUrl =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1725943310-quick-reference-writing-great-requests";
export const howToDonateUrl =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1715125658-how-do-i-donate-money-to-couchers-org";
export const howToCompleteProfileUrl =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1725919152-why-do-i-need-to-complete-my-profile-to-use-some-features";
export const howToInviteCommunityUrl =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1720304409-how-does-the-invite-the-community-feature-work";
export const howToMakeGreatProfileUrl =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1725919197-how-do-i-create-a-great-profile";
export const helpCenterReportContentURL =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1715125657-how-do-i-report-someone-or-something-that-violates-the-community-guidelines-or-terms-of-use-to_u";
export const helpCenterPrivateFeedbackUrl =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1747589427-providing-private-feedback-when-leaving-a-reference";
export const helpCenterHowToLeaveGoodReferenceUrl =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1717360836-how-to";
export const helpCenterCommunityBuilderURL =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1743977410-what-is-a-community-builder";
export const helpCenterFriendRequestsURL =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1715125657-can-i-add-anyone-as-a-friend";
export const communityGuidelinesURL =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1715121703-couchers-org-community-guidelines";
// Note: Url must end with financials year digits
export const latestFinancialsURL =
  "/blog/2026/02/16/couchers-inc-financials-2025";

export const communityCreationFormURL = (username?: string) =>
  `https://forms.monday.com/forms/d7b6f1bd47a092e23b63f6ef9db1594b?r=use1&username=${username || ""}`;

export const volunteerNotAVolunteerFormUrl =
  "mailto:support@couchers.org?subject=Please%20add%20me%20to%20the%20volunteer%20page";
