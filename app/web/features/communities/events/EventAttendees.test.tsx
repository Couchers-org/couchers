import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { USER_TITLE_SKELETON_TEST_ID } from "components/UserSummary";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { User } from "proto/api_pb";
import { service } from "service";
import events from "test/fixtures/events.json";
import users from "test/fixtures/users.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getEventAttendees, getLiteUsers } from "test/serviceMockDefaults";
import { assertErrorAlert, mockConsoleError } from "test/utils";

import EventAttendees from "./EventAttendees";

const { t } = i18n;

const [event] = events;

const listEventAttendeesMock = service.events
  .listEventAttendees as jest.MockedFunction<
  typeof service.events.listEventAttendees
>;
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

describe("Event attendees", () => {
  beforeEach(() => {
    getLiteUsersMock.mockImplementation(getLiteUsers);
    listEventAttendeesMock.mockImplementation(getEventAttendees);
    listEventOrganizersMock.mockImplementation(async () => ({
      organizerUserIdsList: [1, 3],
      nextPageToken: "",
    }));
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

  it("renders the attendees successfully", async () => {
    render(<EventAttendees event={event} />, { wrapper });

    expect(
      await screen.findByRole("heading", { name: t("communities:attendees") }),
    ).toBeVisible();
    expect(
      await screen.findByRole("heading", {
        name: "Funny Cat current User",
      }),
    ).toBeVisible();
    expect(
      await screen.findByRole("heading", { name: "Funny Chicken" }),
    ).toBeVisible();
  });

  describe("when there are multiple pages of attendees", () => {
    beforeEach(() => {
      listEventAttendeesMock.mockImplementation(async ({ pageToken }) => {
        if (pageToken) {
          return {
            attendeeUserIdsList: [1, 3],
            nextPageToken: "",
          };
        }
        return {
          attendeeUserIdsList: [2, 4],
          nextPageToken: "4",
        };
      });
    });

    it("shows page 1 first, then page 2 on next, then page 1 again on previous", async () => {
      render(<EventAttendees event={event} />, { wrapper });

      const user = userEvent.setup();

      expect(
        await screen.findByRole("heading", { name: "Funny Dog" }),
      ).toBeVisible();
      expect(
        await screen.findByRole("heading", { name: "Funny Chicken" }),
      ).toBeVisible();
      expect(
        screen.queryByRole("heading", { name: "Funny Cat current User" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Funny Kid" }),
      ).not.toBeInTheDocument();

      await user.click(await screen.findByRole("button", { name: t("next") }));

      expect(
        await screen.findByRole("heading", {
          name: "Funny Cat current User",
        }),
      ).toBeVisible();
      expect(
        await screen.findByRole("heading", { name: "Funny Kid" }),
      ).toBeVisible();
      expect(
        screen.queryByRole("heading", { name: "Funny Dog" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Funny Chicken" }),
      ).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: t("previous") }));

      expect(
        await screen.findByRole("heading", { name: "Funny Dog" }),
      ).toBeVisible();
      expect(
        await screen.findByRole("heading", { name: "Funny Chicken" }),
      ).toBeVisible();
      expect(
        screen.queryByRole("heading", { name: "Funny Cat current User" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Funny Kid" }),
      ).not.toBeInTheDocument();
    });

    it("does not render unknown users on page 2 and clears skeletons after loading", async () => {
      listEventAttendeesMock.mockImplementation(async ({ pageToken }) => {
        if (pageToken) {
          return {
            attendeeUserIdsList: [99],
            nextPageToken: "",
          };
        }
        return {
          attendeeUserIdsList: [4, 5],
          nextPageToken: "5",
        };
      });
      render(<EventAttendees event={event} />, { wrapper });

      const user = userEvent.setup();

      expect(
        await screen.findByRole("heading", { name: "Funny Chicken" }),
      ).toBeVisible();

      await user.click(await screen.findByRole("button", { name: t("next") }));

      await waitFor(() =>
        expect(
          screen.queryAllByTestId(USER_TITLE_SKELETON_TEST_ID),
        ).toHaveLength(0),
      );

      expect(
        screen.queryByRole("heading", { name: "Funny Kid" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Funny Cat current User" }),
      ).not.toBeInTheDocument();
    });

    it("shows an error alert when the second page fetch fails", async () => {
      mockConsoleError();
      const errorMessage = "Error listing attendees";
      listEventAttendeesMock.mockImplementation(async ({ pageToken }) => {
        if (pageToken) {
          throw new Error(errorMessage);
        }
        return {
          attendeeUserIdsList: [2, 4],
          nextPageToken: "4",
        };
      });
      render(<EventAttendees event={event} />, { wrapper });

      const user = userEvent.setup();

      expect(
        await screen.findByRole("heading", { name: "Funny Dog" }),
      ).toBeVisible();
      expect(
        await screen.findByRole("heading", { name: "Funny Chicken" }),
      ).toBeVisible();

      await user.click(await screen.findByRole("button", { name: t("next") }));

      await assertErrorAlert(errorMessage);
    });

    it("should make attendee an organizer on menu option click", async () => {
      render(<EventAttendees event={event} />, { wrapper });

      const spy = jest.spyOn(service.events, "inviteEventOrganizer");

      const menuButton = await screen.findByTestId(
        "funnydog-summary-menu-more-options",
      );

      const user = userEvent.setup();

      await user.click(menuButton);

      const menuItem = await screen.findByText(
        t("communities:make_co_organizer.title"),
      );

      await user.click(menuItem);

      const confirmButton = await screen.findByText(t("global:confirm"));

      await user.click(confirmButton);

      expect(spy.mock.calls.length).toBe(1);
    });
  });
});
