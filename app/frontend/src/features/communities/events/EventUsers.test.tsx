import { render, screen } from "@testing-library/react";
import { getProfileLinkA11yLabel } from "components/Avatar/constants";
import { USER_TITLE_SKELETON_TEST_ID } from "components/UserSummary";
import users from "test/fixtures/users.json";
import wrapper from "test/hookWrapper";
import { assertErrorAlert } from "test/utils";

import { SEE_ALL } from "./constants";
import EventUsers, { EventUsersProps } from "./EventUsers";

function renderEventUsers(props: Partial<EventUsersProps> = {}) {
  const defaultProps: EventUsersProps = {
    emptyState: "There aren't any users for this event yet!",
    error: null,
    isLoading: true,
    isUsersRefetching: false,
    userIds: [],
    users: new Map(users.map((user) => [user.userId, user])),
    title: "Users",
  };
  render(<EventUsers {...defaultProps} {...props} />, { wrapper });
}

describe("Event users", () => {
  it("shows the loading state overall if the event user IDs and users map are loading", () => {
    renderEventUsers({ isLoading: true, users: undefined });

    expect(screen.getByRole("heading", { name: "Users" })).toBeVisible();
    expect(screen.getByRole("progressbar")).toBeVisible();
  });

  it("shows the users in a list if the event user IDs and users map have loaded", () => {
    renderEventUsers({ isLoading: false, userIds: [1, 2] });
    // User 1
    expect(screen.getByRole("img", { name: users[0].name })).toBeVisible();
    expect(screen.getByRole("heading", { name: users[0].name })).toBeVisible();

    // User 2
    expect(
      screen.getByRole("link", { name: getProfileLinkA11yLabel(users[1].name) })
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: users[1].name })).toBeVisible();
  });

  it("shows a newly added user in loading state while the users map is refetching", () => {
    renderEventUsers({
      isUsersRefetching: true,
      userIds: [1, 2, 3],
      users: new Map([
        [1, users[0]],
        [2, users[1]],
      ]),
    });

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    // User 1 and 2 should still be on screen
    expect(screen.getByRole("heading", { name: users[0].name })).toBeVisible();
    expect(screen.getByRole("heading", { name: users[1].name })).toBeVisible();
    // User 3 is shown as loading
    expect(screen.getByTestId(USER_TITLE_SKELETON_TEST_ID)).toBeVisible();
  });

  it("shows the 'See all' button if there are more users to show", () => {
    renderEventUsers({
      hasNextPage: true,
      isLoading: false,
      userIds: [1, 2],
    });

    expect(screen.getByRole("button", { name: SEE_ALL })).toBeVisible();
  });

  it("hides the user if it cannot be found and the users map is not refetching", async () => {
    renderEventUsers({
      isUsersRefetching: false,
      userIds: [1, 2, 3],
      users: new Map([
        [1, users[0]],
        [2, users[1]],
      ]),
    });
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    // User 1 and 2 should still be on screen
    expect(screen.getByRole("heading", { name: users[0].name })).toBeVisible();
    expect(screen.getByRole("heading", { name: users[1].name })).toBeVisible();
    // The mystery user 3 is hidden
    expect(
      screen.queryByTestId(USER_TITLE_SKELETON_TEST_ID)
    ).not.toBeInTheDocument();
  });

  it("shows an error alert if the event user IDs failed to load", async () => {
    const errorMessage = "Error loading event users";
    renderEventUsers({ error: { code: 2, message: errorMessage } });

    await assertErrorAlert(errorMessage);
    // Empty state should not be shown if there is an error
    expect(
      screen.queryByText("There aren't any users for this event yet!")
    ).not.toBeInTheDocument();
  });
});
