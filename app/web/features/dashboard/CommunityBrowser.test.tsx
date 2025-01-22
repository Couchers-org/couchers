import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Community } from "proto/communities_pb";
import { service } from "service";
import hookWrapper from "test/hookWrapper";
import i18n from "test/i18n";

import CommunityBrowser from "./CommunityBrowser";

const { t } = i18n;

const getCommunityMock = service.communities
  .getCommunity as jest.MockedFunction<typeof service.communities.getCommunity>;
const listCommunitiesMock = service.communities
  .listCommunities as jest.MockedFunction<
  typeof service.communities.listCommunities
>;

const mockImplementation = async (id: number) => ({
  communitiesList: [
    {
      communityId: Number.parseInt(`${id}1`),
      name: `${id}1`,
      slug: `${id}1`,
    } as Community.AsObject,
    {
      communityId: Number.parseInt(`${id}2`),
      name: `${id}2`,
      slug: `${id}2`,
    } as Community.AsObject,
  ],
  nextPageToken: "",
});

describe("Community browser", () => {
  beforeEach(() => {
    getCommunityMock.mockResolvedValue({
      communityId: 1,
      name: "Global",
      slug: "global",
    } as Community.AsObject);

    listCommunitiesMock.mockImplementation(mockImplementation);
  });

  it("has correct display logic", async () => {
    render(<CommunityBrowser />, { wrapper: hookWrapper });

    //initial display
    const button11 = await screen.findByRole("button", { name: "11" });
    expect(button11).toBeVisible();
    expect(screen.getByRole("link", { name: "Global" })).toBeVisible();

    const user = userEvent.setup();

    //clicking down the tree
    await user.click(button11);
    const button111 = await screen.findByRole("button", { name: "111" });
    expect(button111).toBeVisible();
    await user.click(button111);
    expect(await screen.findByRole("button", { name: "1111" })).toBeVisible();

    //switching the previous column
    const button112 = screen.getByRole("button", { name: "112" });
    await user.click(button112);
    expect(await screen.findByRole("button", { name: "1121" })).toBeVisible();

    //deselecting the previous column
    await user.click(button112);
    expect(
      screen.queryByRole("button", { name: "1121" }),
    ).not.toBeInTheDocument();

    //switching the first column
    const button12 = screen.getByRole("button", { name: "12" });
    await user.click(button12);
    const button121 = await screen.findByRole("button", { name: "121" });
    expect(button121).toBeVisible();

    await user.click(button121);
    expect(await screen.findByRole("button", { name: "1211" })).toBeVisible();

    //deselect the first column
    await user.click(button12);
    expect(button121).not.toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    listCommunitiesMock.mockImplementation(async (id) => {
      if (id < 100) return mockImplementation(id);
      else return { communitiesList: [], nextPageToken: "" };
    });
    render(<CommunityBrowser />, { wrapper: hookWrapper });

    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "11" }));
    await user.click(await screen.findByRole("button", { name: "111" }));
    expect(
      await screen.findByText(t("dashboard:no_sub_communities")),
    ).toBeVisible();
  });
});
