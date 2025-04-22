import { render, screen } from "@testing-library/react";
import { HostingStatus, MeetupStatus } from "proto/api_pb";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { addDefaultUser } from "test/utils";

import { hostingStatusLabels, meetupStatusLabels } from "../constants";
import { ProfileUserProvider } from "../hooks/useProfileUser";
import UserOverview from "./UserOverview";

const { t } = i18n;

describe("UserOverview", () => {
  beforeEach(() => {
    addDefaultUser();
  });

  describe("when user is loaded and provided via context", () => {
    it("should display the user name", () => {
      render(
        <ProfileUserProvider user={defaultUser}>
          <UserOverview showHostAndMeetAvailability={false} />
        </ProfileUserProvider>,
        { wrapper },
      );
      expect(screen.getByText(defaultUser.name)).toBeInTheDocument();
    });

    it("should display the user username with a leading @", () => {
      render(
        <ProfileUserProvider user={defaultUser}>
          <UserOverview showHostAndMeetAvailability={false} />
        </ProfileUserProvider>,
        { wrapper },
      );
      expect(screen.getByText(`@${defaultUser.username}`)).toBeInTheDocument();
    });

    it("should display the user location", () => {
      render(
        <ProfileUserProvider user={defaultUser}>
          <UserOverview showHostAndMeetAvailability={false} />
        </ProfileUserProvider>,
        { wrapper },
      );
      expect(screen.getByText(defaultUser.city)).toBeInTheDocument();
    });

    describe("hosting and meeting status", () => {
      const expectedLabelHosting =
        hostingStatusLabels(t)[defaultUser.hostingStatus as HostingStatus];
      const expectedLabelMeeting =
        meetupStatusLabels(t)[defaultUser.meetupStatus as MeetupStatus];

      it("should display the hosting and meeting status when showHostAndMeetAvailability is true", () => {
        render(
          <ProfileUserProvider user={defaultUser}>
            <UserOverview showHostAndMeetAvailability />
          </ProfileUserProvider>,
          { wrapper },
        );
        expect(screen.getByText(expectedLabelHosting)).toBeInTheDocument();
        expect(screen.getByText(expectedLabelMeeting)).toBeInTheDocument();
      });

      it("should not display the hosting and meeting status when showHostAndMeetAvailability is false", () => {
        render(
          <ProfileUserProvider user={defaultUser}>
            <UserOverview showHostAndMeetAvailability={false} />
          </ProfileUserProvider>,
          { wrapper },
        );
        expect(
          screen.queryByText(expectedLabelHosting),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText(expectedLabelMeeting),
        ).not.toBeInTheDocument();
      });
    });

    it("should display the community and verification scores when the feature flag is enabled", () => {
      const previousEnvValueVerificationEnabled =
        process.env.NEXT_PUBLIC_IS_VERIFICATION_ENABLED;
      process.env.NEXT_PUBLIC_IS_VERIFICATION_ENABLED = "true";
      const previousEnvValuePostBetaEnabled =
        process.env.NEXT_PUBLIC_IS_POST_BETA_ENABLED;
      process.env.NEXT_PUBLIC_IS_POST_BETA_ENABLED = "true";

      const expectedLabelCommunity = t("global:community_standing");
      const expectedLabelVerification = t("global:verification_score");

      render(
        <ProfileUserProvider user={defaultUser}>
          <UserOverview showHostAndMeetAvailability={false} />
        </ProfileUserProvider>,
        { wrapper },
      );
      expect(screen.getByText(expectedLabelCommunity)).toBeInTheDocument();
      expect(screen.getByText(expectedLabelVerification)).toBeInTheDocument();

      process.env.NEXT_PUBLIC_IS_VERIFICATION_ENABLED =
        previousEnvValueVerificationEnabled;
      process.env.NEXT_PUBLIC_IS_POST_BETA_ENABLED =
        previousEnvValuePostBetaEnabled;
    });

    it("should render the action buttons", () => {
      render(
        <ProfileUserProvider user={defaultUser}>
          <UserOverview
            showHostAndMeetAvailability={false}
            actions={
              <>
                <button>Edit profile</button>
              </>
            }
          />
        </ProfileUserProvider>,
        { wrapper },
      );
      expect(screen.getByText("Edit profile")).toBeInTheDocument();
    });

    it("should not show badge when no strong verification", () => {
      render(
        <ProfileUserProvider
          user={{ ...defaultUser, hasStrongVerification: false }}
        >
          <UserOverview showHostAndMeetAvailability={false} />
        </ProfileUserProvider>,
        { wrapper },
      );

      const verificationBadge = screen.queryByTestId("error-icon");
      expect(verificationBadge).toBeNull();
    });

    it("should show badge when user has strong verification", () => {
      render(
        <ProfileUserProvider
          user={{ ...defaultUser, hasStrongVerification: true }}
        >
          <UserOverview showHostAndMeetAvailability={false} />
        </ProfileUserProvider>,
        { wrapper },
      );
      expect(screen.getByTestId("strong-verification-id")).toBeInTheDocument();
    });
  });
});
