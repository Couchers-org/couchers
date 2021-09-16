import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Community } from "proto/communities_pb";
import { service } from "service";
import hookWrapper from "test/hookWrapper";

import CommunityBrowser from "./CommunityBrowser";

const getCommunityMock = service.communities
  .getCommunity as jest.MockedFunction<typeof service.communities.getCommunity>;
const listCommunitiesMock = service.communities
  .listCommunities as jest.MockedFunction<
  typeof service.communities.listCommunities
>;

describe("Community browser", () => {
  beforeEach(() => {
    getCommunityMock.mockResolvedValue({
      communityId: 1,
      name: "Global",
      slug: "global",
    } as Community.AsObject);

    listCommunitiesMock.mockImplementation(async (id) => ({
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
    }));
  });

  it("has correct display logic", async () => {
    render(<CommunityBrowser />, { wrapper: hookWrapper });

    //initial display
    expect(await screen.findByRole("button", { name: "11" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Global" })).toBeVisible();

    //clicking down the tree
    userEvent.click(screen.getByRole("button", { name: "11" }));
    expect(await screen.findByRole("button", { name: "111" })).toBeVisible();
    userEvent.click(screen.getByRole("button", { name: "111" }));
    expect(await screen.findByRole("button", { name: "1111" })).toBeVisible();

    //switching the previous column
    userEvent.click(screen.getByRole("button", { name: "112" }));
    expect(await screen.findByRole("button", { name: "1121" })).toBeVisible();

    //deselecting the previous column
    userEvent.click(screen.getByRole("button", { name: "112" }));
    expect(
      screen.queryByRole("button", { name: "1121" })
    ).not.toBeInTheDocument();

    //switching the first column
    userEvent.click(screen.getByRole("button", { name: "12" }));
    expect(await screen.findByRole("button", { name: "121" })).toBeVisible();

    userEvent.click(screen.getByRole("button", { name: "121" }));
    expect(await screen.findByRole("button", { name: "1211" })).toBeVisible();

    //deselect the first column
    userEvent.click(screen.getByRole("button", { name: "12" }));
    expect(
      screen.queryByRole("button", { name: "121" })
    ).not.toBeInTheDocument();
  });
});
