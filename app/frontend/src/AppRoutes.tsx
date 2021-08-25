import PageTitle from "components/PageTitle";
import TextBody from "components/TextBody";
import Login from "features/auth/login/Login";
import Signup from "features/auth/signup/Signup";
import HomePage from "features/landing/HomePage";
import LandingContent from "features/landing/LandingContent";
import React from "react";
import { Switch } from "react-router-dom";

import AppRoute from "./AppRoute";
import { useAuthContext } from "./features/auth/AuthProvider";
import { PageType } from "./proto/pages_pb";
import {
  aboutRoute,
  baseRoute,
  communityRoute,
  confirmChangeEmailRoute,
  connectionsRoute,
  contributeRoute,
  discussionRoute,
  donationsRoute,
  editCommunityPageRoute,
  editProfileRoute,
  eventRoute,
  eventsRoute,
  groupRoute,
  guideRoute,
  jailRoute,
  leaveReferenceRoute,
  loginRoute,
  logoutRoute,
  messagesRoute,
  newEventRoute,
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

const EditCommunityInfoPage = React.lazy(
  () => import("features/communities/EditCommunityInfoPage")
);
const CreateEventPage = React.lazy(
  () => import("features/communities/events/CreateEventPage")
);
const EventPage = React.lazy(
  () => import("features/communities/events/EventPage")
);
const ContributePage = React.lazy(() => import("features/ContributePage"));
const Donations = React.lazy(() => import("features/donations/Donations"));
const EditProfilePage = React.lazy(
  () => import("features/profile/edit/EditProfilePage")
);
const UserPage = React.lazy(() => import("features/profile/view/UserPage"));
const TOS = React.lazy(() => import("./components/TOS"));
const ConfirmChangeEmail = React.lazy(
  () => import("./features/auth/email/ConfirmChangeEmail")
);
const Jail = React.lazy(() => import("./features/auth/jail/Jail"));
const Logout = React.lazy(() => import("./features/auth/Logout"));
const CompleteResetPassword = React.lazy(
  () => import("./features/auth/password/CompleteResetPassword")
);
const ResetPassword = React.lazy(
  () => import("./features/auth/password/ResetPassword")
);
const Settings = React.lazy(() => import("./features/auth/Settings"));
const CommunityPage = React.lazy(
  () => import("./features/communities/CommunityPage")
);
const DiscussionPage = React.lazy(
  () => import("./features/communities/discussions/DiscussionPage")
);
const GroupPage = React.lazy(() => import("./features/communities/GroupPage"));
const NewGuidePage = React.lazy(
  () => import("./features/communities/NewGuidePage")
);
const NewPlacePage = React.lazy(
  () => import("./features/communities/NewPlacePage")
);
const PagePage = React.lazy(() => import("./features/communities/PagePage"));
const ConnectionsPage = React.lazy(
  () => import("./features/connections/ConnectionsPage")
);
const Home = React.lazy(() => import("./features/dashboard/Home"));
const Messages = React.lazy(() => import("./features/messages/index"));
const NotFoundPage = React.lazy(() => import("./features/NotFoundPage"));
const LeaveReferencePage = React.lazy(
  () => import("./features/profile/view/leaveReference/LeaveReferencePage")
);
const ProfilePage = React.lazy(
  () => import("./features/profile/view/ProfilePage")
);
const SearchPage = React.lazy(() => import("./features/search/SearchPage"));

export default function AppRoutes() {
  const { authState } = useAuthContext();
  const isAuthenticated = authState.authenticated;

  return (
    <Switch>
      {
        // ABOUT PAGES
      }

      <AppRoute isPrivate={false} variant="standard" path={aboutRoute}>
        <LandingPage />
      </AppRoute>
      {
        // AUTH
      }
      <AppRoute
        isPrivate={isAuthenticated}
        variant={!isAuthenticated ? "full-screen" : "standard"}
        exact
        path={baseRoute}
      >
        {isAuthenticated ? <Home /> : <HomePage />}
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
        // DONATE & CONTRIBUTE
      }

      <AppRoute isPrivate variant="full-width" path={donationsRoute}>
        <Donations />
      </AppRoute>
      <AppRoute isPrivate path={contributeRoute}>
        <ContributePage />
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
      <AppRoute isPrivate path={newEventRoute}>
        <CreateEventPage />
      </AppRoute>
      <AppRoute isPrivate path={eventRoute}>
        <EventPage />
      </AppRoute>

      {process.env.REACT_APP_IS_COMMUNITIES_PART2_ENABLED && (
        <Switch>
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
        </Switch>
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
