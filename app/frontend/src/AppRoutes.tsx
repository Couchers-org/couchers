import PageTitle from "components/PageTitle";
import TextBody from "components/TextBody";
import EditCommunityInfoPage from "features/communities/EditCommunityInfoPage";
import Contribute from "features/Contribute";
import EditProfilePage from "features/profile/edit/EditProfilePage";
import UserPage from "features/profile/view/UserPage";
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
import { DiscussionPage } from "./features/communities/discussions";
import GroupPage from "./features/communities/GroupPage";
import NewGuidePage from "./features/communities/NewGuidePage";
import NewPlacePage from "./features/communities/NewPlacePage";
import PagePage from "./features/communities/PagePage";
import { ConnectionsPage } from "./features/connections";
import Home from "./features/dashboard/Home";
import DonationPage from "./features/donations/DonationPage";
import Messages from "./features/messages/index";
import NotFoundPage from "./features/NotFoundPage";
import LeaveReferencePage from "./features/profile/view/leaveReference/LeaveReferencePage";
import ProfilePage from "./features/profile/view/ProfilePage";
import SearchPage from "./features/search/SearchPage";
import { PageType } from "./proto/pages_pb";
import {
  baseRoute,
  communityRoute,
  confirmChangeEmailRoute,
  connectionsRoute,
  contributeRoute,
  discussionRoute,
  donationRoute,
  editCommunityPageRoute,
  editProfileRoute,
  eventsRoute,
  groupRoute,
  guideRoute,
  jailRoute,
  leaveReferenceRoute,
  loginRoute,
  logoutRoute,
  messagesRoute,
  newGuideRoute,
  newPlaceRoute,
  placeRoute,
  profileRoute,
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
        variant={!isAuthenticated ? "full-screen" : "standard"}
        exact
        path={baseRoute}
      >
        {isAuthenticated ? <Home /> : <AuthPage />}
      </AppRoute>
      <AppRoute
        isPrivate={false}
        variant="full-screen"
        path={`${loginRoute}/:urlToken?`}
      >
        <Login />
      </AppRoute>
      <AppRoute
        isPrivate={false}
        variant="full-screen"
        path={`${signupRoute}/:urlToken?`}
      >
        <Signup />
      </AppRoute>

      <AppRoute
        isPrivate={false}
        variant="full-screen"
        exact
        path={resetPasswordRoute}
      >
        <ResetPassword />
      </AppRoute>
      <AppRoute
        isPrivate={false}
        variant="full-screen"
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
      <AppRoute variant="full-screen" isPrivate={false} path={tosRoute}>
        <TOS />
      </AppRoute>
      <AppRoute isPrivate path={settingsRoute}>
        <Settings />
      </AppRoute>
      <AppRoute isPrivate={false} path={jailRoute}>
        <Jail />
      </AppRoute>
      <AppRoute isPrivate={false} exact path={logoutRoute}>
        <Logout />
      </AppRoute>

      {
        // CONTRIBUTE
      }
      <AppRoute
        isPrivate={false}
        variant="full-screen"
        exact
        path={contributeRoute}
      >
        <Contribute />
      </AppRoute>

      {
        // PROFILE
      }
      <AppRoute isPrivate path={editProfileRoute}>
        <EditProfilePage />
      </AppRoute>
      <AppRoute variant="full-width" isPrivate path={profileRoute}>
        <ProfilePage />
      </AppRoute>
      <AppRoute variant="full-width" isPrivate path={userRoute}>
        <UserPage />
      </AppRoute>
      <AppRoute isPrivate path={`${connectionsRoute}/:type?`}>
        <ConnectionsPage />
      </AppRoute>
      <AppRoute isPrivate path={leaveReferenceRoute}>
        <LeaveReferencePage />
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
      <AppRoute isPrivate variant="full-width" path={searchRoute}>
        <SearchPage />
      </AppRoute>

      {
        // DONATE
      }
      <AppRoute isPrivate path={donationRoute}>
        <DonationPage />
      </AppRoute>

      {
        // COMMUNITIES
      }
      <AppRoute isPrivate exact path={communityRoute}>
        <CommunityPage />
      </AppRoute>
      <AppRoute isPrivate path={editCommunityPageRoute}>
        <EditCommunityInfoPage />
      </AppRoute>
      <AppRoute isPrivate path={discussionRoute}>
        <DiscussionPage />
      </AppRoute>

      {process.env.REACT_APP_IS_COMMUNITIES_PART2_ENABLED && (
        <>
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
          <AppRoute isPrivate path={groupRoute}>
            <GroupPage />
          </AppRoute>
        </>
      )}

      {
        // 404 NOT FOUND
      }
      <AppRoute isPrivate={false}>
        <NotFoundPage />
      </AppRoute>
    </Switch>
  );
}
