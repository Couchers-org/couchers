import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getProfileLinkA11yLabel } from "components/Avatar/constants";
import { Route, Switch } from "react-router-dom";
import { discussionBaseRoute, discussionRoute } from "routes";
import { service } from "service";
import comments from "test/fixtures/comments.json";
import community from "test/fixtures/community.json";
import discussions from "test/fixtures/discussions.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { getThread, getUser } from "test/serviceMockDefaults";
import { MockedService } from "test/utils";

import { LOAD_EARLIER_COMMENTS, LOAD_EARLIER_REPLIES } from "../constants";
import { COMMENT_TEST_ID } from "./Comment";
import DiscussionPage from "./DiscussionPage";

jest.mock("components/MarkdownInput");

const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;
const getCommunityMock = service.communities.getCommunity as MockedService<
  typeof service.communities.getCommunity
>;
const getDiscussionMock = service.discussions.getDiscussion as MockedService<
  typeof service.discussions.getDiscussion
>;
const getThreadMock = service.threads.getThread as MockedService<
  typeof service.threads.getThread
>;
const postReplyMock = service.threads.postReply as MockedService<
  typeof service.threads.postReply
>;

function renderDiscussion() {
  const { client, wrapper } = getHookWrapperWithClient({
    initialRouterEntries: [
      "/previous-page",
      `${discussionBaseRoute}/1/what-is-there-to-do-in-amsterdam`,
    ],
    initialIndex: 1,
  });
  render(
    <Switch>
      <Route exact path={discussionRoute}>
        <DiscussionPage />
      </Route>
      <Route exact path="/previous-page">
        <h1 data-testid="previous-page">Previous page</h1>
      </Route>
    </Switch>,
    { wrapper }
  );

  return client;
}

describe("Discussion page", () => {
  beforeAll(() => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date("2021-05-10"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
    getCommunityMock.mockResolvedValue(community);
    getDiscussionMock.mockResolvedValue(discussions[0]);
    getThreadMock.mockImplementation(getThread);
    postReplyMock.mockResolvedValue({
      threadId: 999,
    });
  });

  it("renders a loading skeleton if the user info is still loading", async () => {
    getUserMock.mockImplementation(async () => new Promise(() => undefined));
    renderDiscussion();
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "What is there to do in Amsterdam?",
      })
    ).toBeVisible();
    expect(
      screen.queryByRole("link", {
        name: getProfileLinkA11yLabel("Funny Cat current User"),
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Funny Cat current User")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Created at Jan 01, 2020")
    ).not.toBeInTheDocument();
  });

  describe("when there are more than one page of comments", () => {
    it("shows a 'load earlier comments' button that lets you load earlier comments", async () => {
      getThreadMock.mockImplementation(async (threadId, pageToken) => {
        if (threadId === 2) {
          return pageToken
            ? { nextPageToken: "", repliesList: [comments[2], comments[3]] }
            : { nextPageToken: "4", repliesList: [comments[0], comments[1]] };
        }
        return getThread(threadId);
      });
      renderDiscussion();
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      userEvent.click(
        screen.getByRole("button", { name: LOAD_EARLIER_COMMENTS })
      );
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      const firstCommentAfterLoadMore =
        screen.getAllByTestId(COMMENT_TEST_ID)[0];
      expect(
        within(firstCommentAfterLoadMore).getByText(comments[3].content)
      ).toBeVisible();
      // 1 for main discussion + 4 comments + 1 for second page of discussion
      expect(getThreadMock).toHaveBeenCalledTimes(6);
      expect(getThreadMock).toHaveBeenCalledWith(2, "4");
    });

    it("shows a 'load more replies' button that lets you load earlier replies", async () => {
      getThreadMock.mockImplementation(async (threadId, pageToken) => {
        if (threadId === 3) {
          return pageToken
            ? {
                nextPageToken: "",
                repliesList: [
                  { ...comments[4], threadId: 72, content: "Agreed!" },
                ],
              }
            : { nextPageToken: "71", repliesList: [comments[4]] };
        }
        return getThread(threadId);
      });
      renderDiscussion();
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      userEvent.click(
        screen.getByRole("button", { name: LOAD_EARLIER_REPLIES })
      );
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      expect(screen.getByText("Agreed!")).toBeVisible();
      // 1 for main discussion + 4 comments + 1 for second page of reply for oldest comment
      expect(getThreadMock).toHaveBeenCalledTimes(6);
      expect(getThreadMock).toHaveBeenCalledWith(3, "71");
    });
  });
});
