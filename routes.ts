/*
The source of truth for URLs is
//docs/urls.md
Please make sure this file stays in sync with that file as well as
//app/backend/src/couchers/urls.py
*/
import { ReferenceType } from "proto/references_pb";
import { ReferenceTypeStrings } from "service/references";
import SearchFilters, { parseSearchFiltersToQuery } from "utils/searchFilters";

export const baseRoute = "/";

export const githubURL = "https://github.com/Couchers-org/couchers";
export const forumURL = "https://community.couchers.org/";
export const townHallURL =
  "https://community.couchers.org/t/open-town-hall/1291";
export const sundaySocialURL =
  "https://community.couchers.org/t/weekly-online-event-sunday/684";
export const tuesdaySocialURL =
  "https://community.couchers.org/t/weekly-online-event-tuesday/1098";

export const dashboardRoute = "/dashboard";
export const blogRoute = "/blog";
export const faqRoute = "/faq";
export const missionRoute = "/mission";
export const foundationRoute = "/foundation";
export const handbookRoute = "/handbook";
export const planRoute = "/plan";
export const teamRoute = "/team";
export const donationsRoute = "/donate";

export const loginRoute = "/login";
export const resetPasswordRoute = "/password-reset";
export const settingsRoute = "/account-settings";
export const featurePreviewRoute = "/preview";
export const confirmChangeEmailRoute = "/confirm-email";

export const signupRoute = "/signup";

// profile
export const userTabs = [
  "about",
  "home",
  "references",
  "favorites",
  "photos",
] as const;
export const editUserTabs = ["about", "home"] as const;
export type UserTab = typeof userTabs[number];
export type EditUserTab = typeof editUserTabs[number];

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
export const messageTypeStrings = ["chats", "hosting", "surfing"] as const;
export type MessageType = typeof messageTypeStrings[number];
export const groupChatsRoute = `${messagesRoute}/chats`;
export const routeToCreateMessage = (username: string) =>
  `${groupChatsRoute}?to=${username}`;
export const surfingRequestsRoute = `${messagesRoute}/surfing`;
export const hostingRequestsRoute = `${messagesRoute}/hosting`;
export const hostRequestRoute = `${messagesRoute}/request`;
export const routeToGroupChat = (id: number) => `${groupChatsRoute}/${id}`;
export const routeToHostRequest = (id: number) => `${hostRequestRoute}/${id}`;

// REFERENCES
export const leaveReferenceBaseRoute = "/leave-reference";
export const routeToLeaveReference = (
  referenceType: ReferenceTypeStrings,
  userId: number,
  hostRequestId?: number
) => `${leaveReferenceBaseRoute}/${referenceType}/${userId}/${hostRequestId}`;
export const referenceTypeRouteStrings = [
  "friend",
  "surfed",
  "hosted",
] as const;
export type ReferenceTypeRouteStrings =
  typeof referenceTypeRouteStrings[number];
export const referenceTypeRoute: Record<
  ReferenceType,
  ReferenceTypeRouteStrings
> = {
  [ReferenceType.REFERENCE_TYPE_FRIEND]: "friend",
  [ReferenceType.REFERENCE_TYPE_SURFED]: "surfed",
  [ReferenceType.REFERENCE_TYPE_HOSTED]: "hosted",
};
export const referenceStepStrings = [
  "appropriate",
  "rating",
  "reference",
  "submit",
] as const;
export type ReferenceStep = typeof referenceStepStrings[number];

export const eventsRoute = "/events";
export const logoutRoute = "/logout";
export const connectionsRoute = "/connections";
export const friendsRoute = `${connectionsRoute}/friends`;

export const searchRoute = "/search";
export const routeToSearch = (filters: SearchFilters) =>
  `${searchRoute}?${parseSearchFiltersToQuery(filters)}`;

export const jailRoute = "/restricted";
export const tosRoute = "/terms";

const placeBaseRoute = "/place";
export const routeToPlace = (id: number, slug: string) =>
  `${placeBaseRoute}/${id}/${slug}`;
export const newPlaceRoute = `${placeBaseRoute}/new`;

const guideBaseRoute = "/guide";
export const routeToGuide = (id: number, slug: string) =>
  `${guideBaseRoute}/${id}/${slug}`;
export const newGuideRoute = `${guideBaseRoute}/new`;

const groupBaseRoute = "/group";
export const routeToGroup = (id: number, slug: string) =>
  `${groupBaseRoute}/${id}/${slug}`;

export const discussionBaseRoute = "/discussion";
export const routeToDiscussion = (id: number, slug: string) =>
  `${discussionBaseRoute}/${id}/${slug}`;

export const eventBaseRoute = "/event";
export const newEventRoute = `${eventBaseRoute}/new`;
export const routeToNewEvent = (communityId?: number) =>
  `${newEventRoute}${communityId ? `?communityId=${communityId}` : ""}`;
export const routeToEvent = (id: number, slug: string) =>
  `${eventBaseRoute}/${id}/${slug}`;
export const routeToEditEvent = (id: number, slug: string) =>
  `${routeToEvent(id, slug)}/edit`;

const communityBaseRoute = "/community";
export const communityTabs = [
  "overview",
  "info",
  "discussions",
  "events",
] as const;
export type CommunityTab = typeof communityTabs[number];

export const routeToCommunity = (
  id: number,
  slug: string,
  page?: CommunityTab
) => `${communityBaseRoute}/${id}/${slug}${page ? `/${page}` : ""}`;
export const routeToEditCommunityPage = (id: number, slug: string) =>
  `${routeToCommunity(id, slug, "info")}/edit`;

export const composingDiscussionHash = "new";
export const volunteerRoute = "/volunteer";
