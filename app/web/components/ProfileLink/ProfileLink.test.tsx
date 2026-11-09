import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useProfileSheet } from "features/profile/ProfileSheetContext";
import wrapper from "test/hookWrapper";
import { createMatchMedia } from "test/utils";
import { useIsNativeEmbed } from "utils/nativeLink";

import ProfileLink from "./ProfileLink";

jest.mock("utils/nativeLink", () => ({
  useIsNativeEmbed: jest.fn(),
}));

jest.mock("features/profile/ProfileSheetContext", () => ({
  useProfileSheet: jest.fn(),
}));

const mockOpenProfileSheet = jest.fn();
const originalMatchMedia = window.matchMedia;

describe("ProfileLink", () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useProfileSheet as jest.Mock).mockReturnValue({
      openProfileSheet: mockOpenProfileSheet,
      closeProfileSheet: jest.fn(),
      openProfileUserId: null,
      openGroupChatId: null,
      openGroupChat: jest.fn(),
      closeGroupChat: jest.fn(),
    });
  });

  it("renders a link on web", () => {
    (useIsNativeEmbed as jest.Mock).mockReturnValue(false);
    render(
      <ProfileLink userId={1} username="testuser">
        Test
      </ProfileLink>,
      { wrapper },
    );
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

  it("renders a link to the profile on native so it can be opened directly too", () => {
    (useIsNativeEmbed as jest.Mock).mockReturnValue(true);
    render(
      <ProfileLink userId={1} username="testuser">
        Test
      </ProfileLink>,
      { wrapper },
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/user/testuser");
  });

  it("opens profile sheet with correct userId when clicked on native", async () => {
    (useIsNativeEmbed as jest.Mock).mockReturnValue(true);
    render(
      <ProfileLink userId={42} username="testuser">
        Test
      </ProfileLink>,
      { wrapper },
    );
    await userEvent.click(screen.getByRole("link"));
    expect(mockOpenProfileSheet).toHaveBeenCalledWith(42);
  });

  it("navigates instead of opening the sheet on native when userId is not provided", async () => {
    (useIsNativeEmbed as jest.Mock).mockReturnValue(true);
    render(<ProfileLink username="testuser">Test</ProfileLink>, { wrapper });
    await userEvent.click(screen.getByRole("link"));
    expect(mockOpenProfileSheet).not.toHaveBeenCalled();
  });

  it("opens a new tab on desktop web when asked to", () => {
    (useIsNativeEmbed as jest.Mock).mockReturnValue(false);
    window.matchMedia = createMatchMedia(1180);
    render(
      <ProfileLink userId={1} username="testuser" openInNewTab>
        Test
      </ProfileLink>,
      { wrapper },
    );
    expect(screen.getByRole("link")).toHaveAttribute("target", "_blank");
  });

  it("navigates in place on native when there is no userId to open the sheet with", () => {
    (useIsNativeEmbed as jest.Mock).mockReturnValue(true);
    window.matchMedia = createMatchMedia(1180);
    render(
      <ProfileLink username="testuser" openInNewTab>
        Test
      </ProfileLink>,
      { wrapper },
    );
    expect(screen.getByRole("link")).not.toHaveAttribute("target");
  });
});
