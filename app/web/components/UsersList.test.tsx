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
import { getLiteUsers } from "test/serviceMockDefaults";
import { assertErrorAlert } from "test/utils";

import UsersList from "./UsersList";

const getLiteUsersMock = service.user.getLiteUsers as jest.MockedFunction<
  typeof service.user.getLiteUsers
>;

describe("UsersList", () => {
  beforeEach(() => {
    getLiteUsersMock.mockImplementation(getLiteUsers);
  });

  it("shows the users in a list if the user IDs and users map have loaded", async () => {
    render(<UsersList userIds={[1, 2]} />, { wrapper });

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

  it("shows a loading spinner when userIds are undefined", () => {
    render(
      <UsersList
        userIds={undefined}
        endChildren={<>I'm at the end!</>}
        emptyListChildren={<>I show up when the map is empty!</>}
      />,
      { wrapper },
    );

    expect(screen.queryByRole("progressbar")).toBeInTheDocument();

    expect(
      screen.queryByTestId(USER_TITLE_SKELETON_TEST_ID),
    ).not.toBeInTheDocument();

    expect(screen.queryByText("I'm at the end!")).not.toBeInTheDocument();
    expect(
      screen.queryByText("I show up when the map is empty!"),
    ).not.toBeInTheDocument();
  });

  it("shows a loading skeleton while map is fetching", () => {
    render(
      <UsersList
        userIds={[2]}
        endChildren={<>I'm at the end!</>}
        emptyListChildren={<>I show up when the map is empty!</>}
      />,
      { wrapper },
    );

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    expect(screen.getByTestId(USER_TITLE_SKELETON_TEST_ID)).toBeVisible();

    expect(screen.queryByText("I'm at the end!")).not.toBeInTheDocument();
    expect(
      screen.queryByText("I show up when the map is empty!"),
    ).not.toBeInTheDocument();
  });

  it("hides skeleton when map is done fetching", () => {
    render(<UsersList userIds={[2]} />, { wrapper });

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    expect(screen.getByTestId(USER_TITLE_SKELETON_TEST_ID)).toBeVisible();
  });

  it("shows only found users when map is done fetching", async () => {
    render(<UsersList userIds={[2, 99]} />, { wrapper });

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    await waitForElementToBeRemoved(
      screen.queryAllByTestId(USER_TITLE_SKELETON_TEST_ID),
    );

    // have user 2
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

    // don't have non-existent user 99
    expect(
      screen.queryByTestId(USER_TITLE_SKELETON_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it("shows endChildren but not emptyListChildren when map is not empty", async () => {
    render(
      <UsersList
        userIds={[2, 99]}
        endChildren={<>I'm at the end!</>}
        emptyListChildren={<>I show up when the map is empty!</>}
      />,
      { wrapper },
    );

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    await waitForElementToBeRemoved(
      screen.queryAllByTestId(USER_TITLE_SKELETON_TEST_ID),
    );

    // have user 2
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

    // don't have non-existent user 99
    expect(
      screen.queryByTestId(USER_TITLE_SKELETON_TEST_ID),
    ).not.toBeInTheDocument();

    // have end children
    expect(await screen.findByText("I'm at the end!")).toBeVisible();
    // don't have empty children
    expect(
      screen.queryByText("I show up when the map is empty!"),
    ).not.toBeInTheDocument();
  });

  it("shows emptyListChildren but not endChildren when map is empty", async () => {
    render(
      <UsersList
        userIds={[]}
        endChildren={<>I'm at the end!</>}
        emptyListChildren={<>I show up when the map is empty!</>}
      />,
      { wrapper },
    );

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    expect(
      screen.queryByTestId(USER_TITLE_SKELETON_TEST_ID),
    ).not.toBeInTheDocument();

    // don't have end children
    expect(screen.queryByText("I'm at the end!")).not.toBeInTheDocument();
    // have empty children
    expect(
      await screen.findByText("I show up when the map is empty!"),
    ).toBeVisible();
  });

  it("shows emptyListChildren but not endChildren when map is not empty but no users were found", async () => {
    render(
      <UsersList
        userIds={[99, 102]}
        endChildren={<>I'm at the end!</>}
        emptyListChildren={<>I show up when the map is empty!</>}
      />,
      { wrapper },
    );

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    await waitForElementToBeRemoved(
      screen.queryAllByTestId(USER_TITLE_SKELETON_TEST_ID),
    );

    // don't have end children
    expect(screen.queryByText("I'm at the end!")).not.toBeInTheDocument();
    // have empty children
    expect(
      await screen.findByText("I show up when the map is empty!"),
    ).toBeVisible();
  });

  it("shows an error alert if the event user IDs failed to load", async () => {
    const errorMessage = "Error loading event users";
    render(
      <UsersList
        userIds={[]}
        error={{
          code: 2,
          message: errorMessage,
          name: "grpcError",
          metadata: {},
        }}
      />,
      { wrapper },
    );

    await assertErrorAlert(errorMessage);
    // Empty state should not be shown if there is an error
    expect(
      screen.queryByText("There aren't any users for this event yet!"),
    ).not.toBeInTheDocument();
  });
});
