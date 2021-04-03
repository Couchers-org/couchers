import PageTitle from "components/PageTitle";
import TextBody from "components/TextBody";
import React from "react";
import { Switch } from "react-router-dom";

import AppRoute from "./AppRoute";
import TOS from "./components/TOS";
import AuthPage from "./features/auth/AuthPage";
import { useAuthContext } from "./features/auth/AuthProvider";
import ConfirmChangeEmail from "./features/auth/email/ConfirmChangeEmail";
import Jail from "./features/auth/jail/Jail";
import Login from "./features/auth/login/Login";
import Logout from "./features/auth/Logout";
import { CompleteResetPassword, ResetPassword } from "./features/auth/password";
import Settings from "./features/auth/Settings";
import Signup from "./features/auth/signup/Signup";
import CommunityPage from "./features/communities/CommunityPage";
import { DiscussionPage } from "./features/communities/discussion";
import GroupPage from "./features/communities/GroupPage";
import NewGuidePage from "./features/communities/NewGuidePage";
import NewPlacePage from "./features/communities/NewPlacePage";
import PagePage from "./features/communities/PagePage";
import { ConnectionsPage } from "./features/connections";
import Home from "./features/Home";
import MapPage from "./features/map/MapPage";
import Messages from "./features/messages/index";
import NotFoundPage from "./features/NotFoundPage";
import EditHostingPreference from "./features/profile/edit/EditHostingPreference";
import EditProfile from "./features/profile/edit/EditProfile";
import ProfilePage from "./features/profile/view/ProfilePage";
import SearchPage from "./features/search/SearchPage";
import { PageType } from "./pb/pages_pb";
import {
  baseRoute,
  communityRoute,
  confirmChangeEmailRoute,
  connectionsRoute,
  discussionRoute,
  editHostingPreferenceRoute,
  editProfileRoute,
  eventsRoute,
  groupRoute,
  guideRoute,
  jailRoute,
  loginRoute,
  logoutRoute,
  mapRoute,
  messagesRoute,
  newGuideRoute,
  newPlaceRoute,
  placeRoute,
  resetPasswordRoute,
  searchRoute,
  settingsRoute,
  signupRoute,
  tosRoute,
  userRoute,
} from "./routes";

export default function AppRoutes() {
  const { authState } = useAuthContext();
  const isAuthenticated = authState.authenticated;

  return (
    <Switch>
      {
        // AUTH
      }
      <AppRoute
        isPrivate={isAuthenticated}
        isFullscreen={!isAuthenticated}
        exact
        path={baseRoute}
      >
        {isAuthenticated ? <Home /> : <AuthPage />}
      </AppRoute>
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
        <ResetPassword />
      </AppRoute>
      <AppRoute
        isPrivate={false}
        exact
        path={`${resetPasswordRoute}/:resetToken`}
      >
        <CompleteResetPassword />
      </AppRoute>
      <AppRoute
        isPrivate={false}
        path={`${confirmChangeEmailRoute}/:resetToken`}
      >
        <ConfirmChangeEmail />
      </AppRoute>
      <AppRoute isFullscreen isPrivate={false} path={tosRoute}>
        <TOS />
      </AppRoute>
      <AppRoute isPrivate path={settingsRoute}>
        <Settings />
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

      {
        // PROFILE
      }
      <AppRoute isPrivate path={editProfileRoute}>
        <EditProfile />
      </AppRoute>
      <AppRoute isPrivate path={editHostingPreferenceRoute}>
        <EditHostingPreference />
      </AppRoute>
      <AppRoute isPrivate path={`${userRoute}/:username?`}>
        <ProfilePage />
      </AppRoute>
      <AppRoute isPrivate path={`${connectionsRoute}/:type?`}>
        <ConnectionsPage />
      </AppRoute>

      {
        // MESSAGES
      }
      <AppRoute isPrivate path={`${messagesRoute}/:type?`}>
        <Messages />
      </AppRoute>

      {
        // EVENTS
      }
      <AppRoute isPrivate path={eventsRoute}>
        <PageTitle>Events</PageTitle>
        <TextBody>Events are coming soon!</TextBody>
      </AppRoute>

      {
        // SEARCH
      }
      <AppRoute isPrivate path={`${searchRoute}/:query?`}>
        <SearchPage />
      </AppRoute>

      {
        // COMMUNITIES
      }
      <AppRoute isPrivate path={communityRoute}>
        <CommunityPage />
      </AppRoute>

      <AppRoute isPrivate path={newPlaceRoute}>
        <NewPlacePage />
      </AppRoute>
      <AppRoute isPrivate path={placeRoute}>
        <PagePage pageType={PageType.PAGE_TYPE_PLACE} />
      </AppRoute>
      <AppRoute isPrivate path={newGuideRoute}>
        <NewGuidePage />
      </AppRoute>
      <AppRoute isPrivate path={guideRoute}>
        <PagePage pageType={PageType.PAGE_TYPE_GUIDE} />
      </AppRoute>
      <AppRoute isPrivate path={discussionRoute}>
        <DiscussionPage />
      </AppRoute>
      <AppRoute isPrivate path={groupRoute}>
        <GroupPage />
      </AppRoute>

      {
        // 404 NOT FOUND
      }
      <AppRoute isPrivate={false}>
        <NotFoundPage />
      </AppRoute>
    </Switch>
  );
}
