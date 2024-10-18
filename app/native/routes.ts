export const landingRoute = "/landing";

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
