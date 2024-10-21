import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
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

async function chooseNewDate(dateField: HTMLInputElement) {
  // Opens the date picker dialog
  userEvent.click(dateField);
  const datePickerDialog = await screen.findByRole("dialog");

  // We only care about checking if date updates get passed correctly to the RPC call,
  // and choosing the 30th June is the easiest way to do that for the rendered event
  userEvent.click(
    within(datePickerDialog).getByRole("gridcell", { name: "30" })
  );

  userEvent.click(within(datePickerDialog).getByRole("button", { name: "OK" }));
  await waitForElementToBeRemoved(datePickerDialog);
}

describe("Edit event page", () => {
  beforeEach(() => {
    getEventMock.mockResolvedValue(events[0]);
    updateEventMock.mockResolvedValue(events[0]);
    jest.useFakeTimers();
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

    userEvent.type(titleField, " in the dam");
    userEvent.click(screen.getByLabelText(t("communities:virtual_event")));
    userEvent.type(
      screen.getByLabelText(t("communities:event_link")),
      "https://couchers.org/amsterdam-social"
    );
    const eventDetails = screen.getByLabelText(t("communities:event_details"));
    userEvent.clear(eventDetails);
    userEvent.type(eventDetails, "We are going virtual this week!");
    const endDateField = await screen.findByLabelText<HTMLInputElement>(
      t("communities:end_date")
    );
    await chooseNewDate(endDateField);
    userEvent.click(screen.getByRole("button", { name: t("global:update") }));

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
      endTime: new Date("2021-06-30 03:37"),
    });

    // Verifies that success re-directs user
    expect(mockRouter.pathname).toBe(routeToEvent(1, "weekly-meetup"));
  });

  it("should submit both the start and end date if the start date field is touched", async () => {
    renderPage();

    const startDateField = await screen.findByLabelText<HTMLInputElement>(
      t("communities:start_date")
    );
    await chooseNewDate(startDateField);
    userEvent.click(screen.getByRole("button", { name: t("global:update") }));

    await waitFor(
      () => {
        expect(updateEventMock).toHaveBeenCalledTimes(1);
      },
      { timeout: 5000 }
    );

    expect(updateEventMock).toHaveBeenCalledWith({
      eventId: 1,
      isOnline: false,
      startTime: new Date("2021-06-30 02:37"),
      endTime: new Date("2021-06-30 03:37"),
    });
  });

  it("should submit both the start and end date if the start time field is touched", async () => {
    renderPage();

    const startTimeField = await screen.findByLabelText(
      t("communities:start_time")
    );
    userEvent.clear(startTimeField);
    userEvent.type(startTimeField, "0000");
    userEvent.click(screen.getByRole("button", { name: t("global:update") }));

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
