import { render, screen } from "@testing-library/react";
import { ListMyCommunitiesPublicTripsRes } from "proto/public_trips_pb";
import { service } from "service";
import publicTrips from "test/fixtures/publicTrips";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import DashboardCommunityPublicTrips from "./DashboardCommunityPublicTrips";

const { t } = i18n;

const listMyCommunitiesPublicTripsMock = service.publicTrips.listMyCommunitiesPublicTrips as jest.MockedFunction<
  typeof service.publicTrips.listMyCommunitiesPublicTrips
>;

function mockTrips(trips: typeof publicTrips) {
  listMyCommunitiesPublicTripsMock.mockResolvedValue({
    ...new ListMyCommunitiesPublicTripsRes().toObject(),
    publicTripsList: trips,
  });
}

describe("DashboardCommunityPublicTrips", () => {
  it("shows other members' trips with their community, linking to the community's public trips", async () => {
    mockTrips(publicTrips.slice(0, 2));
    render(<DashboardCommunityPublicTrips />, { wrapper });

    expect(screen.getByRole("heading", { name: t("dashboard:public_trips.community_trips_header") })).toBeVisible();
    const [first] = publicTrips;
    const name = await screen.findByText(first.user!.name);
    expect(name.closest("a")).toHaveAttribute(
      "href",
      `/community/${first.communityId}/${first.communitySlug}/public-trips#trip-${first.tripId}`,
    );
    expect(screen.getAllByText(first.communityName)[0]).toBeVisible();
    expect(screen.getByText(publicTrips[1].user!.name)).toBeVisible();
  });

  it("shows an empty message when there are no trips", async () => {
    mockTrips([]);
    render(<DashboardCommunityPublicTrips />, { wrapper });

    expect(await screen.findByText(t("dashboard:public_trips.community_trips_empty_description"))).toBeVisible();
  });
});
