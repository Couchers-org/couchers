import React, { useEffect } from "react";
import { Redirect, Route, RouteProps, Switch } from "react-router-dom";

import TOS from "./components/TOS";
import { useAuthContext } from "./features/auth/AuthProvider";
import ChangeEmailPage from "./features/auth/email/ChangeEmailPage";
import ConfirmChangeEmailPage from "./features/auth/email/ConfirmChangeEmailPage";
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
import NewGuidePage from "./features/communities/NewGuidePage";
import NewPlacePage from "./features/communities/NewPlacePage";
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
import {
  changeEmailRoute,
  changePasswordRoute,
  communityRoute,
  confirmChangeEmailRoute,
  connectionsRoute,
  discussionRoute,
  editHostingPreferenceRoute,
  editProfileRoute,
  groupRoute,
  guideRoute,
  jailRoute,
  loginRoute,
  logoutRoute,
  mapRoute,
  messagesRoute,
  newGuideRoute,
  newPlaceRoute,
  notFoundRoute,
  placeRoute,
  profileRoute,
  resetPasswordRoute,
  searchRoute,
  signupRoute,
  tosRoute,
  userRoute,
} from "./routes";

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
      <Route path={`${confirmChangeEmailRoute}/:resetToken`}>
        <ConfirmChangeEmailPage />
      </Route>
      <Route path={tosRoute}>
        <TOS />
      </Route>
      <PrivateRoute path={changePasswordRoute}>
        <ChangePasswordPage />
      </PrivateRoute>
      <PrivateRoute path={changeEmailRoute}>
        <ChangeEmailPage />
      </PrivateRoute>
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
        <NewPlacePage />
      </PrivateRoute>
      <PrivateRoute path={`${placeRoute}/:pageId/:pageSlug?`}>
        <PagePage pageType={PageType.PAGE_TYPE_PLACE} />
      </PrivateRoute>
      <PrivateRoute path={newGuideRoute}>
        <NewGuidePage />
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
