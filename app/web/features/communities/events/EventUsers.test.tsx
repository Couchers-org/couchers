import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { getProfileLinkA11yLabel } from "components/Avatar/constants";
import { USER_TITLE_SKELETON_TEST_ID } from "components/UserSummary";
import { service } from "service";
import users from "test/fixtures/liteUsers.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getLiteUsers } from "test/serviceMockDefaults";
import { assertErrorAlert } from "test/utils";

import EventUsers, { EventUsersProps } from "./EventUsers";

const { t } = i18n;

const getLiteUsersMock = service.user.getLiteUsers as jest.MockedFunction<
  typeof service.user.getLiteUsers
>;

function renderEventUsers(props: Partial<EventUsersProps> = {}) {
  const defaultProps: EventUsersProps = {
    emptyState: "There aren't any users for this event yet!",
    error: null,
    userIds: [],
    title: "Users",
  };
  render(<EventUsers {...defaultProps} {...props} />, { wrapper });
}

describe("Event users", () => {
  beforeEach(() => {
    getLiteUsersMock.mockImplementation(getLiteUsers);
  });

  it("shows the users in a list if the event user IDs and users map have loaded", async () => {
    renderEventUsers({ userIds: [1, 2] });

    await waitForElementToBeRemoved(
      screen.queryAllByTestId(USER_TITLE_SKELETON_TEST_ID),
    );

    // User 1
    expect(screen.getByRole("img", { name: users[0].name })).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: `${users[0].name}, ${users[0].age}`,
      }),
    ).toBeVisible();

    // User 2
    expect(
      screen.getByRole("link", {
        name: getProfileLinkA11yLabel(users[1].name),
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: `${users[1].name}, ${users[1].age}`,
      }),
    ).toBeVisible();
  });

  it("shows the 'See all' button if there are more users to show", async () => {
    renderEventUsers({
      hasNextPage: true,
      userIds: [1, 2],
    });

    await waitForElementToBeRemoved(
      screen.queryAllByTestId(USER_TITLE_SKELETON_TEST_ID),
    );

    expect(
      screen.getByRole("button", { name: t("communities:see_all") }),
    ).toBeVisible();
  });

  it("shows an error alert if the event user IDs failed to load", async () => {
    const errorMessage = "Error loading event users";
    renderEventUsers({
      error: {
        code: 2,
        message: errorMessage,
        name: "grpcError",
        metadata: {},
      },
    });

    await assertErrorAlert(errorMessage);
    // Empty state should not be shown if there is an error
    expect(
      screen.queryByText("There aren't any users for this event yet!"),
    ).not.toBeInTheDocument();
  });
});
