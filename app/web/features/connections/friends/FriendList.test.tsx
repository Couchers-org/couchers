import { render, screen, within } from "@testing-library/react";
import users from "test/fixtures/users.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import FriendList from "./FriendList";
import { FRIEND_ITEM_TEST_ID } from "./FriendSummaryView";

const { t } = i18n;

describe("FriendList", () => {
  it("shows a loading indicator when the friend list is still loading", async () => {
    render(<FriendList errors={[]} friends={[]} isLoading={true} />, {
      wrapper,
    });

    expect(await screen.findByRole("progressbar")).toBeVisible();
  });

  it("renders the friend list when all friends are loaded", async () => {
    render(<FriendList errors={[]} friends={[users[1], users[2]]} isLoading={false} />, { wrapper });

    const [firstFriend, secondFriend] = (await screen.findAllByTestId(FRIEND_ITEM_TEST_ID)).map((element) =>
      within(element),
    );

    // First friend
    expect(firstFriend.getByRole("heading", { name: /Funny Dog/ })).toBeVisible();

    // Second friend
    expect(secondFriend.getByRole("heading", { name: /Funny Kid/ })).toBeVisible();
  });

  it("renders the empty state message if the current user has no friends", async () => {
    render(<FriendList errors={[]} friends={[]} isLoading={false} />, {
      wrapper,
    });

    expect(await screen.findByText(t("connections:no_friends"))).toBeVisible();
    expect(screen.queryByTestId(FRIEND_ITEM_TEST_ID)).not.toBeInTheDocument();
  });

  it("shows an error alert if the friend list failed to load", async () => {
    jest.spyOn(console, "error").mockReturnValue(undefined);
    render(<FriendList errors={["Error loading friends"]} friends={[]} isLoading={false} />, { wrapper });

    const errorAlert = await screen.findByRole("alert");
    expect(within(errorAlert).getByText("Error loading friends")).toBeVisible();
  });
});
