/*
The source of truth for URLs is
//docs/urls.md
Please make sure this file stays in sync with that file as well as
//app/backend/src/couchers/urls.py
*/
import { ReferenceType } from "pb/references_pb";
import { ReferenceTypeStrings } from "service/references";

export const baseRoute = "/";

export const couchersURL = "https://couchers.org";
export const forumURL = "https://community.couchers.org";

export const contributeRoute = "/contribute";

export const loginRoute = "/login";
export const resetPasswordRoute = "/password-reset";
export const settingsRoute = "/account-settings";
export const confirmChangeEmailRoute = "/confirm-email";

export const signupRoute = "/signup";

// user

export const userBaseRoute = "/user";
export type UserTab = "about" | "home" | "references" | "favorites" | "photos";
export type EditUserTab = Extract<UserTab, "about" | "home">;

export const userRoute = `${userBaseRoute}/:username?/:tab?`;
export const editUserRoute = `${userBaseRoute}/edit/:tab?`;

export function routeToUser(username?: string, tab?: UserTab) {
  return `${userBaseRoute}${username ? `/${username}` : ""}${
    tab ? `/${tab}` : ""
  }`;
}

export function routeToEditUser(tab?: EditUserTab) {
  return `${userBaseRoute}/edit${tab ? `/${tab}` : ""}`;
}

export const messagesRoute = "/messages";
export const groupChatsRoute = `${messagesRoute}/chats`;
export const surfingRequestsRoute = `${messagesRoute}/surfing`;
export const hostingRequestsRoute = `${messagesRoute}/hosting`;
export const meetRoute = `${messagesRoute}/meet`;
export const hostRequestRoute = `${messagesRoute}/request`;
export const archivedMessagesRoute = `${messagesRoute}/archived`;
export const routeToGroupChat = (id: number) => `${groupChatsRoute}/${id}`;
export const routeToHostRequest = (id: number) => `${hostRequestRoute}/${id}`;

// REFERENCES
export const leaveReferenceBaseRoute = "/leave-reference";
export const leaveReferenceRoute = `${leaveReferenceBaseRoute}/:referenceType/:userId/:hostRequestId?`;
export const routeToLeaveReference = (
  referenceType: ReferenceTypeStrings,
  userId: number,
  hostRequestId?: number
) => `${leaveReferenceBaseRoute}/${referenceType}/${userId}/${hostRequestId}`;
export const referenceTypeRoute: Record<ReferenceType, string> = {
  [ReferenceType.REFERENCE_TYPE_FRIEND]: "friend",
  [ReferenceType.REFERENCE_TYPE_SURFED]: "surfed",
  [ReferenceType.REFERENCE_TYPE_HOSTED]: "hosted",
};

export const eventsRoute = "/events";
export const logoutRoute = "/logout";
export const connectionsRoute = "/connections";
export const friendsRoute = `${connectionsRoute}/friends`;

export const searchRoute = "/search";

export const jailRoute = "/restricted";
export const tosRoute = "/terms";

const placeBaseRoute = "/place";
export const placeRoute = `${placeBaseRoute}/:pageId/:pageSlug?`;
export const routeToPlace = (id: number, slug: string) =>
  `${placeBaseRoute}/${id}/${slug}`;
export const newPlaceRoute = `${placeBaseRoute}/new`;

const guideBaseRoute = "/guide";
export const guideRoute = `${guideBaseRoute}/:pageId/:pageSlug?`;
export const routeToGuide = (id: number, slug: string) =>
  `${guideBaseRoute}/${id}/${slug}`;
export const newGuideRoute = `${guideBaseRoute}/new`;

const groupBaseRoute = "/group";
export const groupRoute = `${groupBaseRoute}/:groupId/:groupSlug?`;
export const routeToGroup = (id: number, slug: string) =>
  `${groupBaseRoute}/${id}/${slug}`;

export const discussionBaseRoute = "/discussion";
export const discussionRoute = `${discussionBaseRoute}/:discussionId/:discussionSlug?`;
export const routeToDiscussion = (id: number, slug: string) =>
  `${discussionBaseRoute}/${id}/${slug}`;

const eventBaseRoute = "/event";
export const eventRoute = `${eventBaseRoute}/:eventId/:eventSlug?`;
export const routeToEvent = (id: number, slug: string) =>
  `${eventBaseRoute}/${id}/${slug}`;

const communityBaseRoute = "/community";
export type CommunityTab =
  | "overview"
  | "find-host"
  | "events"
  | "local-info"
  | "discussions"
  | "hangouts";
export const communityRoute = `${communityBaseRoute}/:communityId/:communitySlug/:page?`;
export const routeToCommunity = (
  id: number,
  slug: string,
  page?: CommunityTab
) => `${communityBaseRoute}/${id}/${slug}${page ? `/${page}` : ""}`;
