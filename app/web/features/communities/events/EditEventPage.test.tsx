import { render, screen, waitFor } from "@testing-library/react";
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
  };
});

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
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-06-01 00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders with the existing event and updates it successfully", async () => {
    renderPage();

    // Brief sanity check that the form has existing data
    const titleField = await screen.findByLabelText(t("global:title"));
    expect(titleField).toHaveValue("Weekly Meetup");

    const user = userEvent.setup();

    user.type(titleField, " in the dam");

    await waitFor(() => {
      expect(titleField).toHaveValue("Weekly Meetup in the dam");
    });

    const virtualEventCheckBox = screen.getByLabelText(
      t("communities:virtual_event"),
    ) as HTMLInputElement;

    user.click(virtualEventCheckBox);

    await waitFor(() => {
      expect(virtualEventCheckBox.checked).toBe(true);
    });

    const eventLinkInput = (await screen.findByLabelText(
      t("communities:event_link"),
    )) as HTMLInputElement;

    user.type(eventLinkInput, "https://couchers.org/amsterdam-social");

    await waitFor(
      () => {
        expect(eventLinkInput).toHaveValue(
          "https://couchers.org/amsterdam-social",
        );
      },
      { timeout: 5000 },
    );

    const eventDetails = screen.getByLabelText(t("communities:event_details"));

    user.clear(eventDetails);

    user.type(eventDetails, "We are going virtual this week!");

    await waitFor(
      () => {
        expect(eventDetails).toHaveValue("We are going virtual this week!");
      },
      { timeout: 5000 },
    );

    const endDateField = await screen.findByLabelText<HTMLInputElement>(
      t("communities:end_date"),
    );

    user.clear(endDateField);

    user.type(endDateField, "07012021");

    await waitFor(() => {
      expect(endDateField).toHaveValue("07/01/2021");
    });

    user.click(screen.getByRole("button", { name: t("global:update") }));

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

  it("should submit only the start date if the start date field is touched", async () => {
    renderPage();

    const startDateField = await screen.findByLabelText<HTMLInputElement>(
      t("communities:start_date"),
    );

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    user.clear(startDateField);
    user.type(startDateField, "08012021");

    await waitFor(() => {
      expect(startDateField).toHaveValue("08/01/2021");
    });

    user.click(screen.getByRole("button", { name: t("global:update") }));

    await waitFor(
      () => {
        expect(updateEventMock).toHaveBeenCalledTimes(1);
      },
      { timeout: 5000 },
    );

    expect(updateEventMock).toHaveBeenCalledWith({
      eventId: 1,
      isOnline: false,
      startTime: new Date("2021-08-01 02:37"),
    });
  });

  it("should submit only the start date if the start time field is touched", async () => {
    renderPage();

    const startTimeField = (await screen.findByLabelText(
      t("communities:start_time"),
    )) as HTMLInputElement;

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    user.clear(startTimeField);
    user.type(startTimeField, "0000");

    await waitFor(() => {
      expect(startTimeField).toHaveValue("00:00");
    });

    user.click(screen.getByRole("button", { name: t("global:update") }));

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
    expect(screen.queryByLabelText(t("global:title"))).not.toBeInTheDocument();
  });

  it.only("should show error if startDate after endDate", async () => {
    renderPage();

    const startDateField = await screen.findByLabelText<HTMLInputElement>(
      t("communities:start_date"),
    );

    const user = userEvent.setup();

    user.clear(startDateField);
    user.type(startDateField, "07012021");

    await waitFor(() => {
      expect(startDateField).toHaveValue("07/01/2021");
    });

    const endDateField = await screen.findByLabelText<HTMLInputElement>(
      t("communities:end_date"),
    );

    user.clear(endDateField);
    user.type(endDateField, "01012021");

    await waitFor(() => {
      expect(endDateField).toHaveValue("01/01/2021");
    });

    const endDateErrorText = screen.getByText(t("communities:end_date_error"));

    expect(endDateErrorText).toBeInTheDocument();
  });
});
