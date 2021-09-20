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
import { getEventOrganizers, getUser } from "test/serviceMockDefaults";
import { assertErrorAlert, mockConsoleError } from "test/utils";

import { LOAD_MORE_ORGANIZERS, ORGANIZERS, SEE_ALL } from "./constants";
import EventOrganizers from "./EventOrganizers";

const listEventOrganizersMock = service.events
  .listEventOrganizers as jest.MockedFunction<
  typeof service.events.listEventOrganizers
>;
const getUserMock = service.user.getUser as jest.MockedFunction<
  typeof service.user.getUser
>;

describe("Event organizers", () => {
  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
    listEventOrganizersMock.mockImplementation(getEventOrganizers);
  });

  it("renders the organizers successfully", async () => {
    render(<EventOrganizers eventId={1} />, { wrapper });

    expect(
      await screen.findByRole("heading", { name: ORGANIZERS })
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Funny Dog" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Funny Kid" })).toBeVisible();
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
      render(<EventOrganizers eventId={1} />, { wrapper });

      userEvent.click(await screen.findByRole("button", { name: SEE_ALL }));
      expect(
        await screen.findByRole("dialog", { name: ORGANIZERS })
      ).toBeVisible();
      expect(
        screen.getByRole("heading", { name: "Funny Chicken" })
      ).toBeVisible();
      expect(
        screen.getByRole("heading", { name: "Friendly Cow" })
      ).toBeVisible();
    });

    it("should load the next page of organizers when the 'Load more organizers' button is clicked", async () => {
      render(<EventOrganizers eventId={1} />, { wrapper });
      userEvent.click(await screen.findByRole("button", { name: SEE_ALL }));
      const dialog = within(
        await screen.findByRole("dialog", { name: ORGANIZERS })
      );

      userEvent.click(
        dialog.getByRole("button", { name: LOAD_MORE_ORGANIZERS })
      );

      expect(
        await dialog.findByRole("heading", { name: "Funny Dog" })
      ).toBeVisible();
      expect(dialog.getByRole("heading", { name: "Funny Kid" })).toBeVisible();
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
      render(<EventOrganizers eventId={1} />, { wrapper });
      userEvent.click(await screen.findByRole("button", { name: SEE_ALL }));
      const dialog = within(
        await screen.findByRole("dialog", { name: ORGANIZERS })
      );

      userEvent.click(
        dialog.getByRole("button", { name: LOAD_MORE_ORGANIZERS })
      );

      expect(
        dialog.queryByTestId(USER_TITLE_SKELETON_TEST_ID)
      ).not.toBeInTheDocument();
    });

    it("should show an error alert in the dialog if getting attendees failed", async () => {
      mockConsoleError();
      render(<EventOrganizers eventId={1} />, { wrapper });
      const errorMessage = "Error listing organizers";
      listEventOrganizersMock.mockRejectedValue(new Error(errorMessage));

      userEvent.click(await screen.findByRole("button", { name: SEE_ALL }));

      await screen.findByRole("dialog", { name: ORGANIZERS });
      await assertErrorAlert(errorMessage);
    });

    it("closes the dialog when the backdrop is clicked", async () => {
      render(<EventOrganizers eventId={1} />, { wrapper });
      userEvent.click(await screen.findByRole("button", { name: SEE_ALL }));
      await screen.findByRole("dialog", { name: ORGANIZERS });

      userEvent.click(document.querySelector(".MuiBackdrop-root")!);
      await waitForElementToBeRemoved(
        screen.getByRole("dialog", { name: ORGANIZERS })
      );

      expect(
        screen.queryByRole("button", { name: LOAD_MORE_ORGANIZERS })
      ).not.toBeInTheDocument();
    });
  });
});
