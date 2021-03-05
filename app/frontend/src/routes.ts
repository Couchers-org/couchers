export const baseRoute = "/";

export const loginRoute = "/login";
export const loginPasswordRoute = `${loginRoute}/password`;
export const resetPasswordRoute = "/password-reset";
export const changePasswordRoute = "/change-password";
export const changeEmailRoute = "/change-email";
export const confirmChangeEmailRoute = "/confirm-email";

export const signupRoute = "/signup";
export const profileRoute = "/profile";
export const aboutRoute = `${profileRoute}/about`;
export const homeRoute = `${profileRoute}/home`;
export const referencesRoute = `${profileRoute}/references`;
export const favoritesRoute = `${profileRoute}/favorites`;
export const photosRoute = `${profileRoute}/photos`;

export const editProfileRoute = `${profileRoute}/edit`;
export const editHostingPreferenceRoute = `${profileRoute}/edit-hosting`;

export const messagesRoute = "/messages";
export const groupChatsRoute = `${messagesRoute}/chats`;
export const surfingRequestsRoute = `${messagesRoute}/surfing`;
export const hostingRequestsRoute = `${messagesRoute}/hosting`;
export const meetRoute = `${messagesRoute}/meet`;
export const newHostRequestRoute = `${messagesRoute}/request/new`;
export const hostRequestRoute = `${messagesRoute}/request`;
export const archivedMessagesRoute = `${messagesRoute}/archived`;
export const routeToGroupChat = (id: number) => `${groupChatsRoute}/${id}`;
export const routeToNewHostRequest = (hostId: number) =>
  `${newHostRequestRoute}/${hostId}`;
export const routeToHostRequest = (id: number) => `${hostRequestRoute}/${id}`;

export const mapRoute = "/map";
export const logoutRoute = "/logout";
export const connectionsRoute = "/connections";
export const friendsRoute = `${connectionsRoute}/friends`;
export const notFoundRoute = "/notfound";

export const userRoute = "/user";
export const routeToUser = (username: string) => `${profileRoute}/${username}`;
export const searchRoute = "/search";
export const routeToSearch = (query: string) => `${searchRoute}/${query}`;
export const jailRoute = "/restricted";
export const tosRoute = "/tos";

const placeBaseRoute = "/place";
export const placeRoute = `${placeBaseRoute}/:pageId/:pageSlug?`;
export const routeToPlace = (id: number, slug: string) =>
  `${placeRoute}/${id}/${slug}`;
export const newPlaceRoute = `${placeBaseRoute}/new`;

const guideBaseRoute = "/guide";
export const guideRoute = `${guideBaseRoute}/:pageId/:pageSlug?`;
export const routeToGuide = (id: number, slug: string) =>
  `${guideRoute}/${id}/${slug}`;
export const newGuideRoute = `${guideBaseRoute}/new`;

const groupBaseRoute = "/group";
export const groupRoute = `${groupBaseRoute}/:groupId/:groupSlug?`;
export const routeToGroup = (id: number, slug: string) =>
  `${groupBaseRoute}/${id}/${slug}`;

const discussionBaseRoute = "/discussion";
export const discussionRoute = `${discussionBaseRoute}/:discussionId/:discussionSlug?`;
export const routeToDiscussion = (id: number, slug: string) =>
  `${discussionBaseRoute}/${id}/${slug}`;

const eventBaseRoute = "/event";
export const eventRoute = `${eventBaseRoute}/:eventId/:eventSlug?`;
export const routeToEvent = (id: number, slug: string) =>
  `${eventBaseRoute}/${id}/${slug}`;

const communityBaseRoute = "/community";
export const communityRoute = `${communityBaseRoute}/:communityId/:communitySlug?`;
export const routeToCommunity = (id: number, slug: string) =>
  `${communityBaseRoute}/${id}/${slug}`;

const communityPlacesBaseRoute = `${communityRoute}/places`;
export const communityPlacesRoute = `${communityPlacesBaseRoute}/:communityId/:communitySlug?`;
export const routeToCommunityPlaces = (id: number, slug: string) =>
  `${communityPlacesBaseRoute}/${id}/${slug}`;
const communityGuidesBaseRoute = `${communityRoute}/guides`;
export const communityGuidesRoute = `${communityGuidesBaseRoute}/:communityId/:communitySlug?`;
export const routeToCommunityGuides = (id: number, slug: string) =>
  `${communityGuidesBaseRoute}/${id}/${slug}`;
const communityGroupsBaseRoute = `${communityRoute}/groups`;
export const communityGroupsRoute = `${communityGroupsBaseRoute}/:communityId/:communitySlug?`;
export const routeToCommunityGroups = (id: number, slug: string) =>
  `${communityGroupsBaseRoute}/${id}/${slug}`;
const communityDiscussionsBaseRoute = `${communityRoute}/discussions`;
export const communityDiscussionsRoute = `${communityDiscussionsBaseRoute}/:communityId/:communitySlug?`;
export const routeToCommunityDiscussions = (id: number, slug: string) =>
  `${communityDiscussionsBaseRoute}/${id}/${slug}`;
const communityEventsBaseRoute = `${communityRoute}/events`;
export const communityEventsRoute = `${communityEventsBaseRoute}/:communityId/:communitySlug?`;
export const routeToCommunityEvents = (id: number, slug: string) =>
  `${communityEventsBaseRoute}/${id}/${slug}`;
