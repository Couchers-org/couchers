import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { routeToEditEvent, routeToEvent } from "routes";
import { service } from "service";
import events from "test/fixtures/events.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import i18n from "test/i18n";
import { assertErrorAlert, mockConsoleError } from "test/utils";

import EditEventPage from "./EditEventPage";

const { t } = i18n;

jest.mock("components/MarkdownInput");

jest.mock("@mui/x-date-pickers", () => {
  return {
    ...jest.requireActual("@mui/x-date-pickers"),
    DatePicker: jest.requireActual("@mui/x-date-pickers").DesktopDatePicker,
    TimePicker: jest.requireActual("@mui/x-date-pickers").DesktopTimePicker,
  };
});

const getEventMock = service.events.getEvent as jest.MockedFunction<
  typeof service.events.getEvent
>;
const updateEventMock = service.events.updateEvent as jest.MockedFunction<
  typeof service.events.updateEvent
>;

function renderPage(eventId: number = 1, slug: string = "weekly-meetup") {
  mockRouter.setCurrentUrl(routeToEditEvent(eventId, slug));
  const { wrapper } = getHookWrapperWithClient();

  render(<EditEventPage eventId={eventId} />, { wrapper });
}

describe("Edit event page", () => {
  beforeEach(() => {
    getEventMock.mockResolvedValue(events[0]);
    updateEventMock.mockResolvedValue(events[0]);
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-06-01 00:00"));
  });

  afterEach(async () => {
    jest.useRealTimers();
    await act(() => i18n.changeLanguage("en"));
  });

  it("renders an existing offline event and updates it successfully", async () => {
    renderPage();

    // Brief sanity check that the form has existing data
    const titleField = await screen.findByLabelText(
      t("communities:event_title_label"),
    );
    expect(titleField).toHaveValue("Weekly Meetup");

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.type(titleField, " in the dam");

    expect(titleField).toHaveValue("Weekly Meetup in the dam");

    expect(
      screen.getByText(t("communities:virtual_event_deprecated_warning")),
    ).not.toBeVisible();

    const locationInput = screen.getByLabelText(
      t("communities:location"),
    ) as HTMLInputElement;

    await user.type(locationInput, "tes{enter}");

    expect(locationInput).toHaveValue("tes");

    await user.click(
      await screen.findByText("test city, test county, test country"),
    );

    const eventDetails = screen.getByLabelText(t("communities:event_details"));

    await user.clear(eventDetails);

    await user.type(eventDetails, "Here are some more details!");

    expect(eventDetails).toHaveValue("Here are some more details!");

    const endDateGroup = await screen.findByRole("group", {
      name: t("communities:end_date"),
    });

    await user.click(endDateGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("07012021");

    expect(endDateGroup).toHaveTextContent("07/01/2021");

    await user.click(screen.getByRole("button", { name: t("global:update") }));

    await waitFor(() => {
      expect(updateEventMock).toHaveBeenCalledTimes(1);
    });
    // Check it only sends the updated field to the backend
    expect(updateEventMock).toHaveBeenCalledWith({
      eventId: 1,
      isOnline: false,
      title: "Weekly Meetup in the dam",
      content: "Here are some more details!",
      locationInput: "test city, test county, test country",
      endTime: new Date("2021-07-01 03:37"),
    });

    // Verifies that success re-directs user
    expect(mockRouter.pathname).toBe(routeToEvent(1, "weekly-meetup"));
  });

  it("renders an existing online event and updates it successfully", async () => {
    renderPage(2, "planting-season-meetup");

    // Brief sanity check that the form has existing data
    const titleField = await screen.findByLabelText(
      t("communities:event_title_label"),
    );
    expect(titleField).toHaveValue("Planting Season Meetup");

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    expect(
      screen.getByText(t("communities:virtual_event_deprecated_warning")),
    ).toBeVisible();

    const eventLinkInput = (await screen.findByLabelText(
      t("communities:event_link"),
    )) as HTMLInputElement;

    await user.type(eventLinkInput, "https://couchers.org/planting-season");

    expect(eventLinkInput).toHaveValue("https://couchers.org/planting-season");

    await user.click(screen.getByRole("button", { name: t("global:update") }));

    await waitFor(() => {
      expect(updateEventMock).toHaveBeenCalledTimes(1);
    });
    // Check it only sends the updated field to the backend
    expect(updateEventMock).toHaveBeenCalledWith({
      eventId: 2,
      isOnline: true,
      link: "https://couchers.org/planting-season",
    });

    // Verifies that success re-directs user
    expect(mockRouter.pathname).toBe(routeToEvent(2, "planting-season-meetup"));
  });

  it("should submit only the start date if the start date field is touched", async () => {
    renderPage();

    const startDateGroup = await screen.findByRole("group", {
      name: t("communities:start_date"),
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.click(startDateGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("08012021");

    expect(startDateGroup).toHaveTextContent("08/01/2021");

    await user.click(screen.getByRole("button", { name: t("global:update") }));

    await waitFor(() => {
      expect(updateEventMock).toHaveBeenCalledTimes(1);
    });

    expect(updateEventMock).toHaveBeenCalledWith({
      eventId: 1,
      isOnline: false,
      startTime: new Date("2021-08-01 02:37"),
    });
  });

  it("should submit only the start time if the start time field is touched", async () => {
    i18n.changeLanguage("de"); // HH:mm format

    renderPage();

    const startTimeGroup = await screen.findByRole("group", {
      name: t("communities:start_time"),
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.click(startTimeGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("0000");

    expect(startTimeGroup).toHaveTextContent("00:00");

    await user.click(screen.getByRole("button", { name: t("global:update") }));

    await waitFor(
      () => {
        expect(updateEventMock).toHaveBeenCalledTimes(1);
      },
      { timeout: 5000 },
    );

    expect(updateEventMock).toHaveBeenCalledWith({
      eventId: 1,
      isOnline: false,
      startTime: new Date("2021-06-29 00:00"),
    });
  });

  it("shows an error message if the event to be edited cannot be found", async () => {
    mockConsoleError();
    const errorMessage = "Event not found.";
    getEventMock.mockRejectedValue(new Error(errorMessage));
    renderPage();

    await assertErrorAlert(errorMessage);
    expect(
      screen.queryByLabelText(t("communities:event_title_label")),
    ).not.toBeInTheDocument();
  });

  it("should show error if startDate after endDate", async () => {
    renderPage();

    const startDateGroup = await screen.findByRole("group", {
      name: t("communities:start_date"),
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.click(startDateGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("07012021");

    expect(startDateGroup).toHaveTextContent("07/01/2021");

    const endDateGroup = await screen.findByRole("group", {
      name: t("communities:end_date"),
    });

    await user.click(endDateGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("01012021");

    expect(endDateGroup).toHaveTextContent("01/01/2021");

    const endDateErrorText = screen.getByText(t("communities:end_date_error"));

    expect(endDateErrorText).toBeInTheDocument();
  });
});
