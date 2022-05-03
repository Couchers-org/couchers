import { render } from "@testing-library/react";
import { HostingStatus, MeetupStatus } from "proto/api_pb";
import wrapper from "test/hookWrapper";
import { addDefaultUser } from "test/utils";

import {
  COMMUNITY_STANDING,
  hostingStatusLabels,
  meetupStatusLabels,
  VERIFICATION_SCORE,
} from "../constants";
import { ProfileUserProvider } from "../hooks/useProfileUser";
import UserOverview from "./UserOverview";

describe("UserOverview", () => {
  beforeEach(() => {
    addDefaultUser();
  });

  describe("when user is loaded and provided via context", () => {
    it("should display the user name", () => {
      const { getByText } = render(
        <ProfileUserProvider user={defaultUser}>
          <UserOverview showHostAndMeetAvailability={false} />
        </ProfileUserProvider>,
        { wrapper }
      );
      expect(getByText(defaultUser.name)).toBeInTheDocument();
    });

    it("should display the user location", () => {
      const { getByText } = render(
        <ProfileUserProvider user={defaultUser}>
          <UserOverview showHostAndMeetAvailability={false} />
        </ProfileUserProvider>,
        { wrapper }
      );
      expect(getByText(defaultUser.city)).toBeInTheDocument();
    });

    it("should display the hosting and meeting status only when showHostAndMeetAvailability is true", () => {
      const expectedLabelHosting =
        hostingStatusLabels[defaultUser.hostingStatus as HostingStatus];
      const expectedLabelMeeting =
        meetupStatusLabels[defaultUser.meetupStatus as MeetupStatus];

      const { queryByText, getByText, rerender } = render(
        <ProfileUserProvider user={defaultUser}>
          <UserOverview showHostAndMeetAvailability={false} />
        </ProfileUserProvider>,
        { wrapper }
      );
      expect(queryByText(expectedLabelHosting)).not.toBeInTheDocument();
      expect(queryByText(expectedLabelMeeting)).not.toBeInTheDocument();
      rerender(
        <ProfileUserProvider user={defaultUser}>
          <UserOverview showHostAndMeetAvailability />
        </ProfileUserProvider>
      );
      expect(getByText(expectedLabelHosting)).toBeInTheDocument();
      expect(getByText(expectedLabelMeeting)).toBeInTheDocument();
    });

    it("should display the community and verification scores when the feature flag is enabled", () => {
      const previousEnvValueVerificationEnabled =
        process.env.NEXT_PUBLIC_IS_VERIFICATION_ENABLED;
      process.env.NEXT_PUBLIC_IS_VERIFICATION_ENABLED = "true";
      const previousEnvValuePostBetaEnabled =
        process.env.NEXT_PUBLIC_IS_POST_BETA_ENABLED;
      process.env.NEXT_PUBLIC_IS_POST_BETA_ENABLED = "true";

      const expectedLabelCommunity = COMMUNITY_STANDING;
      const expectedLabelVerification = VERIFICATION_SCORE;

      const { getByText } = render(
        <ProfileUserProvider user={defaultUser}>
          <UserOverview showHostAndMeetAvailability={false} />
        </ProfileUserProvider>,
        { wrapper }
      );
      expect(getByText(expectedLabelCommunity)).toBeInTheDocument();
      expect(getByText(expectedLabelVerification)).toBeInTheDocument();

      process.env.NEXT_PUBLIC_IS_VERIFICATION_ENABLED =
        previousEnvValueVerificationEnabled;
      process.env.NEXT_PUBLIC_IS_POST_BETA_ENABLED =
        previousEnvValuePostBetaEnabled;
    });

    it("should render the action buttons", () => {
      const { getByText } = render(
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
        { wrapper }
      );
      expect(getByText("Edit profile")).toBeInTheDocument();
    });
  });
});
