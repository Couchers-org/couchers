import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { AttendanceState } from "proto/events_pb";
import { eventBaseRoute, eventRoute } from "routes";
import { service } from "service";
import events from "test/fixtures/events.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import {
  getEventAttendees,
  getEventOrganizers,
  getThread,
  getUser,
} from "test/serviceMockDefaults";
import { assertErrorAlert, mockConsoleError } from "test/utils";
import timezoneMock from "timezone-mock";

import { PREVIOUS_PAGE, WRITE_COMMENT_A11Y_LABEL } from "../constants";
import {
  ATTENDEES,
  details,
  EDIT_EVENT,
  EVENT_DISCUSSION,
  EVENT_LINK,
  JOIN_EVENT,
  LEAVE_EVENT,
  ORGANIZERS,
  VIRTUAL_EVENT,
} from "./constants";
import EventPage from "./EventPage";

jest.mock("components/MarkdownInput");

const [firstEvent, secondEvent, thirdEvent] = events;

const getEventMock = service.events.getEvent as jest.MockedFunction<
  typeof service.events.getEvent
>;
const listEventOrganizersMock = service.events
  .listEventOrganizers as jest.MockedFunction<
  typeof service.events.listEventOrganizers
>;
const listEventAttendeesMock = service.events
  .listEventAttendees as jest.MockedFunction<
  typeof service.events.listEventAttendees
>;
const getUserMock = service.user.getUser as jest.MockedFunction<
  typeof service.user.getUser
>;
const getThreadMock = service.threads.getThread as jest.MockedFunction<
  typeof service.threads.getThread
>;
const setEventAttendanceMock = service.events
  .setEventAttendance as jest.MockedFunction<
  typeof service.events.setEventAttendance
>;

function renderEventPage(
  initialUrl: string = `${eventBaseRoute}/1/weekly-meetup`
) {
  mockRouter.setCurrentUrl(initialUrl);
  const { wrapper } = getHookWrapperWithClient();
  render(<EventPage eventId={1} eventSlug="weekly-meetup" />, { wrapper });
}

