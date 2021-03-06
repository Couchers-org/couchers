export const baseRoute = "/";

export const loginRoute = "/login";
export const resetPasswordRoute = "/password-reset";
export const settingsRoute = "/account-settings";
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
export const hostRequestRoute = `${messagesRoute}/request`;
export const archivedMessagesRoute = `${messagesRoute}/archived`;
export const routeToGroupChat = (id: number) => `${groupChatsRoute}/${id}`;
export const routeToHostRequest = (id: number) => `${hostRequestRoute}/${id}`;

export const mapRoute = "/map";
export const eventsRoute = "/events";
export const logoutRoute = "/logout";
export const connectionsRoute = "/connections";
export const friendsRoute = `${connectionsRoute}/friends`;

export const userRoute = "/user";
export const routeToUser = (username: string) => `${profileRoute}/${username}`;
export const searchRoute = "/search";
export const routeToSearch = (query: string) => `${searchRoute}/${query}`;
export const jailRoute = "/restricted";
export const tosRoute = "/tos";

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

export const communityInfoRoute = `${communityRoute}/info`;
export const routeToCommunityInfo = (id: number, slug: string) =>
  `${communityBaseRoute}/${id}/${slug}/info`;
export const communityPlacesRoute = `${communityRoute}/places`;
export const routeToCommunityPlaces = (id: number, slug: string) =>
  `${communityBaseRoute}/${id}/${slug}/places`;
export const communityGuidesRoute = `${communityRoute}/guides`;
export const routeToCommunityGuides = (id: number, slug: string) =>
  `${communityBaseRoute}/${id}/${slug}/guides`;
export const communityGroupsRoute = `${communityRoute}/groups`;
export const routeToCommunityGroups = (id: number, slug: string) =>
  `${communityBaseRoute}/${id}/${slug}/groups`;
export const communityDiscussionsRoute = `${communityRoute}/discussions`;
export const routeToCommunityDiscussions = (id: number, slug: string) =>
  `${communityBaseRoute}/${id}/${slug}/discussions`;
export const communityEventsRoute = `${communityRoute}/events`;
export const routeToCommunityEvents = (id: number, slug: string) =>
  `${communityBaseRoute}/${id}/${slug}/events`;
