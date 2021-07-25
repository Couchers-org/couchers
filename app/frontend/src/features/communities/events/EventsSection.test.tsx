import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Switch } from "react-router";
import { communityRoute } from "routes";
import { service } from "service";
import community from "test/fixtures/community.json";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";
import { assertErrorAlert, mockConsoleError } from "test/utils";
import timezoneMock from "timezone-mock";

import { EVENTS_EMPTY_STATE, EVENTS_TITLE, SHOW_ALL_EVENTS } from "./constants";
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
  render(
    <Switch>
      <Route path={communityRoute}>
        <h1 data-testid="events-tab">Events tab</h1>
      </Route>
      <Route path="/">
        <EventsSection community={community} />
      </Route>
    </Switch>,
    { wrapper }
  );
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

    expect(screen.getByRole("heading", { name: EVENTS_TITLE })).toBeVisible();

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

    expect(screen.getByText(EVENTS_EMPTY_STATE)).toBeVisible();
  });

  it("takes the user to the events tab when 'See more events' is clicked", async () => {
    renderEventsSection();
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    userEvent.click(screen.getByRole("link", { name: SHOW_ALL_EVENTS }));

    expect(screen.getByTestId("events-tab")).toBeInTheDocument();
  });

  it("shows an error alert if the events fail to load", async () => {
    mockConsoleError();
    const errorMessage = "Error loading events";
    listCommunityEventsMock.mockRejectedValue(new Error(errorMessage));

    renderEventsSection();

    await assertErrorAlert(errorMessage);
  });
});
