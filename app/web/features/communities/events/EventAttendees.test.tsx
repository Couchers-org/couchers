import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { USER_TITLE_SKELETON_TEST_ID } from "components/UserSummary";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { getEventAttendees, getUser } from "test/serviceMockDefaults";
import { assertErrorAlert, mockConsoleError, t } from "test/utils";

import EventAttendees from "./EventAttendees";

const listEventAttendeesMock = service.events
  .listEventAttendees as jest.MockedFunction<
  typeof service.events.listEventAttendees
>;
const getUserMock = service.user.getUser as jest.MockedFunction<
  typeof service.user.getUser
>;

describe("Event attendees", () => {
  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
    listEventAttendeesMock.mockImplementation(getEventAttendees);
  });

  it("renders the attendees successfully", async () => {
    render(<EventAttendees eventId={1} />, { wrapper });

    expect(
      await screen.findByRole("heading", { name: t("communities:attendees") })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Funny Cat current User" })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Funny Chicken" })
    ).toBeVisible();
  });

  describe("when there are multiple pages of attendees", () => {
    beforeEach(() => {
      listEventAttendeesMock.mockImplementation(async ({ pageToken }) => {
        if (pageToken) {
          return getEventAttendees();
        }
        return {
          attendeeUserIdsList: [2, 3],
          nextPageToken: "3",
        };
      });
    });

    it("should show dialog for seeing all attendees when the 'See all' button is clicked", async () => {
      render(<EventAttendees eventId={1} />, { wrapper });

      await userEvent.click(
        await screen.findByRole("button", { name: t("communities:see_all") })
      );
      expect(
        await screen.findByRole("dialog", { name: t("communities:attendees") })
      ).toBeVisible();
      expect(screen.getByRole("heading", { name: "Funny Dog" })).toBeVisible();
      expect(screen.getByRole("heading", { name: "Funny Kid" })).toBeVisible();
    });

    it("should load the next page of attendees when the 'Load more attendees' button is clicked", async () => {
      render(<EventAttendees eventId={1} />, { wrapper });
      await userEvent.click(
        await screen.findByRole("button", { name: t("communities:see_all") })
      );
      const dialog = within(
        await screen.findByRole("dialog", { name: t("communities:attendees") })
      );

      await userEvent.click(
        dialog.getByRole("button", {
          name: t("communities:load_more_attendees"),
        })
      );

      expect(
        await screen.findByRole("heading", { name: "Funny Cat current User" })
      ).toBeVisible();
      expect(
        screen.getByRole("heading", { name: "Funny Chicken" })
      ).toBeVisible();
    });

    it("should hide unknown users in the dialog", async () => {
      listEventAttendeesMock.mockImplementation(async ({ pageToken }) => {
        if (pageToken) {
          return {
            attendeeUserIdsList: [99],
            nextPageToken: "",
          };
        }
        return {
          attendeeUserIdsList: [4, 5],
          nextPageToken: "4",
        };
      });
      render(<EventAttendees eventId={1} />, { wrapper });
      await userEvent.click(
        await screen.findByRole("button", { name: t("communities:see_all") })
      );
      const dialog = within(
        await screen.findByRole("dialog", { name: t("communities:attendees") })
      );

      await userEvent.click(
        dialog.getByRole("button", {
          name: t("communities:load_more_attendees"),
        })
      );
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      expect(
        dialog.queryByTestId(USER_TITLE_SKELETON_TEST_ID)
      ).not.toBeInTheDocument();
    });

    it("should show an error alert in the dialog if getting attendees failed", async () => {
      mockConsoleError();
      render(<EventAttendees eventId={1} />, { wrapper });
      const errorMessage = "Error listing attendees";
      listEventAttendeesMock.mockRejectedValue(new Error(errorMessage));

      await userEvent.click(
        await screen.findByRole("button", { name: t("communities:see_all") })
      );

      await screen.findByRole("dialog", { name: t("communities:attendees") });
      await assertErrorAlert(errorMessage);
    });

    it("closes the dialog when the backdrop is clicked", async () => {
      render(<EventAttendees eventId={1} />, { wrapper });
      await userEvent.click(
        await screen.findByRole("button", { name: t("communities:see_all") })
      );
      await screen.findByRole("dialog", { name: t("communities:attendees") });

      await userEvent.click(document.querySelector(".MuiBackdrop-root")!);
      await waitForElementToBeRemoved(
        screen.getByRole("dialog", { name: t("communities:attendees") })
      );

      expect(
        screen.queryByRole("button", {
          name: t("communities:load_more_attendees"),
        })
      ).not.toBeInTheDocument();
    });
  });
});
