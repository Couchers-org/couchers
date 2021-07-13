import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { USER_TITLE_SKELETON_TEST_ID } from "components/UserSummary";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { getEventAttendees, getUser } from "test/serviceMockDefaults";

import { ATTENDEES, LOAD_MORE_ATTENDEES, SEE_ALL } from "./constants";
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
      await screen.findByRole("heading", { name: ATTENDEES })
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

      userEvent.click(await screen.findByRole("button", { name: SEE_ALL }));
      expect(
        await screen.findByRole("dialog", { name: ATTENDEES })
      ).toBeVisible();
      expect(screen.getByRole("heading", { name: "Funny Dog" })).toBeVisible();
      expect(screen.getByRole("heading", { name: "Funny Kid" })).toBeVisible();
    });

    it("should load the next page of attendees when the 'Load more attendees' button is clicked", async () => {
      render(<EventAttendees eventId={1} />, { wrapper });
      userEvent.click(await screen.findByRole("button", { name: SEE_ALL }));
      const dialog = within(
        await screen.findByRole("dialog", { name: ATTENDEES })
      );

      userEvent.click(
        dialog.getByRole("button", { name: LOAD_MORE_ATTENDEES })
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
      userEvent.click(await screen.findByRole("button", { name: SEE_ALL }));
      const dialog = within(
        await screen.findByRole("dialog", { name: ATTENDEES })
      );

      userEvent.click(
        dialog.getByRole("button", { name: LOAD_MORE_ATTENDEES })
      );

      expect(
        dialog.queryByTestId(USER_TITLE_SKELETON_TEST_ID)
      ).not.toBeInTheDocument();
    });
  });
});
