import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { USER_TITLE_SKELETON_TEST_ID } from "components/UserSummary";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { getEventOrganisers, getUser } from "test/serviceMockDefaults";

import { LOAD_MORE_ORGANISERS, ORGANISERS, SEE_ALL } from "./constants";
import EventOrganisers from "./EventOrganisers";

const listEventOrganisersMock = service.events
  .listEventOrganisers as jest.MockedFunction<
  typeof service.events.listEventOrganisers
>;
const getUserMock = service.user.getUser as jest.MockedFunction<
  typeof service.user.getUser
>;

describe("Event organisers", () => {
  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
    listEventOrganisersMock.mockImplementation(getEventOrganisers);
  });

  it("renders the organisers successfully", async () => {
    render(<EventOrganisers eventId={1} />, { wrapper });

    expect(
      await screen.findByRole("heading", { name: ORGANISERS })
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Funny Dog" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Funny Kid" })).toBeVisible();
  });

  describe("when there are multiple pages of organisers", () => {
    beforeEach(() => {
      listEventOrganisersMock.mockImplementation(async ({ pageToken }) => {
        if (pageToken) {
          return getEventOrganisers();
        }
        return {
          organizerUserIdsList: [4, 5],
          nextPageToken: "4",
        };
      });
    });

    it("should show dialog for seeing all organisers when the 'See all' button is clicked", async () => {
      render(<EventOrganisers eventId={1} />, { wrapper });

      userEvent.click(await screen.findByRole("button", { name: SEE_ALL }));
      expect(
        await screen.findByRole("dialog", { name: ORGANISERS })
      ).toBeVisible();
      expect(
        screen.getByRole("heading", { name: "Funny Chicken" })
      ).toBeVisible();
      expect(
        screen.getByRole("heading", { name: "Friendly Cow" })
      ).toBeVisible();
    });

    it("should load the next page of organisers when the 'Load more organisers' button is clicked", async () => {
      render(<EventOrganisers eventId={1} />, { wrapper });
      userEvent.click(await screen.findByRole("button", { name: SEE_ALL }));
      const dialog = within(
        await screen.findByRole("dialog", { name: ORGANISERS })
      );

      userEvent.click(
        dialog.getByRole("button", { name: LOAD_MORE_ORGANISERS })
      );

      expect(
        await dialog.findByRole("heading", { name: "Funny Dog" })
      ).toBeVisible();
      expect(dialog.getByRole("heading", { name: "Funny Kid" })).toBeVisible();
    });

    it("should hide unknown users in the dialog", async () => {
      listEventOrganisersMock.mockImplementation(async ({ pageToken }) => {
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
      render(<EventOrganisers eventId={1} />, { wrapper });
      userEvent.click(await screen.findByRole("button", { name: SEE_ALL }));
      const dialog = within(
        await screen.findByRole("dialog", { name: ORGANISERS })
      );

      userEvent.click(
        dialog.getByRole("button", { name: LOAD_MORE_ORGANISERS })
      );

      expect(
        dialog.queryByTestId(USER_TITLE_SKELETON_TEST_ID)
      ).not.toBeInTheDocument();
    });
  });
});
