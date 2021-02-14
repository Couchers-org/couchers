export const loginRoute = "/login";
export const loginPasswordRoute = `${loginRoute}/password`;
export const resetPasswordRoute = "/password-reset";
export const changePasswordRoute = "/change-password";

export const signupRoute = "/signup";
export const profileRoute = "/profile";
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
export const routeToUser = (username: string) => `${userRoute}/${username}`;
export const searchRoute = "/search";
export const routeToSearch = (query: string) => `${searchRoute}/${query}`;
export const jailRoute = "/restricted";
export const tosRoute = "/tos";

export const placeRoute = "/place";
export const routeToPlace = (id: number, slug: string) =>
  `${placeRoute}/${id}/${slug}`;
export const newPlaceRoute = `${placeRoute}/new`;

export const guideRoute = "/guide";
export const routeToGuide = (id: number, slug: string) =>
  `${guideRoute}/${id}/${slug}`;
export const newGuideRoute = `${guideRoute}/new`;

export const communityRoute = "/community";
export const routeToCommunity = (id: number, slug: string) =>
  `${communityRoute}/${id}/${slug}`;

export const groupRoute = "/group";
export const routeToGroup = (id: number, slug: string) =>
  `${groupRoute}/${id}/${slug}`;

export const discussionRoute = "/discussion";
export const routeToDiscussion = (id: number, slug: string) =>
  `${discussionRoute}/${id}/${slug}`;
