import { render, screen } from "@testing-library/react";
import { service } from "service";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import { getDashboard } from "test/serviceMockDefaults";

import CommunityEvents from "./CommunityEvents";
import MyEvents from "./MyEvents";

const getDashboardMock = service.dashboard.getDashboard as jest.MockedFunction<typeof service.dashboard.getDashboard>;
const listMyEventsMock = service.events.listMyEvents as jest.MockedFunction<typeof service.events.listMyEvents>;

const [myEvent, communityEvent] = events.filter((event) => !event.isCancelled);

describe("useGetDashboardSection", () => {
  it("loads every widget on the dashboard with a single request", async () => {
    getDashboardMock.mockImplementation(() =>
      getDashboard({
        myEvents: { eventsList: [myEvent], nextPageToken: "", totalItems: 1 },
        communityEvents: { eventsList: [communityEvent], nextPageToken: "", totalItems: 1 },
      }),
    );

    render(
      <>
        <MyEvents />
        <CommunityEvents />
      </>,
      { wrapper },
    );

    expect(await screen.findByText(myEvent.title)).toBeVisible();
    expect(await screen.findByText(communityEvent.title)).toBeVisible();
    expect(getDashboardMock).toHaveBeenCalledTimes(1);
    expect(listMyEventsMock).not.toHaveBeenCalled();
  });
});
