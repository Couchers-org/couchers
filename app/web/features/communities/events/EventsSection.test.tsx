import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { routeToCommunity } from "routes";
import { service } from "service";
import community from "test/fixtures/community.json";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";
import { assertErrorAlert, mockConsoleError, t } from "test/utils";
import timezoneMock from "timezone-mock";

import { EVENT_CARD_TEST_ID } from "./EventCard";
import EventsSection from "./EventsSection";

const getUserMock = service.user.getUser as jest.MockedFunction<
  typeof service.user.getUser
>;
const listCommunityEventsMock = service.events
  .listCommunityEvents as jest.MockedFunction<
  typeof service.events.listCommunityEvents
>;
const [firstEvent, secondEvent, thirdEvent] = events;

function renderEventsSection() {
  render(<EventsSection community={community} />, { wrapper });
}

describe("Events section", () => {
  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
    listCommunityEventsMock.mockImplementation(async (_, pageToken) => {
      return {
        eventsList: pageToken ? [thirdEvent] : [firstEvent, secondEvent],
        nextPageToken: pageToken ? "" : "2",
      };
    });
    timezoneMock.register("UTC");
  });

  afterEach(() => {
    timezoneMock.unregister();
  });

  it("renders the events section correctly", async () => {
    renderEventsSection();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(
      screen.getByRole("heading", { name: t("communities:events_title") })
    ).toBeVisible();

    const eventCards = screen.getAllByTestId(EVENT_CARD_TEST_ID);
    expect(eventCards).toHaveLength(2);

    // Basic checks only as more detailed checks covered in EventCard
    const firstCard = within(eventCards[0]);
    expect(
      firstCard.getByRole("heading", { name: firstEvent.title })
    ).toBeVisible();

    const secondCard = within(eventCards[1]);
    expect(
      secondCard.getByRole("heading", { name: secondEvent.title })
    ).toBeVisible();
  });

  it("renders the empty state if there are no events", async () => {
    listCommunityEventsMock.mockResolvedValue({
      eventsList: [],
      nextPageToken: "",
    });
    renderEventsSection();
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(screen.getByText(t("communities:events_empty_state"))).toBeVisible();
  });

  it("takes the user to the events tab when 'See more events' is clicked", async () => {
    renderEventsSection();
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    await userEvent.click(
      screen.getByRole("link", { name: t("global:nav.show_all_events") })
    );

    expect(mockRouter.pathname).toBe(
      routeToCommunity(community.communityId, community.slug, "events")
    );
  });

  it("shows an error alert if the events fail to load", async () => {
    mockConsoleError();
    const errorMessage = "Error loading events";
    listCommunityEventsMock.mockRejectedValue(new Error(errorMessage));

    renderEventsSection();

    await assertErrorAlert(errorMessage);
  });
});
