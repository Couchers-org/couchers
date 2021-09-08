import { render, screen, within } from "@testing-library/react";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { getUser, listFriends } from "test/serviceMockDefaults";
import { MockedService } from "test/utils";

import { NO_FRIENDS } from "../constants";
import FriendList from "./FriendList";
import { FRIEND_ITEM_TEST_ID } from "./FriendSummaryView";

const listFriendsMock = service.api.listFriends as MockedService<
  typeof service.api.listFriends
>;
const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;

describe("FriendList", () => {
  beforeEach(() => {
    listFriendsMock.mockImplementation(listFriends);
    getUserMock.mockImplementation(getUser);
  });

  it("shows a loading indicator when the friend list is still loading", async () => {
    listFriendsMock.mockImplementation(() => new Promise(() => void 0));
    render(<FriendList />, { wrapper });

    expect(await screen.findByRole("progressbar")).toBeVisible();
  });

  it("renders the friend list when all friends are loaded", async () => {
    render(<FriendList />, { wrapper });

    const [firstFriend, secondFriend] = (
      await screen.findAllByTestId(FRIEND_ITEM_TEST_ID)
    ).map((element) => within(element));

    // First friend
    expect(
      firstFriend.getByRole("heading", { name: /Funny Dog/ })
    ).toBeVisible();

    // Second friend
    expect(
      secondFriend.getByRole("heading", { name: /Funny Kid/ })
    ).toBeVisible();
  });

  it("renders the empty state message if the current user has no friends", async () => {
    listFriendsMock.mockResolvedValue([]);
    render(<FriendList />, { wrapper });

    expect(await screen.findByText(NO_FRIENDS)).toBeVisible();
    expect(screen.queryByTestId(FRIEND_ITEM_TEST_ID)).not.toBeInTheDocument();
  });

  it("shows an error alert if the friend list failed to load", async () => {
    jest.spyOn(console, "error").mockReturnValue(undefined);
    listFriendsMock.mockRejectedValue(new Error("Error loading friends"));
    render(<FriendList />, { wrapper });

    const errorAlert = await screen.findByRole("alert");
    expect(within(errorAlert).getByText("Error loading friends")).toBeVisible();
  });
});
