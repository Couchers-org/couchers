import { render } from "@testing-library/react";
import { HostingStatus, MeetupStatus } from "proto/api_pb";
import wrapper from "test/hookWrapper";
import { addDefaultUser } from "test/utils";

import { hostingStatusLabels, meetupStatusLabels } from "../constants";
import { ProfileUserProvider } from "../hooks/useProfileUser";
import UserOverview from "./UserOverview";

describe("UserOverview", () => {
  beforeEach(() => {
    addDefaultUser();
  });

  describe("when user is missing", () => {
    it("doesn't fail", () => {
      render(<UserOverview />, { wrapper });
    });
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

    it("should display the hosting status only when showHostAndMeetAvailability is true", () => {
      const expectedLabel =
        hostingStatusLabels[defaultUser.hostingStatus as HostingStatus];

      const { queryByText, getByText, rerender } = render(
        <ProfileUserProvider user={defaultUser}>
          <UserOverview showHostAndMeetAvailability={false} />
        </ProfileUserProvider>,
        { wrapper }
      );
      expect(queryByText(expectedLabel)).not.toBeInTheDocument();
      rerender(
        <ProfileUserProvider user={defaultUser}>
          <UserOverview showHostAndMeetAvailability />
        </ProfileUserProvider>
      );
      expect(getByText(expectedLabel)).toBeInTheDocument();
      rerender(
        <ProfileUserProvider user={defaultUser}>
          <UserOverview />
        </ProfileUserProvider>
      );
      expect(getByText(expectedLabel)).toBeInTheDocument();
    });

    it("should display the meeting status only when showHostAndMeetAvailability is true", () => {
      const expectedLabel =
        meetupStatusLabels[defaultUser.meetupStatus as MeetupStatus];

      const { queryByText, getByText, rerender } = render(
        <ProfileUserProvider user={defaultUser}>
          <UserOverview showHostAndMeetAvailability={false} />
        </ProfileUserProvider>,
        { wrapper }
      );
      expect(queryByText(expectedLabel)).not.toBeInTheDocument();
      rerender(
        <ProfileUserProvider user={defaultUser}>
          <UserOverview showHostAndMeetAvailability />
        </ProfileUserProvider>
      );
      expect(getByText(expectedLabel)).toBeInTheDocument();
      rerender(
        <ProfileUserProvider user={defaultUser}>
          <UserOverview />
        </ProfileUserProvider>
      );
      expect(getByText(expectedLabel)).toBeInTheDocument();
    });

    it("should render the action buttons", () => {
      const { getByText } = render(
        <ProfileUserProvider user={defaultUser}>
          <UserOverview
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
