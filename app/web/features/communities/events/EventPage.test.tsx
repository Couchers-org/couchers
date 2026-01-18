import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import useCurrentUser from "features/userQueries/useCurrentUser";
import mockRouter from "next-router-mock";
import { User } from "proto/api_pb";
import { AttendanceState } from "proto/events_pb";
import { eventBaseRoute } from "routes";
import { service } from "service";
import events from "test/fixtures/events.json";
import users from "test/fixtures/users.json";
import hookWrapper from "test/hookWrapper";
import i18n from "test/i18n";
import {
  getEventAttendees,
  getEventOrganizers,
  getLiteUsers,
  getThread,
  getUser,
} from "test/serviceMockDefaults";
import { addDefaultUser, assertErrorAlert, mockConsoleError } from "test/utils";

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
jest.mock("features/userQueries/useCurrentUser");
const useCurrentUserMock = useCurrentUser as jest.MockedFunction<
  typeof useCurrentUser
>;

const getLiteUsersMock = service.user.getLiteUsers as jest.MockedFunction<
  typeof service.user.getLiteUsers
>;

function renderEventPage(id = 1, slug = "weekly-meetup") {
  mockRouter.setCurrentUrl(`${eventBaseRoute}/${id}/${slug}`);
  render(<EventPage eventId={id} eventSlug={slug} />, { wrapper: hookWrapper });
}

describe("Event page", () => {
  beforeEach(() => {
    addDefaultUser(1); // Set up auth state with userId 1
    getEventMock.mockResolvedValue(firstEvent);
    listEventAttendeesMock.mockImplementation(getEventAttendees);
    listEventOrganizersMock.mockImplementation(getEventOrganizers);
    getUserMock.mockImplementation(getUser);
    getLiteUsersMock.mockImplementation(getLiteUsers);
    getThreadMock.mockImplementation(getThread);
    useCurrentUserMock.mockReturnValue({
      data: users[0] as User.AsObject,
      isError: false,
      isFetching: false,
      isLoading: false,
      error: "",
    });
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-06-01 00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it("goes back to the previous page when the back button is clicked", async () => {
    mockRouter.back = jest.fn();
    // Mock window.history.length to simulate having history
    Object.defineProperty(window, "history", {
      value: { length: 2 },
      writable: true,
    });

    renderEventPage();
    await screen.findByRole("heading", { name: events[0].title });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.click(
      screen.getByRole("button", { name: t("communities:previous_page") }),
    );

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
  });

  it("navigates to events page when back button is clicked with no history", async () => {
    mockRouter.push = jest.fn();
    // Mock window.history.length to simulate no history
    Object.defineProperty(window, "history", {
      value: { length: 1 },
      writable: true,
    });

    renderEventPage();
    await screen.findByRole("heading", { name: events[0].title });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.click(
      screen.getByRole("button", { name: t("communities:previous_page") }),
    );

    await waitFor(() =>
      expect(mockRouter.push).toHaveBeenCalledWith("/events"),
    );
  });

  it("shows the 'edit event' button if the user has edit permission", async () => {
    getEventMock.mockResolvedValue({ ...firstEvent, canEdit: true });
    renderEventPage();

    expect(
      await screen.findByRole("button", { name: t("communities:edit_event") }),
    ).toBeVisible();
  });

  it("does not show the 'edit event' button if the user does not have edit permission", async () => {
    renderEventPage();

    expect(
      await screen.queryByRole("button", { name: t("communities:edit_event") }),
    ).not.toBeInTheDocument();
  });

  it("shows the 'duplicate event' button only for the event creator", async () => {
    // Current user is user 1 (from users[0])
    getEventMock.mockResolvedValue({ ...firstEvent, creatorUserId: 1 });
    renderEventPage();

    expect(
      await screen.findByRole("button", {
        name: t("communities:duplicate_event"),
      }),
    ).toBeVisible();
  });

  it("does not show the 'duplicate event' button if user is not the creator", async () => {
    // Current user is user 1, but event is created by user 2
    getEventMock.mockResolvedValue({ ...firstEvent, creatorUserId: 2 });
    renderEventPage();

    await screen.findByRole("heading", { name: firstEvent.title });

    expect(
      screen.queryByRole("button", {
        name: t("communities:duplicate_event"),
      }),
    ).not.toBeInTheDocument();
  });

  it("disables the 'duplicate event' button for cancelled events", async () => {
    getEventMock.mockResolvedValue({
      ...firstEvent,
      creatorUserId: 1,
      isCancelled: true,
    });
    renderEventPage();

    const duplicateButton = await screen.findByRole("button", {
      name: t("communities:duplicate_event"),
    });
    expect(duplicateButton).toBeDisabled();
    expect(duplicateButton).toHaveAttribute("tabIndex", "-1");
  });

  it("allows duplicating past events", async () => {
    const pastEvent = {
      ...firstEvent,
      creatorUserId: 1,
      endTime: { seconds: 1500000000, nanos: 0 }, // Past date
    };
    getEventMock.mockResolvedValue(pastEvent);
    renderEventPage();

    const duplicateButton = await screen.findByRole("button", {
      name: t("communities:duplicate_event"),
    });
    expect(duplicateButton).toBeEnabled();
    expect(duplicateButton).not.toHaveAttribute("tabIndex", "-1");
  });

  it("navigates to create event page with duplicate query param when clicked", async () => {
    mockRouter.push = jest.fn();
    getEventMock.mockResolvedValue({ ...firstEvent, creatorUserId: 1 });
    renderEventPage();

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const duplicateButton = await screen.findByRole("button", {
      name: t("communities:duplicate_event"),
    });
    await user.click(duplicateButton);

    await waitFor(() =>
      expect(mockRouter.push).toHaveBeenCalledWith(
        `/event/new?duplicateEventId=${firstEvent.eventId}`,
      ),
    );
  });

  it("has proper accessibility attributes", async () => {
    getEventMock.mockResolvedValue({ ...firstEvent, creatorUserId: 1 });
    renderEventPage();

    const duplicateButton = await screen.findByRole("button", {
      name: t("communities:duplicate_event"),
    });
    expect(duplicateButton).toHaveAttribute(
      "aria-label",
      t("communities:duplicate_event"),
    );
    expect(duplicateButton).toHaveAttribute("tabIndex", "0");
    expect(duplicateButton).not.toBeDisabled();
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

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      await user.click(attendanceMenuButton);
      const leaveEventOption = await screen.findByRole("menuitem", {
        name: t("communities:not_going_to_event"),
      });
      await user.click(leaveEventOption);
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

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

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
