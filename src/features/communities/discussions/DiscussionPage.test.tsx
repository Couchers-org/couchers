import {
  render,
  screen,
  waitFor,
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
import {
  assertErrorAlert,
  mockConsoleError,
  MockedService,
  wait,
} from "test/utils";

import {
  CLOSE,
  COMMENT,
  COMMENTS,
  getByCreator,
  LOAD_EARLIER_COMMENTS,
  LOAD_EARLIER_REPLIES,
  NO_COMMENTS,
  PREVIOUS_PAGE,
  REPLY,
  WRITE_COMMENT_A11Y_LABEL,
} from "../constants";
import { COMMENT_TEST_ID, REFETCH_LOADING_TEST_ID } from "./Comment";
import DiscussionPage, { CREATOR_TEST_ID } from "./DiscussionPage";

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

function getThreadAfterSuccessfulComment({
  newComment,
  threadIdToUpdate,
}: {
  newComment: string;
  threadIdToUpdate: number;
}) {
  return async (threadId: number) => {
    const res = await getThread(threadId);
    if (threadId === threadIdToUpdate) {
      await wait(100);
      return {
        repliesList: [
          {
            authorUserId: 1,
            content: newComment,
            numReplies: 0,
            threadId: 999,
            createdTime: { seconds: 1577960000, nanos: 0 },
          },
          ...res.repliesList,
        ],
        nextPageToken: "",
      };
    }
    return res;
  };
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

  it("renders the discussion successfully", async () => {
    renderDiscussion();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    // Author and discussion content assertions
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "What is there to do in Amsterdam?",
      })
    ).toBeVisible();
    expect(
      screen.getByText(/i'm looking for activities to do here!/i)
    ).toBeVisible();

    const creatorContainer = within(screen.getByTestId(CREATOR_TEST_ID));
    expect(
      creatorContainer.getByRole("link", {
        name: getProfileLinkA11yLabel("Funny Cat current User"),
      })
    ).toBeVisible();
    expect(creatorContainer.getByText("Funny Cat current User")).toBeVisible();
    expect(creatorContainer.getByText("Created at Jan 01, 2020")).toBeVisible();
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

  it("renders the comments tree in the discussion correctly", async () => {
    renderDiscussion();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    const commentCards = await (
      await screen.findAllByTestId(COMMENT_TEST_ID)
    ).map((element) => within(element));
    expect(commentCards).toHaveLength(8);

    expect(screen.getByRole("heading", { name: COMMENTS })).toBeVisible();
    // check top level comment
    const firstTopLevelComment = comments.find((c) => c.threadId === 6);
    const commentUser = await getUser(
      firstTopLevelComment!.authorUserId.toString()
    );
    expect(
      commentCards[0].getByRole("img", { name: commentUser.name })
    ).toBeVisible();
    expect(
      commentCards[0].getByRole("link", {
        name: getProfileLinkA11yLabel(commentUser.name),
      })
    ).toBeVisible();
    expect(
      commentCards[0].getByText(
        `${getByCreator(commentUser.name)} • 1 year ago`
      )
    ).toBeVisible();
    expect(
      commentCards[0].getByText(firstTopLevelComment!.content)
    ).toBeVisible();
    expect(commentCards[0].getByRole("button", { name: REPLY })).toBeVisible();

    // check nested comment/reply
    const replyUser = await getUser("3");
    expect(
      commentCards[1].getByRole("img", { name: replyUser.name })
    ).toBeVisible();
    expect(
      commentCards[1].getByRole("link", {
        name: getProfileLinkA11yLabel(replyUser.name),
      })
    ).toBeVisible();
    expect(
      commentCards[1].getByText(`${getByCreator(replyUser.name)} • 1 year ago`)
    ).toBeVisible();
    expect(commentCards[1].getByText("+6")).toBeVisible();
    // Nested comment cannot be replied on further
    expect(
      commentCards[1].queryByRole("button", { name: REPLY })
    ).not.toBeInTheDocument();
  });

  it("shows the no comments message if there aren't any in the discussion", async () => {
    getThreadMock.mockResolvedValue({ nextPageToken: "", repliesList: [] });
    renderDiscussion();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(screen.getByText(NO_COMMENTS)).toBeVisible();
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

  it("shows an error alert if the comments fails to load", async () => {
    mockConsoleError();
    const errorMessage = "Cannot get thread";
    getThreadMock.mockRejectedValue(new Error(errorMessage));

    renderDiscussion();

    await assertErrorAlert(errorMessage);
  });

  it("goes back to the previous page when the back button is clicked", async () => {
    renderDiscussion();
    await screen.findByRole("heading", {
      level: 1,
      name: "What is there to do in Amsterdam?",
    });

    userEvent.click(screen.getByRole("button", { name: PREVIOUS_PAGE }));

    expect(screen.getByTestId("previous-page")).toBeInTheDocument();
  });

  it("shows an error alert if the discussion fails to load", async () => {
    mockConsoleError();
    const errorMessage = "Error getting discussion";
    getDiscussionMock.mockRejectedValue(new Error(errorMessage));

    renderDiscussion();

    await assertErrorAlert(errorMessage);
  });

  describe("Adding a comment to the discussion", () => {
    const COMMENT_TREE_COMMENT_FORM_TEST_ID = "comment-2-comment-form";
    it("posts and displays the new comment to the discussion successfully", async () => {
      renderDiscussion();
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));
      const discussionCommentForm = within(
        screen.getByTestId(COMMENT_TREE_COMMENT_FORM_TEST_ID)
      );

      const newComment = "Glad I checked it out. It was great!";
      getThreadMock.mockImplementation(
        getThreadAfterSuccessfulComment({ newComment, threadIdToUpdate: 2 })
      );
      userEvent.type(
        discussionCommentForm.getByLabelText(WRITE_COMMENT_A11Y_LABEL),
        newComment
      );
      userEvent.click(
        discussionCommentForm.getByRole("button", { name: COMMENT })
      );

      expect(await screen.findByText(newComment)).toBeVisible();
      expect(postReplyMock).toHaveBeenCalledTimes(1);
      expect(postReplyMock).toHaveBeenCalledWith(2, newComment);
    });

    it("shows an error alert if the comment failed to post", async () => {
      mockConsoleError();
      const errorMessage = "Error posting comment";
      postReplyMock.mockRejectedValue(new Error(errorMessage));
      renderDiscussion();
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));
      const discussionCommentForm = within(
        screen.getByTestId(COMMENT_TREE_COMMENT_FORM_TEST_ID)
      );

      userEvent.type(
        discussionCommentForm.getByLabelText(WRITE_COMMENT_A11Y_LABEL),
        "new comment"
      );
      userEvent.click(
        discussionCommentForm.getByRole("button", { name: COMMENT })
      );

      await assertErrorAlert(errorMessage);
    });
  });

  describe("Adding a comment/reply to a comment", () => {
    const FIRST_COMMENT_FORM_TEST_ID = "comment-6-comment-form";
    it("posts and displays the new comment below the top level comment successfully", async () => {
      renderDiscussion();
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      const firstComment = within(
        (await screen.findAllByTestId(COMMENT_TEST_ID))[0]
      );
      userEvent.click(firstComment.getByRole("button", { name: REPLY }));
      const commentFormContainer = screen.getByTestId(
        FIRST_COMMENT_FORM_TEST_ID
      );
      // The comment form is opened when the transition container has height as "auto"
      await waitFor(() => {
        expect(window.getComputedStyle(commentFormContainer).height).toEqual(
          "auto"
        );
      });

      const newComment = "+100";
      getThreadMock.mockImplementation(
        getThreadAfterSuccessfulComment({ newComment, threadIdToUpdate: 6 })
      );
      userEvent.type(
        within(commentFormContainer).getByLabelText(WRITE_COMMENT_A11Y_LABEL),
        newComment
      );
      userEvent.click(
        within(commentFormContainer).getByRole("button", { name: COMMENT })
      );
      // Check refetch loading state is shown while user is waiting for reply
      expect(
        await screen.findByTestId(REFETCH_LOADING_TEST_ID)
      ).toBeInTheDocument();

      expect(await screen.findByText(newComment)).toBeVisible();
      expect(postReplyMock).toHaveBeenCalledTimes(1);
      // (threadId, content)
      expect(postReplyMock).toHaveBeenCalledWith(6, newComment);
    });

    it("closes the comment form when the close button is clicked", async () => {
      renderDiscussion();
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      const firstComment = within(
        (await screen.findAllByTestId(COMMENT_TEST_ID))[0]
      );

      userEvent.click(firstComment.getByRole("button", { name: REPLY }));
      // The comment form is opened when the transition container has height as "auto"
      const commentFormContainer = screen.getByTestId(
        FIRST_COMMENT_FORM_TEST_ID
      );
      await waitFor(() => {
        expect(window.getComputedStyle(commentFormContainer).height).toEqual(
          "auto"
        );
      });
      userEvent.click(
        within(commentFormContainer).getByRole("button", { name: CLOSE })
      );

      // The transition container has 0 height when the form is closed
      await waitFor(() => {
        expect(window.getComputedStyle(commentFormContainer).height).toEqual(
          "0px"
        );
      });
    });
  });
});
