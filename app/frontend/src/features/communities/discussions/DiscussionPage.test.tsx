import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getProfileLinkA11yLabel } from "components/Avatar/constants";
import mockdate from "mockdate";
import { Route, Switch } from "react-router-dom";
import { discussionBaseRoute, discussionRoute } from "routes";
import { service } from "service";
import discussions from "test/fixtures/discussions.json";
import threadRes from "test/fixtures/getThreadRes.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { getThread, getUser } from "test/serviceMockDefaults";
import { assertErrorAlert, mockConsoleError, MockedService } from "test/utils";

import {
  CLOSE,
  COMMENT,
  COMMENTS,
  getByCreator,
  NO_COMMENTS,
  PREVIOUS_PAGE,
  WRITE_COMMENT_A11Y_LABEL,
} from "../constants";
import { COMMENT_TEST_ID } from "./Comment";
import { COMMENT_TREE_COMMENT_FORM_TEST_ID } from "./CommentTree";
import DiscussionPage from "./DiscussionPage";

jest.mock("components/MarkdownInput");

const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
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
    mockdate.set("2021-05-10");
  });

  afterAll(() => {
    mockdate.reset();
  });

  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
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
    expect(screen.getByText("Funny Cat current User")).toBeVisible();
    expect(screen.getByText("Created at Jan 01, 2020")).toBeVisible();
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
    const topLevelComments = threadRes.repliesList;
    renderDiscussion();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    const comments = await (
      await screen.findAllByTestId(COMMENT_TEST_ID)
    ).map((element) => within(element));
    expect(comments).toHaveLength(8);

    expect(screen.getByRole("heading", { name: COMMENTS })).toBeVisible();
    // check top level comment
    const commentUser = await getUser(
      topLevelComments[0].authorUserId.toString()
    );
    expect(comments[0].getByText("FD")).toBeVisible();
    expect(
      comments[0].getByText(`${getByCreator(commentUser.name)} • 1 year ago`)
    ).toBeVisible();
    expect(comments[0].getByText(topLevelComments[0].content)).toBeVisible();
    expect(comments[0].getByRole("button", { name: COMMENT })).toBeVisible();

    // check nested comment/reply
    const replyUser = await getUser("3");
    expect(
      comments[1].getByRole("img", { name: replyUser.name })
    ).toBeVisible();
    expect(
      comments[1].getByText(`${getByCreator(replyUser.name)} • 1 year ago`)
    ).toBeVisible();
    expect(comments[1].getByText("+3")).toBeVisible();
    // Nested comment cannot be replied on further
    expect(
      comments[1].queryByRole("button", { name: COMMENT })
    ).not.toBeInTheDocument();
  });

  it("shows the no comments message if there aren't any in the discussion", async () => {
    getThreadMock.mockResolvedValue({ ...threadRes, repliesList: [] });
    renderDiscussion();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(screen.getByText(NO_COMMENTS)).toBeVisible();
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
    it("posts and displays the new comment below the top level comment successfully", async () => {
      renderDiscussion();
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      const firstComment = within(
        (await screen.findAllByTestId(COMMENT_TEST_ID))[0]
      );

      userEvent.click(firstComment.getByRole("button", { name: COMMENT }));
      // The comment form is opened when a close button is there
      await firstComment.findByRole("button", { name: CLOSE });

      const newComment = "+100";
      getThreadMock.mockImplementation(
        getThreadAfterSuccessfulComment({ newComment, threadIdToUpdate: 3 })
      );
      userEvent.type(
        firstComment.getByLabelText(WRITE_COMMENT_A11Y_LABEL),
        newComment
      );
      userEvent.click(firstComment.getByRole("button", { name: COMMENT }));

      expect(await screen.findByText(newComment)).toBeVisible();
      expect(postReplyMock).toHaveBeenCalledTimes(1);
      expect(postReplyMock).toHaveBeenCalledWith(3, newComment);
    });

    it("closes the comment form when the close button is clicked", async () => {
      renderDiscussion();
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      const firstComment = within(
        (await screen.findAllByTestId(COMMENT_TEST_ID))[0]
      );

      userEvent.click(firstComment.getByRole("button", { name: COMMENT }));
      userEvent.click(await firstComment.findByRole("button", { name: CLOSE }));

      // Close button is no longer in DOM when the form is closed
      expect(
        firstComment.queryByRole("button", { name: CLOSE })
      ).not.toBeInTheDocument();
    });
  });
});
