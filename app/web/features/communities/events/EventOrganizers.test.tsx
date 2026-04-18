import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { USER_TITLE_SKELETON_TEST_ID } from "components/UserSummary";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { User } from "proto/api_pb";
import { service } from "service";
import events from "test/fixtures/events.json";
import users from "test/fixtures/users.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getEventOrganizers, getLiteUsers } from "test/serviceMockDefaults";
import { assertErrorAlert, mockConsoleError } from "test/utils";

import EventOrganizers from "./EventOrganizers";

const { t } = i18n;

const [event] = events;

const listEventOrganizersMock = service.events
  .listEventOrganizers as jest.MockedFunction<
  typeof service.events.listEventOrganizers
>;
const getLiteUsersMock = service.user.getLiteUsers as jest.MockedFunction<
  typeof service.user.getLiteUsers
>;
jest.mock("features/userQueries/useCurrentUser");
const useCurrentUserMock = useCurrentUser as jest.MockedFunction<
  typeof useCurrentUser
>;

describe("Event organizers", () => {
  beforeEach(() => {
    getLiteUsersMock.mockImplementation(getLiteUsers);
    listEventOrganizersMock.mockImplementation(getEventOrganizers);
    useCurrentUserMock.mockReturnValue({
      data: users[0] as User.AsObject,
      isError: false,
      isFetching: false,
      isLoading: false,
      error: "",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the organizers successfully", async () => {
    render(<EventOrganizers event={event} />, { wrapper });

    expect(
      await screen.findByRole("heading", { name: t("communities:organizers") }),
    ).toBeVisible();
    expect(
      await screen.findByRole("heading", { name: "Funny Dog" }),
    ).toBeVisible();
    expect(
      await screen.findByRole("heading", { name: "Funny Kid" }),
    ).toBeVisible();
  });

  describe("when there are multiple pages of organizers", () => {
    beforeEach(() => {
      listEventOrganizersMock.mockImplementation(async ({ pageToken }) => {
        if (pageToken) {
          return getEventOrganizers();
        }
        return {
          organizerUserIdsList: [4, 5],
          nextPageToken: "4",
        };
      });
    });

    it("should show dialog for seeing all organizers when the 'See all' button is clicked", async () => {
      render(<EventOrganizers event={event} />, { wrapper });

      const user = userEvent.setup();

      await user.click(
        await screen.findByRole("button", { name: t("communities:see_all") }),
      );

      expect(
        await screen.findByRole("dialog", {
          name: t("communities:organizers"),
        }),
      ).toBeVisible();

      expect(
        await screen.findByRole("heading", { name: "Funny Chicken" }),
      ).toBeVisible();
      expect(
        await screen.findByRole("heading", { name: "Friendly Cow" }),
      ).toBeVisible();
    });

    it("should load the next page of organizers when the 'Load more organizers' button is clicked", async () => {
      render(<EventOrganizers event={event} />, { wrapper });

      const user = userEvent.setup();

      await user.click(
        await screen.findByRole("button", { name: t("communities:see_all") }),
      );
      const dialog = within(
        await screen.findByRole("dialog", {
          name: t("communities:organizers"),
        }),
      );

      await user.click(
        dialog.getByRole("button", {
          name: t("communities:load_more_organizers"),
        }),
      );

      expect(
        await dialog.findByRole("heading", { name: "Funny Dog" }),
      ).toBeVisible();

      expect(
        await dialog.findByRole("heading", { name: "Funny Kid" }),
      ).toBeVisible();
    });

    it("should hide unknown users in the dialog", async () => {
      listEventOrganizersMock.mockImplementation(async ({ pageToken }) => {
        if (pageToken) {
          return {
            organizerUserIdsList: [99],
            nextPageToken: "",
          };
        }
        return {
          organizerUserIdsList: [4, 5],
          nextPageToken: "4",
        };
      });
      render(<EventOrganizers event={event} />, { wrapper });

      const user = userEvent.setup();

      await user.click(
        await screen.findByRole("button", { name: t("communities:see_all") }),
      );
      const dialog = within(
        await screen.findByRole("dialog", {
          name: t("communities:organizers"),
        }),
      );

      await user.click(
        await dialog.findByRole("button", {
          name: t("communities:load_more_organizers"),
        }),
      );

      await waitFor(() =>
        expect(
          dialog.queryByTestId(USER_TITLE_SKELETON_TEST_ID),
        ).not.toBeInTheDocument(),
      );
    });

    it("should show an error alert in the dialog if getting attendees failed", async () => {
      mockConsoleError();
      render(<EventOrganizers event={event} />, { wrapper });
      const errorMessage = "Error listing organizers";
      listEventOrganizersMock.mockRejectedValue(new Error(errorMessage));

      const user = userEvent.setup();

      await user.click(
        await screen.findByRole("button", { name: t("communities:see_all") }),
      );

      await screen.findByRole("dialog", { name: t("communities:organizers") });
      await assertErrorAlert(errorMessage);
    });

    it("closes the dialog when the backdrop is clicked", async () => {
      render(<EventOrganizers event={event} />, { wrapper });

      const user = userEvent.setup();

      await user.click(
        await screen.findByRole("button", { name: t("communities:see_all") }),
      );
      await screen.findByRole("dialog", { name: t("communities:organizers") });

      await user.click(document.querySelector(".MuiBackdrop-root")!);
      await waitForElementToBeRemoved(
        screen.getByRole("dialog", { name: t("communities:organizers") }),
      );

      await waitFor(() =>
        expect(
          screen.queryByRole("button", {
            name: t("communities:load_more_organizers"),
          }),
        ).not.toBeInTheDocument(),
      );
    });

    it("should remove user as organizer on menu option click", async () => {
      render(<EventOrganizers event={event} />, { wrapper });

      const spy = jest.spyOn(service.events, "removeEventOrganizer");

      const menuButton = await screen.findByTestId(
        "funnyChicken-summary-menu-more-options",
      );

      const user = userEvent.setup();

      await user.click(menuButton);

      const menuItem = await screen.findByText(
        t("communities:remove_as_co_organizer.title"),
      );

      await user.click(menuItem);

      const confirmButton = await screen.findByText(t("global:confirm"));

      await user.click(confirmButton);

      expect(spy.mock.calls.length).toBe(1);
    });
  });
});