describe("Event page", () => {
  beforeEach(() => {
    getEventMock.mockResolvedValue(firstEvent);
    listEventAttendeesMock.mockImplementation(getEventAttendees);
    listEventOrganizersMock.mockImplementation(getEventOrganizers);
    getUserMock.mockImplementation(getUser);
    getThreadMock.mockImplementation(getThread);
    timezoneMock.register("UTC");
  });

  afterEach(() => {
    timezoneMock.unregister();
  });

  it("renders an offline event successfully", async () => {
    renderEventPage();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(
      screen.getByRole("heading", { name: firstEvent.title })
    ).toBeVisible();
    expect(
      screen.getByText(firstEvent.offlineInformation?.address!)
    ).toBeVisible();
    expect(
      screen.getByText("Tuesday, June 29, 2021 2:37 AM to 3:37 AM")
    ).toBeVisible();
    // Event image
    expect(screen.getByRole("img", { name: "" })).toBeVisible();

    expect(screen.getByRole("button", { name: LEAVE_EVENT })).toBeVisible();

    // Event details
    expect(screen.getByRole("heading", { name: details() })).toBeVisible();
    expect(screen.getByText("Be there")).toBeVisible();
    expect(screen.getByText("or be square!")).toBeVisible();

    // Basic checks that the organizers and attendees sections are rendered
    expect(screen.getByRole("heading", { name: ORGANIZERS })).toBeVisible();
    expect(screen.getByRole("heading", { name: ATTENDEES })).toBeVisible();

    // Basic checks that the discussion has been rendered
    expect(
      screen.getByRole("heading", { name: EVENT_DISCUSSION })
    ).toBeVisible();
    expect(screen.getByLabelText(WRITE_COMMENT_A11Y_LABEL)).toBeVisible();
  });

  it("renders an online event successfully", async () => {
    getEventMock.mockResolvedValue(secondEvent);
    renderEventPage();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    // Should be identical in structure as first test, so only assert on things that are different
    expect(screen.getByText(VIRTUAL_EVENT)).toBeVisible();
    expect(screen.getByRole("link", { name: EVENT_LINK })).toBeVisible();
  });

  it("renders an event with a different start and end day correctly", async () => {
    getEventMock.mockResolvedValue(thirdEvent);
    renderEventPage();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(
      screen.getByText(
        "Tuesday, June 29, 2021 9:00 PM to Wednesday, June 30, 2021 2:00 AM"
      )
    ).toBeVisible();
  });

  it("goes back to the previous page when the back button is clicked", async () => {
    renderEventPage();
    await screen.findByRole("heading", { name: events[0].title });

    userEvent.click(screen.getByRole("button", { name: PREVIOUS_PAGE }));

    expect(screen.getByTestId("previous-page")).toBeInTheDocument();
  });

  it("shows the 'edit event' button if the user has edit permission", async () => {
    getEventMock.mockResolvedValue({ ...firstEvent, canEdit: true });
    renderEventPage();

    expect(
      await screen.findByRole("button", { name: EDIT_EVENT })
    ).toBeVisible();
  });

  it("shows the 'edit event' button if the user has moderation permission", async () => {
    getEventMock.mockResolvedValue({ ...firstEvent, canModerate: true });
    renderEventPage();

    expect(
      await screen.findByRole("button", { name: EDIT_EVENT })
    ).toBeVisible();
  });

  it("does not show the 'edit event' button if the user does not have edit permission", async () => {
    renderEventPage();
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(
      screen.queryByRole("button", { name: EDIT_EVENT })
    ).not.toBeInTheDocument();
  });

  it("shows the not found page if the user tries to find an event with an invalid ID in the URL", async () => {
    renderEventPage(`${eventBaseRoute}/xyz/event`);
    expect(
      await screen.findByRole("img", { name: "404 Error: Resource Not Found" })
    ).toBeVisible();
  });

  it("shows an error alert if the event failed to load", async () => {
    mockConsoleError();
    const errorMessage = "Error fetching event";
    getEventMock.mockRejectedValue(new Error(errorMessage));

    renderEventPage();

    await assertErrorAlert(errorMessage);
  });

  describe("when the event attendance button is clicked", () => {
    it("updates the current user's attendance state", async () => {
      setEventAttendanceMock.mockResolvedValue({
        ...firstEvent,
        attendanceState: AttendanceState.ATTENDANCE_STATE_NOT_GOING,
      });
      listEventAttendeesMock.mockImplementation(async () => {
        return { ...getEventAttendees(), attendeeUserIdsList: [4] };
      });
      renderEventPage();
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      const attendanceButton = screen.getByRole("button", {
        name: LEAVE_EVENT,
      });
      userEvent.click(attendanceButton);

      expect(
        await screen.findByRole("button", { name: JOIN_EVENT })
      ).toBeVisible();
      expect(
        screen.queryByRole("heading", { name: "Funny Cat current User" })
      ).not.toBeInTheDocument();
      expect(setEventAttendanceMock).toHaveBeenCalledTimes(1);
      expect(setEventAttendanceMock).toHaveBeenCalledWith({
        attendanceState: 0,
        eventId: 1,
      });
      // Check that the update doesn't cause the event to be refetched since we should be
      // using the updated event from mutation
      expect(getEventMock).toHaveBeenCalledTimes(1);
    });

    it("shows an error alert if the attendance state update failed", async () => {
      mockConsoleError();
      const errorMessage = "Error updating attendance state";
      setEventAttendanceMock.mockRejectedValue(new Error(errorMessage));
      renderEventPage();
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      userEvent.click(screen.getByRole("button", { name: LEAVE_EVENT }));

      await assertErrorAlert(errorMessage);
    });
  });
});
