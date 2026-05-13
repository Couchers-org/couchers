import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useProfileSheet } from "features/profile/ProfileSheetContext";
import wrapper from "test/hookWrapper";
import { useIsNativeEmbed } from "utils/nativeLink";

import ProfileLink from "./ProfileLink";

jest.mock("utils/nativeLink", () => ({
  useIsNativeEmbed: jest.fn(),
}));

jest.mock("features/profile/ProfileSheetContext", () => ({
  useProfileSheet: jest.fn(),
}));

const mockOpenProfileSheet = jest.fn();

describe("ProfileLink", () => {
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

  it("renders a button on native when userId is provided", () => {
    (useIsNativeEmbed as jest.Mock).mockReturnValue(true);
    render(
      <ProfileLink userId={1} username="testuser">
        Test
      </ProfileLink>,
      { wrapper },
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("opens profile sheet with correct userId when clicked on native", async () => {
    (useIsNativeEmbed as jest.Mock).mockReturnValue(true);
    render(
      <ProfileLink userId={42} username="testuser">
        Test
      </ProfileLink>,
      { wrapper },
    );
    await userEvent.click(screen.getByRole("button"));
    expect(mockOpenProfileSheet).toHaveBeenCalledWith(42);
  });

  it("renders a link on native when userId is not provided", () => {
    (useIsNativeEmbed as jest.Mock).mockReturnValue(true);
    render(
      <ProfileLink username="testuser">Test</ProfileLink>,
      { wrapper },
    );
    expect(screen.getByRole("link")).toBeInTheDocument();
  });
});
