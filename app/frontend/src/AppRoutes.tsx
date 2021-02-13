import React, { useEffect } from "react";
import { Redirect, Route, RouteProps, Switch } from "react-router-dom";

import TOS from "./components/TOS";
import { useAuthContext } from "./features/auth/AuthProvider";
import Jail from "./features/auth/jail/Jail";
import Login from "./features/auth/login/Login";
import Logout from "./features/auth/Logout";
import {
  ChangePasswordPage,
  CompleteResetPasswordPage,
  ResetPasswordPage,
} from "./features/auth/password";
import Signup from "./features/auth/signup/Signup";
import CommunityPage from "./features/communities/CommunityPage";
import DiscussionPage from "./features/communities/DiscussionPage";
import GroupPage from "./features/communities/GroupPage";
import NewPagePage from "./features/communities/NewPagePage";
import PagePage from "./features/communities/PagePage";
import { ConnectionsPage } from "./features/connections";
import Home from "./features/Home";
import MapPage from "./features/map/MapPage";
import Messages from "./features/messages/index";
import NotFoundPage from "./features/NotFoundPage";
import {
  EditHostingPreferencePage,
  EditProfilePage,
  ProfilePage,
} from "./features/profile";
import SearchPage from "./features/search/SearchPage";
import UserPage from "./features/userPage/UserPage";
import { PageType } from "./pb/pages_pb";

export const loginRoute = "/login";
export const loginPasswordRoute = `${loginRoute}/password`;
export const resetPasswordRoute = "/passwordreset";
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

export default function AppRoutes() {
  return (
    <Switch>
      <Route path={`${loginRoute}/:urlToken?`}>
        <Login />
      </Route>
      <Route path={`${signupRoute}/:urlToken?`}>
        <Signup />
      </Route>
      <Route exact path={resetPasswordRoute}>
        <ResetPasswordPage />
      </Route>
      <Route exact path={`${resetPasswordRoute}/:resetToken`}>
        <CompleteResetPasswordPage />
      </Route>
      <Route path={changePasswordRoute}>
        <ChangePasswordPage />
      </Route>
      <Route path={tosRoute}>
        <TOS />
      </Route>
      <PrivateRoute path={mapRoute}>
        <MapPage />
      </PrivateRoute>
      <Route path={jailRoute}>
        <Jail />
      </Route>
      <Route exact path={logoutRoute}>
        <Logout />
      </Route>
      <PrivateRoute path={editProfileRoute}>
        <EditProfilePage />
      </PrivateRoute>
      <PrivateRoute path={editHostingPreferenceRoute}>
        <EditHostingPreferencePage />
      </PrivateRoute>
      <PrivateRoute path={profileRoute}>
        <ProfilePage />
      </PrivateRoute>
      <PrivateRoute path={`${messagesRoute}/:type?`}>
        <Messages />
      </PrivateRoute>
      <PrivateRoute path={`${userRoute}/:username`}>
        <UserPage />
      </PrivateRoute>
      <PrivateRoute path={`${searchRoute}/:query?`}>
        <SearchPage />
      </PrivateRoute>
      <PrivateRoute path={newPlaceRoute}>
        <NewPagePage pageType={PageType.PAGE_TYPE_PLACE} />
      </PrivateRoute>
      <PrivateRoute path={`${placeRoute}/:pageId/:pageSlug?`}>
        <PagePage pageType={PageType.PAGE_TYPE_PLACE} />
      </PrivateRoute>
      <PrivateRoute path={newGuideRoute}>
        <NewPagePage pageType={PageType.PAGE_TYPE_GUIDE} />
      </PrivateRoute>
      <PrivateRoute path={`${guideRoute}/:pageId/:pageSlug?`}>
        <PagePage pageType={PageType.PAGE_TYPE_GUIDE} />
      </PrivateRoute>
      <PrivateRoute path={`${discussionRoute}/:discussionId/:discussionSlug?`}>
        <DiscussionPage />
      </PrivateRoute>
      <PrivateRoute path={`${communityRoute}/:communityId/:communitySlug?`}>
        <CommunityPage />
      </PrivateRoute>
      <PrivateRoute path={`${groupRoute}/:groupId/:groupSlug?`}>
        <GroupPage />
      </PrivateRoute>
      <PrivateRoute path={`${connectionsRoute}/:type?`}>
        <ConnectionsPage />
      </PrivateRoute>
      <PrivateRoute exact path="/">
        <Home />
      </PrivateRoute>
      <Route exact path={notFoundRoute}>
        <NotFoundPage />
      </Route>
      <Redirect from="*" to={notFoundRoute} />
    </Switch>
  );
}

const PrivateRoute = ({ children, ...otherProps }: RouteProps) => {
  const { authState, authActions } = useAuthContext();
  const isAuthenticated = authState.authenticated;
  const isJailed = authState.jailed;
  useEffect(() => {
    if (!isAuthenticated) {
      authActions.authError("Please log in.");
    }
  });

  return (
    <>
      <Route
        {...otherProps}
        render={({ location }) =>
          isAuthenticated ? (
            isJailed ? (
              <Redirect to={jailRoute} />
            ) : (
              children
            )
          ) : (
            <Redirect
              to={{
                pathname: loginRoute,
                state: { from: location },
              }}
            />
          )
        }
      />
    </>
  );
};
