import { render, screen, waitFor } from "@testing-library/react";
import useCurrentUser from "features/userQueries/useCurrentUser";
import mockRouter from "next-router-mock";
import EventByIdPage from "pages/event/[id]";
import EventBySlugPage from "pages/event/[id]/[slug]";
import { User } from "proto/api_pb";
import { routeToEvent } from "routes";
import { service } from "service";
import events from "test/fixtures/events.json";
import users from "test/fixtures/users.json";
import hookWrapper from "test/hookWrapper";
import { getEventAttendees, getEventOrganizers, getLiteUsers, getThread, getUser } from "test/serviceMockDefaults";
import { addDefaultUser } from "test/utils";

const [firstEvent] = events;

const getEventMock = service.events.getEvent as jest.MockedFunction<typeof service.events.getEvent>;
const listEventOrganizersMock = service.events.listEventOrganizers as jest.MockedFunction<
  typeof service.events.listEventOrganizers
>;
const listEventAttendeesMock = service.events.listEventAttendees as jest.MockedFunction<
  typeof service.events.listEventAttendees
>;
const getUserMock = service.user.getUser as jest.MockedFunction<typeof service.user.getUser>;
const getThreadMock = service.threads.getThread as jest.MockedFunction<typeof service.threads.getThread>;
const getLiteUsersMock = service.user.getLiteUsers as jest.MockedFunction<typeof service.user.getLiteUsers>;

jest.mock("features/userQueries/useCurrentUser");
const useCurrentUserMock = useCurrentUser as jest.MockedFunction<typeof useCurrentUser>;

describe("event id route", () => {
  beforeEach(() => {
    addDefaultUser(1);
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
  });

  it("redirects /event/{id} to the canonical slug url", async () => {
    const replace = jest.spyOn(mockRouter, "replace").mockResolvedValue(true);
    mockRouter.setCurrentUrl({
      pathname: "/event/[id]",
      query: { id: String(firstEvent.eventId) },
    });
    render(<EventByIdPage />, { wrapper: hookWrapper });

    expect(await screen.findByRole("heading", { name: firstEvent.title })).toBeVisible();
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(routeToEvent(firstEvent.eventId, firstEvent.slug));
    });
    expect(getEventMock).toHaveBeenCalledWith(firstEvent.eventId);
    replace.mockRestore();
  });

  it("still renders /event/{id}/{slug}", async () => {
    const canonical = routeToEvent(firstEvent.eventId, firstEvent.slug);
    mockRouter.setCurrentUrl({
      pathname: "/event/[id]/[slug]",
      query: { id: String(firstEvent.eventId), slug: firstEvent.slug },
    });
    render(<EventBySlugPage />, { wrapper: hookWrapper });

    expect(await screen.findByRole("heading", { name: firstEvent.title })).toBeVisible();
    expect(mockRouter.asPath).toBe(canonical);
  });

  it("shows not found for a non-numeric event id", async () => {
    mockRouter.setCurrentUrl({
      pathname: "/event/[id]",
      query: { id: "not-an-id" },
    });
    render(<EventByIdPage />, { wrapper: hookWrapper });

    expect(await screen.findByRole("img", { name: "404 Error: Resource Not Found" })).toBeVisible();
    expect(getEventMock).not.toHaveBeenCalled();
  });
});
