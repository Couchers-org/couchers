export const landingRoute = "/landing";

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

// profile
export const userTabs = [
  "about",
  "home",
  "references",
//   "favorites",
//   "photos",
] as const;
export const editUserTabs = ["about", "home"] as const;
export type UserTab = (typeof userTabs)[number];
export type EditUserTab = (typeof editUserTabs)[number];

const userBaseRoute = "/user";

export function routeToUser(username: string, tab?: UserTab): any {
  return `${userBaseRoute}/${username}`;
}
