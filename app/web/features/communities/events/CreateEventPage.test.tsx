import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { routeToEvent, routeToNewEvent } from "routes";
import { service } from "service";
import events from "test/fixtures/events.json";
import wrapper, { getHookWrapperWithClient } from "test/hookWrapper";
import { server } from "test/restMock";
import { t } from "test/utils";

import CreateEventPage from "./CreateEventPage";

jest.mock("components/MarkdownInput");

const createEventMock = service.events.createEvent as jest.MockedFunction<
  typeof service.events.createEvent
>;

describe("Create event page", () => {
  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    createEventMock.mockResolvedValue(events[0]);
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date("2021-08-01 00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders and creates an online event successfully", async () => {
    render(<CreateEventPage />, { wrapper });

    await userEvent.type(
      screen.getByLabelText(t("global:title")),
      "Test event"
    );
    await userEvent.click(
      screen.getByLabelText(t("communities:virtual_event"))
    );
    await userEvent.type(
      screen.getByLabelText(t("communities:event_link")),
      "https://couchers.org/social"
    );
    await userEvent.type(
      screen.getByLabelText(t("communities:event_details")),
      "sick social!"
    );
    await userEvent.click(
      screen.getByRole("button", { name: t("global:create") })
    );

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
    expect(mockRouter.pathname).toBe(routeToEvent(1, "weekly-meetup"));
  });

  it("creates on offline event with no route state correctly", async () => {
    renderPageWithState();

    await userEvent.type(
      screen.getByLabelText(t("global:title")),
      "Test event"
    );
    // msw server response doesn't work with fake timers on, so turn it off temporarily
    jest.useRealTimers();
    await userEvent.type(
      screen.getByLabelText(t("communities:location")),
      "tes{enter}"
    );
    await userEvent.click(
      await screen.findByText("test city, test county, test country")
    );
    await userEvent.type(
      screen.getByLabelText(t("communities:event_details")),
      "sick social!"
    );

    // Now we got our location, turn fake timers back on so the default date we got earlier from the "current"
    // date would pass form validation
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date("2021-08-01 00:00"));
    await userEvent.click(
      screen.getByRole("button", { name: t("global:create") })
    );

    await waitFor(
      () => {
        expect(createEventMock).toHaveBeenCalledTimes(1);
      },
      { timeout: 5000 }
    );

    expect(createEventMock).toHaveBeenCalledWith({
      isOnline: false,
      lat: 2,
      lng: 1,
      address: "test city, test county, test country",
      title: "Test event",
      content: "sick social!",
      photoKey: "",
      startTime: new Date("2021-08-01 01:00"),
      endTime: new Date("2021-08-01 02:00"),
    });
  });

  it("creates on offline event with route state correctly", async () => {
    renderPageWithState({ communityId: 99 });

    await userEvent.type(
      screen.getByLabelText(t("global:title")),
      "Test event"
    );
    jest.useRealTimers();
    await userEvent.type(
      screen.getByLabelText(t("communities:location")),
      "tes{enter}"
    );
    await userEvent.click(
      await screen.findByText("test city, test county, test country")
    );
    await userEvent.type(
      screen.getByLabelText(t("communities:event_details")),
      "sick social!"
    );

    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date("2021-08-01 00:00"));
    await userEvent.click(
      screen.getByRole("button", { name: t("global:create") })
    );

    await waitFor(
      () => {
        expect(createEventMock).toHaveBeenCalledTimes(1);
      },
      { timeout: 5000 }
    );

    expect(createEventMock).toHaveBeenCalledWith({
      isOnline: false,
      lat: 2,
      lng: 1,
      address: "test city, test county, test country",
      title: "Test event",
      content: "sick social!",
      photoKey: "",
      startTime: new Date("2021-08-01 01:00"),
      endTime: new Date("2021-08-01 02:00"),
      parentCommunityId: 99,
    });
  });
});

function renderPageWithState(state?: { communityId: number }) {
  mockRouter.setCurrentUrl(routeToNewEvent(state?.communityId));
  const { wrapper } = getHookWrapperWithClient();
  render(<CreateEventPage />, { wrapper });
}
