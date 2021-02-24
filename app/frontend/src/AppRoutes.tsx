import React from "react";
import { Redirect, Switch } from "react-router-dom";

import AppRoute from "./AppRoute";
import TOS from "./components/TOS";
import AuthPage from "./features/auth/AuthPage";
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
  const { authState } = useAuthContext();
  const isAuthenticated = authState.authenticated;

  return (
    <Switch>
      <AppRoute
        isPrivate={false}
        isFullscreen
        path={`${loginRoute}/:urlToken?`}
      >
        <Login />
      </AppRoute>
      <AppRoute
        isPrivate={false}
        isFullscreen
        path={`${signupRoute}/:urlToken?`}
      >
        <Signup />
      </AppRoute>

      <AppRoute isPrivate={false} isFullscreen exact path={resetPasswordRoute}>
        <ResetPasswordPage />
      </AppRoute>
      <AppRoute
        isPrivate={false}
        exact
        path={`${resetPasswordRoute}/:resetToken`}
      >
        <CompleteResetPasswordPage />
      </AppRoute>
      <AppRoute
        isPrivate={false}
        path={`${confirmChangeEmailRoute}/:resetToken`}
      >
        <ConfirmChangeEmailPage />
      </AppRoute>
      <AppRoute isFullscreen isPrivate={false} path={tosRoute}>
        <TOS />
      </AppRoute>
      <AppRoute isPrivate path={changePasswordRoute}>
        <ChangePasswordPage />
      </AppRoute>
      <AppRoute isPrivate path={changeEmailRoute}>
        <ChangeEmailPage />
      </AppRoute>
      <AppRoute isPrivate path={mapRoute}>
        <MapPage />
      </AppRoute>
      <AppRoute isPrivate={false} path={jailRoute}>
        <Jail />
      </AppRoute>
      <AppRoute isPrivate={false} exact path={logoutRoute}>
        <Logout />
      </AppRoute>
      <AppRoute isPrivate path={editProfileRoute}>
        <EditProfilePage />
      </AppRoute>
      <AppRoute isPrivate path={editHostingPreferenceRoute}>
        <EditHostingPreferencePage />
      </AppRoute>
      <AppRoute isPrivate path={profileRoute}>
        <ProfilePage />
      </AppRoute>
      <AppRoute isPrivate path={`${messagesRoute}/:type?`}>
        <Messages />
      </AppRoute>
      <AppRoute isPrivate path={`${userRoute}/:username`}>
        <UserPage />
      </AppRoute>
      <AppRoute isPrivate path={`${searchRoute}/:query?`}>
        <SearchPage />
      </AppRoute>
      <AppRoute isPrivate path={newPlaceRoute}>
        <NewPlacePage />
      </AppRoute>
      <AppRoute isPrivate path={`${placeRoute}/:pageId/:pageSlug?`}>
        <PagePage pageType={PageType.PAGE_TYPE_PLACE} />
      </AppRoute>
      <AppRoute isPrivate path={newGuideRoute}>
        <NewGuidePage />
      </AppRoute>
      <AppRoute isPrivate path={`${guideRoute}/:pageId/:pageSlug?`}>
        <PagePage pageType={PageType.PAGE_TYPE_GUIDE} />
      </AppRoute>
      <AppRoute
        isPrivate
        path={`${discussionRoute}/:discussionId/:discussionSlug?`}
      >
        <DiscussionPage />
      </AppRoute>
      <AppRoute
        isPrivate
        path={`${communityRoute}/:communityId/:communitySlug?`}
      >
        <CommunityPage />
      </AppRoute>
      <AppRoute isPrivate path={`${groupRoute}/:groupId/:groupSlug?`}>
        <GroupPage />
      </AppRoute>
      <AppRoute isPrivate path={`${connectionsRoute}/:type?`}>
        <ConnectionsPage />
      </AppRoute>

      <AppRoute
        isPrivate={isAuthenticated}
        isFullscreen={!isAuthenticated}
        exact
        path="/"
      >
        {isAuthenticated ? <Home /> : <AuthPage />}
      </AppRoute>
      <AppRoute isPrivate={false} exact path={notFoundRoute}>
        <NotFoundPage />
      </AppRoute>
      <Redirect from="*" to={notFoundRoute} />
    </Switch>
  );
}
