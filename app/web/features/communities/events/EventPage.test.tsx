import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { AttendanceState } from "proto/events_pb";
import { eventBaseRoute } from "routes";
import { service } from "service";
import events from "test/fixtures/events.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import i18n from "test/i18n";
import {
  getEventAttendees,
  getEventOrganizers,
  getThread,
  getUser,
} from "test/serviceMockDefaults";
import { assertErrorAlert, mockConsoleError } from "test/utils";
import timezoneMock from "timezone-mock";

import EventPage from "./EventPage";

const { t } = i18n;

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

function renderEventPage(id = 1, slug = "weekly-meetup") {
  mockRouter.setCurrentUrl(`${eventBaseRoute}/${id}/${slug}`);
  const { wrapper } = getHookWrapperWithClient();
  render(<EventPage eventId={id} eventSlug={slug} />, { wrapper });
}

describe("Event page", () => {
  beforeEach(() => {
    getEventMock.mockResolvedValue(firstEvent);
    listEventAttendeesMock.mockImplementation(getEventAttendees);
    listEventOrganizersMock.mockImplementation(getEventOrganizers);
    getUserMock.mockImplementation(getUser);
    getThreadMock.mockImplementation(getThread);
    timezoneMock.register("UTC");
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-06-01 00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
    timezoneMock.unregister();
  });

  it("renders an offline event successfully", async () => {
    renderEventPage();

    expect(
      await screen.findByRole("heading", { name: firstEvent.title }),
    ).toBeVisible();
    expect(
      await screen.findByText(firstEvent.offlineInformation!.address),
    ).toBeVisible();
    expect(
      await screen.findByText("Tuesday, June 29, 2021 2:37 AM to 3:37 AM"),
    ).toBeVisible();
    // Event image

    const eventImage = await screen.findByTestId("event-cover-photo");
    expect(eventImage).toBeVisible();

    const attendanceMenuButton = screen.getByRole("button", {
      name: t("communities:going_to_event"),
    });
    expect(attendanceMenuButton).toBeVisible();

    // Event details
    expect(
      screen.getByRole("heading", {
        name: t("communities:details_subheading_colon"),
      }),
    ).toBeVisible();
    expect(screen.getByText("Be there")).toBeVisible();
    expect(screen.getByText("or be square!")).toBeVisible();

    // Basic checks that the organizers and attendees sections are rendered
    expect(
      screen.getByRole("heading", { name: t("communities:organizers") }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: t("communities:attendees") }),
    ).toBeVisible();

    // Basic checks that the discussion has been rendered
    expect(
      screen.getByRole("heading", { name: t("communities:event_discussion") }),
    ).toBeVisible();
    expect(
      screen.getByLabelText(t("communities:write_comment_a11y_label")),
    ).toBeVisible();
  });

  it("renders an online event successfully", async () => {
    getEventMock.mockResolvedValue(secondEvent);
    renderEventPage(secondEvent.eventId, secondEvent.slug);

    // Should be identical in structure as first test, so only assert on things that are different
    expect(
      await screen.findByText(t("communities:virtual_event")),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: t("communities:event_link") }),
    ).toBeVisible();
  });

  it("renders an event with a different start and end day correctly", async () => {
    getEventMock.mockResolvedValue(thirdEvent);
    renderEventPage(thirdEvent.eventId, thirdEvent.slug);

    expect(
      await screen.findByText(
        "Tuesday, June 29, 2021 9:00 PM to Wednesday, June 30, 2021 2:00 AM",
      ),
    ).toBeVisible();
  });

  // no way to test "back" with
  it("goes back to the previous page when the back button is clicked", async () => {
    mockRouter.back = jest.fn();
    renderEventPage();
    await screen.findByRole("heading", { name: events[0].title });

    const user = userEvent.setup();

    // @TODO should be awaited but doesn't work, try again after more package upgrades
    user.click(
      screen.getByRole("button", { name: t("communities:previous_page") }),
    );

    await waitFor(() => expect(mockRouter.back).toBeCalled());
  });

  it("shows the 'edit event' button if the user has edit permission", async () => {
    getEventMock.mockResolvedValue({ ...firstEvent, canEdit: true });
    renderEventPage();

    expect(
      await screen.findByRole("link", { name: t("communities:edit_event") }),
    ).toBeVisible();
  });

  it("does not show the 'edit event' button if the user does not have edit permission", async () => {
    renderEventPage();

    expect(
      await screen.queryByRole("button", { name: t("communities:edit_event") }),
    ).not.toBeInTheDocument();
  });

  it("shows the not found page if the user tries to find an event with an invalid ID in the URL", async () => {
    renderEventPage(0, "event");
    expect(
      await screen.findByRole("img", { name: "404 Error: Resource Not Found" }),
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

      const attendanceMenuButton = await screen.findByRole("button", {
        name: t("communities:going_to_event"),
      });

      const user = userEvent.setup();
      // @TODO should be awaited but doesn't work, try again after more package upgrades
      user.click(attendanceMenuButton);
      const leaveEventOption = await screen.findByRole("menuitem", {
        name: t("communities:not_going_to_event"),
      });
      user.click(leaveEventOption);

      expect(
        await screen.findByRole("button", {
          name: t("communities:join_event"),
        }),
      ).toBeVisible();
      expect(
        screen.queryByRole("heading", { name: "Funny Cat current User" }),
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

      const attendanceMenuButton = await screen.findByRole("button", {
        name: t("communities:going_to_event"),
      });

      const user = await userEvent.setup();

      //@TODO this should be awaited but doesn't work. Try again after more package upgrades
      user.click(attendanceMenuButton);
      const leaveEventOption = await screen.findByRole("menuitem", {
        name: t("communities:not_going_to_event"),
      });
      user.click(leaveEventOption);

      await assertErrorAlert(errorMessage);
    });
  });
});
