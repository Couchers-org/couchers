import { render, screen } from "@testing-library/react";
import { Community } from "proto/communities_pb";
import { service } from "service";
import community from "test/fixtures/community.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getDashboard } from "test/serviceMockDefaults";

import MyCommunities from "./MyCommunities";

const { t } = i18n;

const getDashboardMock = service.screens.getDashboard as jest.MockedFunction<typeof service.screens.getDashboard>;

function mockCommunities(communitiesList: Community.AsObject[]) {
  getDashboardMock.mockImplementation(() => getDashboard({ myCommunities: { communitiesList, nextPageToken: "" } }));
}

describe("MyCommunities", () => {
  it("shows the user's communities from the dashboard, linking to each community", async () => {
    mockCommunities([community as Community.AsObject]);
    render(<MyCommunities />, { wrapper });

    expect(screen.getByRole("heading", { name: t("dashboard:your_communities_heading") })).toBeVisible();
    const name = await screen.findByText(community.name);
    expect(name.closest("a")).toHaveAttribute("href", `/community/${community.communityId}/${community.slug}`);
    expect(screen.getByText(t("dashboard:member_count", { count: community.memberCount }))).toBeVisible();
    // the communities come from the dashboard, not a separate request
    expect(service.communities.listUserCommunities).not.toHaveBeenCalled();
  });

  it("shows an empty message when the user has no communities", async () => {
    mockCommunities([]);
    render(<MyCommunities />, { wrapper });

    expect(await screen.findByText(t("dashboard:no_community"))).toBeVisible();
  });
});
