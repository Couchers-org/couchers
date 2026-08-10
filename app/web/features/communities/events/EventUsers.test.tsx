import { render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const getLiteUsersMock = service.user.getLiteUsers as jest.MockedFunction<typeof service.user.getLiteUsers>;

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

    await waitForElementToBeRemoved(screen.queryAllByTestId(USER_TITLE_SKELETON_TEST_ID));

    // User 1
    expect(screen.getByRole("img", { name: users[0].name })).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: users[0].name,
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
        name: users[1].name,
      }),
    ).toBeVisible();
  });

  it("renders users successfully when grid layout is passed", async () => {
    renderEventUsers({ userIds: [1, 2], layout: "grid" });

    await waitForElementToBeRemoved(screen.queryAllByTestId(USER_TITLE_SKELETON_TEST_ID));

    expect(
      screen.getByRole("heading", {
        name: users[0].name,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: users[1].name,
      }),
    ).toBeVisible();
  });

  it("shows the 'See all' button if there are more users to show and the pagination prop is not passed", async () => {
    renderEventUsers({
      hasNextPage: true,
      userIds: [1, 2],
    });

    await waitForElementToBeRemoved(screen.queryAllByTestId(USER_TITLE_SKELETON_TEST_ID));

    expect(screen.getByRole("button", { name: t("communities:see_all") })).toBeVisible();
  });

  it("shows the pagination controls if the pagination prop is passed", async () => {
    renderEventUsers({
      hasNextPage: true,
      userIds: [1, 2],
      pagination: {
        pageIndex: 0,
        currentPage: {
          attendeeUserIdsList: [1, 2],
          nextPageToken: "next-token",
        },
        handlePreviousPageClick: jest.fn(),
        handleNextPageClick: jest.fn(),
      },
    });

    await waitForElementToBeRemoved(screen.queryAllByTestId(USER_TITLE_SKELETON_TEST_ID));

    expect(screen.getByRole("button", { name: t("previous") })).toBeVisible();
    expect(screen.getByRole("button", { name: t("next") })).toBeVisible();
    expect(screen.queryByRole("button", { name: t("communities:see_all") })).not.toBeInTheDocument();
  });

  it("disables the next button when currentPage.nextPageToken is empty", async () => {
    renderEventUsers({
      userIds: [1, 2],
      pagination: {
        pageIndex: 0,
        currentPage: {
          attendeeUserIdsList: [1, 2],
          nextPageToken: "",
        },
        handlePreviousPageClick: jest.fn(),
        handleNextPageClick: jest.fn(),
      },
    });

    await waitForElementToBeRemoved(screen.queryAllByTestId(USER_TITLE_SKELETON_TEST_ID));

    expect(screen.getByRole("button", { name: t("next") })).toBeDisabled();
  });

  it("enables the next button when currentPage.nextPageToken exists", async () => {
    renderEventUsers({
      userIds: [1, 2],
      pagination: {
        pageIndex: 0,
        currentPage: {
          attendeeUserIdsList: [1, 2],
          nextPageToken: "next-token",
        },
        handlePreviousPageClick: jest.fn(),
        handleNextPageClick: jest.fn(),
      },
    });

    await waitForElementToBeRemoved(screen.queryAllByTestId(USER_TITLE_SKELETON_TEST_ID));

    expect(screen.getByRole("button", { name: t("next") })).toBeEnabled();
  });

  it("disables the previous button on page 1", async () => {
    renderEventUsers({
      userIds: [1, 2],
      pagination: {
        pageIndex: 0,
        currentPage: {
          attendeeUserIdsList: [1, 2],
          nextPageToken: "next-token",
        },
        handlePreviousPageClick: jest.fn(),
        handleNextPageClick: jest.fn(),
      },
    });

    await waitForElementToBeRemoved(screen.queryAllByTestId(USER_TITLE_SKELETON_TEST_ID));

    expect(screen.getByRole("button", { name: t("previous") })).toBeDisabled();
  });

  it("enables the previous button when pageIndex is greater than 0", async () => {
    renderEventUsers({
      userIds: [1, 2],
      pagination: {
        pageIndex: 1,
        currentPage: {
          attendeeUserIdsList: [1, 2],
          nextPageToken: "",
        },
        handlePreviousPageClick: jest.fn(),
        handleNextPageClick: jest.fn(),
      },
    });

    await waitForElementToBeRemoved(screen.queryAllByTestId(USER_TITLE_SKELETON_TEST_ID));

    expect(screen.getByRole("button", { name: t("previous") })).toBeEnabled();
  });

  it("calls the pagination handlers when next and previous are clicked", async () => {
    const handleNextPageClick = jest.fn();
    const handlePreviousPageClick = jest.fn();

    renderEventUsers({
      userIds: [1, 2],
      pagination: {
        pageIndex: 1,
        currentPage: {
          attendeeUserIdsList: [1, 2],
          nextPageToken: "next-token",
        },
        handlePreviousPageClick,
        handleNextPageClick,
      },
    });

    await waitForElementToBeRemoved(screen.queryAllByTestId(USER_TITLE_SKELETON_TEST_ID));

    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: t("previous") }));
    await user.click(screen.getByRole("button", { name: t("next") }));

    expect(handlePreviousPageClick).toHaveBeenCalledTimes(1);
    expect(handleNextPageClick).toHaveBeenCalledTimes(1);
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
    expect(screen.queryByText("There aren't any users for this event yet!")).not.toBeInTheDocument();
  });
});
