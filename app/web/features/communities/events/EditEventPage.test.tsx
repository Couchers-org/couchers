import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { routeToEditEvent, routeToEvent } from "routes";
import { service } from "service";
import events from "test/fixtures/events.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { assertErrorAlert, mockConsoleError, t } from "test/utils";

import EditEventPage from "./EditEventPage";

jest.mock("components/MarkdownInput");

const getEventMock = service.events.getEvent as jest.MockedFunction<
  typeof service.events.getEvent
>;
const updateEventMock = service.events.updateEvent as jest.MockedFunction<
  typeof service.events.updateEvent
>;

function renderPage() {
  mockRouter.setCurrentUrl(routeToEditEvent(1, "weekly-meetup"));
  const { wrapper } = getHookWrapperWithClient();

  render(<EditEventPage eventId={1} />, { wrapper });
}

describe("Edit event page", () => {
  beforeEach(() => {
    getEventMock.mockResolvedValue(events[0]);
    updateEventMock.mockResolvedValue(events[0]);
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date("2021-06-01 00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders with the existing event and updates it successfully", async () => {
    renderPage();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    // Brief sanity check that the form has existing data
    const titleField = screen.getByLabelText(t("global:title"));
    expect(titleField).toHaveValue("Weekly Meetup");

    await userEvent.type(titleField, " in the dam");
    await userEvent.click(
      screen.getByLabelText(t("communities:virtual_event"))
    );
    await userEvent.type(
      screen.getByLabelText(t("communities:event_link")),
      "https://couchers.org/amsterdam-social"
    );
    const eventDetails = screen.getByLabelText(t("communities:event_details"));
    await userEvent.clear(eventDetails);
    await userEvent.type(eventDetails, "We are going virtual this week!");
    const endDateField = await screen.findByLabelText(
      t("communities:end_date")
    );
    await userEvent.clear(endDateField);
    await userEvent.type(endDateField, "07012021");
    await userEvent.click(
      screen.getByRole("button", { name: t("global:update") })
    );

    await waitFor(() => {
      expect(updateEventMock).toHaveBeenCalledTimes(1);
    });
    // Check it only sends the updated field to the backend
    expect(updateEventMock).toHaveBeenCalledWith({
      eventId: 1,
      isOnline: true,
      title: "Weekly Meetup in the dam",
      content: "We are going virtual this week!",
      link: "https://couchers.org/amsterdam-social",
      endTime: new Date("2021-07-01 03:37"),
    });

    // Verifies that success re-directs user
    expect(mockRouter.pathname).toBe(routeToEvent(1, "weekly-meetup"));
  });

  it("should submit both the start and end date if the start date field is touched", async () => {
    renderPage();

    const startDateField = await screen.findByLabelText(
      t("communities:start_date")
    );
    await userEvent.clear(startDateField);
    await userEvent.type(startDateField, "08012021");
    await userEvent.click(
      screen.getByRole("button", { name: t("global:update") })
    );

    await waitFor(
      () => {
        expect(updateEventMock).toHaveBeenCalledTimes(1);
      },
      { timeout: 5000 }
    );

    expect(updateEventMock).toHaveBeenCalledWith({
      eventId: 1,
      isOnline: false,
      startTime: new Date("2021-08-01 02:37"),
      endTime: new Date("2021-08-01 03:37"),
    });
  });

  it("should submit both the start and end date if the start time field is touched", async () => {
    renderPage();

    const startTimeField = await screen.findByLabelText(
      t("communities:start_time")
    );
    await userEvent.clear(startTimeField);
    await userEvent.type(startTimeField, "0000");
    await userEvent.click(
      screen.getByRole("button", { name: t("global:update") })
    );

    await waitFor(
      () => {
        expect(updateEventMock).toHaveBeenCalledTimes(1);
      },
      { timeout: 5000 }
    );

    expect(updateEventMock).toHaveBeenCalledWith({
      eventId: 1,
      isOnline: false,
      startTime: new Date("2021-06-29 00:00"),
      endTime: new Date("2021-06-29 01:00"),
    });
  });

  it("shows an error message if the event to be edited cannot be found", async () => {
    mockConsoleError();
    const errorMessage = "Event not found.";
    getEventMock.mockRejectedValue(new Error(errorMessage));
    renderPage();

    await assertErrorAlert(errorMessage);
    expect(screen.queryByLabelText(t("global:title"))).not.toBeInTheDocument();
  });
});
