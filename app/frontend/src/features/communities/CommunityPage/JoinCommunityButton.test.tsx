import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  JOIN_COMMUNITY,
  LEAVE_COMMUNITY,
} from "features/communities/constants";
import { useCommunity } from "features/communities/hooks";
import { service } from "service";
import mockCommunity from "test/fixtures/community.json";
import wrapper from "test/hookWrapper";
import { mockConsoleError, MockedService } from "test/utils";

import JoinCommunityButton from "./JoinCommunityButton";

const getCommunityMock = service.communities.getCommunity as MockedService<
  typeof service.communities.getCommunity
>;
const joinCommunityMock = service.communities.joinCommunity as MockedService<
  typeof service.communities.joinCommunity
>;
const leaveCommunityMock = service.communities.leaveCommunity as MockedService<
  typeof service.communities.leaveCommunity
>;

function View() {
  const community = useCommunity(2);
  return community.data ? (
    <JoinCommunityButton community={community.data} />
  ) : null;
}

describe("JoinCommunityButton", () => {
  beforeEach(() => {
    getCommunityMock.mockResolvedValue({
      ...mockCommunity,
      member: false,
    });
    joinCommunityMock.mockImplementation(async () => {
      getCommunityMock.mockResolvedValue({
        ...mockCommunity,
        member: true,
      });
    });
    leaveCommunityMock.mockImplementation(async () => {
      getCommunityMock.mockResolvedValue({
        ...mockCommunity,
        member: false,
      });
    });
  });
  it("Leaves and joins correctly", async () => {
    render(<View />, { wrapper });
    const joinButton = await screen.findByRole("button", {
      name: JOIN_COMMUNITY,
    });
    expect(joinButton).toBeVisible();
    userEvent.click(joinButton);

    expect(screen.getByRole("progressbar")).toBeVisible();
    const leaveButton = await screen.findByRole("button", {
      name: LEAVE_COMMUNITY,
    });
    expect(leaveButton).toBeVisible();
    userEvent.click(leaveButton);
    expect(screen.getByRole("progressbar")).toBeVisible();
    expect(
      await screen.findByRole("button", { name: JOIN_COMMUNITY })
    ).toBeVisible();
  });

  it("Shows an error alert", async () => {
    mockConsoleError();
    joinCommunityMock.mockRejectedValueOnce(Error("generic error"));
    render(<View />, { wrapper });
    const joinButton = await screen.findByRole("button", {
      name: JOIN_COMMUNITY,
    });
    userEvent.click(joinButton);
    const errorAlert = await screen.findByRole("alert");
    expect(errorAlert).toBeVisible();
    expect(errorAlert).toHaveTextContent("generic error");
  });
});
