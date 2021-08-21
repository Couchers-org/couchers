import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CREATE, TITLE } from "features/constants";
import { Route, Switch } from "react-router-dom";
import { eventRoute } from "routes";
import { service } from "service";
import events from "test/fixtures/events.json";
import wrapper, { getHookWrapperWithClient } from "test/hookWrapper";
import { server } from "test/restMock";

import {
  EVENT_DETAILS,
  EVENT_LINK,
  LOCATION,
  VIRTUAL_EVENT,
} from "./constants";
import CreateEventPage from "./CreateEventPage";

jest.mock("components/MarkdownInput");

const createEventMock = service.events.createEvent as jest.MockedFunction<
  typeof service.events.createEvent
>;

describe("Create event page", () => {
  beforeEach(() => {
    createEventMock.mockResolvedValue(events[0]);
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date("2021-08-01 00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders and creates an online event successfully", async () => {
    render(
      <Switch>
        <Route exact path="/">
          <CreateEventPage />
        </Route>
        <Route path={eventRoute}>
          <h1 data-testid="event-page">Event page</h1>
        </Route>
      </Switch>,
      { wrapper }
    );

    userEvent.type(screen.getByLabelText(TITLE), "Test event");
    userEvent.click(screen.getByLabelText(VIRTUAL_EVENT));
    userEvent.type(
      screen.getByLabelText(EVENT_LINK),
      "https://couchers.org/social"
    );
    userEvent.type(screen.getByLabelText(EVENT_DETAILS), "sick social!");
    userEvent.click(screen.getByRole("button", { name: CREATE }));

    await waitFor(() => {
      expect(createEventMock).toHaveBeenCalledTimes(1);
    });
    expect(createEventMock).toHaveBeenCalledWith({
      isOnline: true,
      title: "Test event",
      content: "sick social!",
      photoKey: "",
      startTime: new Date("2021-08-01 01:00"),
      endTime: new Date("2021-08-01 02:00"),
      parentCommunityId: 1,
      link: "https://couchers.org/social",
    });
    // Verifies that success re-directs user
    expect(screen.getByTestId("event-page")).toBeInTheDocument();
  });
});

function renderPageWithState(state?: { communityId: number }) {
  const { wrapper } = getHookWrapperWithClient({
    initialRouterEntries: [
      {
        pathname: "/",
        state,
      },
    ],
  });
  render(
    <Switch>
      <Route exact path="/">
        <CreateEventPage />
      </Route>
      <Route path={eventRoute}>
        <h1 data-testid="event-page">Event page</h1>
      </Route>
    </Switch>,
    { wrapper }
  );
}

describe("Create event page (offline events)", () => {
  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    createEventMock.mockResolvedValue(events[0]);
  });

  it("creates on offline event with no route state correctly", async () => {
    renderPageWithState();

    userEvent.type(screen.getByLabelText(TITLE), "Test event");
    userEvent.type(screen.getByLabelText(LOCATION), "tes{enter}");
    userEvent.click(
      await screen.findByText("test city, test county, test country")
    );
    userEvent.type(screen.getByLabelText(EVENT_DETAILS), "sick social!");
    userEvent.click(screen.getByRole("button", { name: CREATE }));

    await waitFor(() => {
      expect(createEventMock).toHaveBeenCalledTimes(1);
    });

    expect(createEventMock).toHaveBeenCalledWith({
      isOnline: false,
      lat: 2,
      lng: 1,
      address: "test city, test county, test country",
      title: "Test event",
      content: "sick social!",
      photoKey: "",
      startTime: expect.any(Date),
      endTime: expect.any(Date),
    });
  });

  it("creates on offline event with route state correctly", async () => {
    renderPageWithState({ communityId: 99 });

    userEvent.type(screen.getByLabelText(TITLE), "Test event");
    userEvent.type(screen.getByLabelText(LOCATION), "tes{enter}");
    userEvent.click(
      await screen.findByText("test city, test county, test country")
    );
    userEvent.type(screen.getByLabelText(EVENT_DETAILS), "sick social!");
    userEvent.click(screen.getByRole("button", { name: CREATE }));

    await waitFor(() => {
      expect(createEventMock).toHaveBeenCalledTimes(1);
    });

    expect(createEventMock).toHaveBeenCalledWith({
      isOnline: false,
      lat: 2,
      lng: 1,
      address: "test city, test county, test country",
      title: "Test event",
      content: "sick social!",
      photoKey: "",
      startTime: expect.any(Date),
      endTime: expect.any(Date),
      parentCommunityId: 99,
    });
  });
});
