import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { service } from "service";
import community from "test/fixtures/community.json";
import discussions from "test/fixtures/discussions.json";
import wrapper from "test/hookWrapper";
import { MockedService } from "test/utils";

import { DISCUSSION_CARD_TEST_ID } from "../CommunityPage/DiscussionCard";
import DiscussionsListPage from "./DiscussionsListPage";

const listDiscussionsMock = service.communities
  .listDiscussions as MockedService<typeof service.communities.listDiscussions>;

describe("DiscussionsListPage", () => {
  beforeEach(() => {
    listDiscussionsMock.mockResolvedValue({
      discussionsList: discussions,
      nextPageToken: "",
    });
  });
  it("renders a list of discussion", async () => {
    render(<DiscussionsListPage community={community} />, { wrapper });

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    // TODO: better and more thorough checks than these
    expect(await screen.findAllByTestId(DISCUSSION_CARD_TEST_ID)).toHaveLength(
      2
    );
    expect(listDiscussionsMock).toHaveBeenCalledTimes(1);
    // (communityId, pageToken)
    expect(listDiscussionsMock).toHaveBeenCalledWith(2, undefined);
  });
  // TODO - missing test cases:
  // loading state
  // error state
  // Create a new discussion - success and clears form
  // Error creating discussion
  // Cancelling new discussion clear form
});
