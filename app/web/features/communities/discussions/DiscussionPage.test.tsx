import { render, screen, waitFor, waitForElementToBeRemoved, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getProfileLinkA11yLabel } from "components/Avatar/constants";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import mockRouter from "next-router-mock";
import { discussionBaseRoute } from "routes";
import { service } from "service";
import comments from "test/fixtures/comments.json";
import community from "test/fixtures/community.json";
import discussions from "test/fixtures/discussions.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import i18n from "test/i18n";
import { getAccountInfo, getLiteUser, getThread } from "test/serviceMockDefaults";
import { assertErrorAlert, mockConsoleError, MockedService, wait } from "test/utils";

import { COMMENT_TEST_ID, REFETCH_LOADING_TEST_ID } from "./Comment";
import DiscussionPage, { CREATOR_TEST_ID } from "./DiscussionPage";

const { t } = i18n;

jest.mock("components/MarkdownInput");

const getLiteUserMock = service.user.getLiteUser as MockedService<typeof service.user.getLiteUser>;
const getCommunityMock = service.communities.getCommunity as MockedService<typeof service.communities.getCommunity>;
const listCommunitiesMock = service.communities.listCommunities as MockedService<
  typeof service.communities.listCommunities
>;
const getDiscussionMock = service.discussions.getDiscussion as MockedService<typeof service.discussions.getDiscussion>;
const getThreadMock = service.threads.getThread as MockedService<typeof service.threads.getThread>;
const postReplyMock = service.threads.postReply as MockedService<typeof service.threads.postReply>;

const getAccountInfoMock = service.account.getAccountInfo as MockedService<typeof service.account.getAccountInfo>;
const updateDiscussionMock = service.discussions.updateDiscussion as MockedService<
  typeof service.discussions.updateDiscussion
>;
const deleteDiscussionMock = service.discussions.deleteDiscussion as MockedService<
  typeof service.discussions.deleteDiscussion
>;
const updateReplyMock = service.threads.updateReply as MockedService<typeof service.threads.updateReply>;
const deleteReplyMock = service.threads.deleteReply as MockedService<typeof service.threads.deleteReply>;
const reportContentMock = service.reporting.reportContent as MockedService<typeof service.reporting.reportContent>;

function renderDiscussion() {
  mockRouter.setCurrentUrl(`${discussionBaseRoute}/1/what-is-there-to-do-in-amsterdam`);
  const { client, wrapper } = getHookWrapperWithClient();
  render(<DiscussionPage discussionId={1} />, { wrapper });

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
            deleted: false,
            canEdit: false,
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
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-05-10"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    getLiteUserMock.mockImplementation(getLiteUser);
    getCommunityMock.mockResolvedValue(community);
    listCommunitiesMock.mockResolvedValue({
      communitiesList: [],
      nextPageToken: "",
    });
    getDiscussionMock.mockResolvedValue(discussions[0]);
    getThreadMock.mockImplementation(getThread);
    postReplyMock.mockResolvedValue({
      threadId: 999,
    });
    getAccountInfoMock.mockImplementation(getAccountInfo); //ModVisibleCompobnent calls this in Comment.tsx
    updateDiscussionMock.mockResolvedValue(discussions[0]);
    deleteDiscussionMock.mockResolvedValue(undefined);
    updateReplyMock.mockResolvedValue({
      threadId: 6,
      content: "updated",
      authorUserId: 1,
      numReplies: 0,
      deleted: false,
      canEdit: true,
      createdTime: { seconds: 1578000000, nanos: 0 },
    });
    deleteReplyMock.mockResolvedValue(undefined);
  });

  it("renders the discussion successfully", async () => {
    renderDiscussion();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    // Author and discussion content assertions
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "What is there to do in Amsterdam?",
      }),
    ).toBeVisible();
    expect(screen.getByText(/i'm looking for activities to do here!/i)).toBeVisible();

    const creatorContainer = within(screen.getByTestId(CREATOR_TEST_ID));
    expect(
      creatorContainer.getByRole("link", {
        name: getProfileLinkA11yLabel("Funny Cat current User"),
      }),
    ).toBeVisible();
    expect(creatorContainer.getByText("Funny Cat current User")).toBeVisible();
    expect(creatorContainer.getByText("Created on January 1, 2020")).toBeVisible();
  });

  it("renders a loading skeleton if the user info is still loading", async () => {
    getLiteUserMock.mockImplementation(async () => new Promise(() => undefined));
    renderDiscussion();
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "What is there to do in Amsterdam?",
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", {
        name: getProfileLinkA11yLabel("Funny Cat current User"),
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Funny Cat current User")).not.toBeInTheDocument();
    expect(screen.queryByText("Created on Jan 01, 2020")).not.toBeInTheDocument();
  });

  it("renders the comments tree in the discussion correctly", async () => {
    renderDiscussion();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    await waitFor(() => expect(screen.getAllByTestId(COMMENT_TEST_ID)).toHaveLength(8));

    const commentCards = screen.getAllByTestId(COMMENT_TEST_ID).map((el) => within(el));

    expect(screen.getByRole("heading", { name: t("communities:comments") })).toBeVisible();
    // check top level comment
    const firstTopLevelComment = comments.find((c) => c.threadId === 6);
    const commentUser = await getLiteUser(firstTopLevelComment!.authorUserId.toString());
    expect(commentCards[0].getByRole("img", { name: commentUser.name })).toBeVisible();
    expect(
      commentCards[0].getByRole("link", {
        name: getProfileLinkA11yLabel(commentUser.name),
      }),
    ).toBeVisible();
    const firstPostedTime = `${t("communities:by_creator", {
      name: commentUser.name,
    })} • last year`;
    expect(commentCards[0].getByText((_, element) => element?.textContent === firstPostedTime)).toBeVisible();
    expect(commentCards[0].getByText(firstTopLevelComment!.content)).toBeVisible();
    expect(commentCards[0].getByRole("button", { name: t("global:reply") })).toBeVisible();

    // check nested comment/reply
    const replyUser = await getLiteUser("3");
    expect(commentCards[1].getByRole("img", { name: replyUser.name })).toBeVisible();
    expect(
      commentCards[1].getByRole("link", {
        name: getProfileLinkA11yLabel(replyUser.name),
      }),
    ).toBeVisible();
    const secondPostedTime = `${t("communities:by_creator", { name: replyUser.name })} • last year`;
    expect(commentCards[1].getByText((_, element) => element?.textContent === secondPostedTime)).toBeVisible();
    expect(commentCards[1].getByText("+6")).toBeVisible();
    // Nested comment cannot be replied on further
    expect(commentCards[1].queryByRole("button", { name: t("global:reply") })).not.toBeInTheDocument();
  });

  it("shows the no comments message if there aren't any in the discussion", async () => {
    getThreadMock.mockResolvedValue({ nextPageToken: "", repliesList: [] });
    renderDiscussion();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(await screen.findByText(t("communities:no_comments"))).toBeVisible();
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

      const user = userEvent.setup();

      user.click(
        await screen.findByRole("button", {
          name: t("communities:load_earlier_comments"),
        }),
      );

      await waitFor(() => {
        // 1 for main discussion + 4 comments + 1 for second page of discussion
        expect(getThreadMock).toHaveBeenCalledTimes(6);
      });

      const firstCommentAfterLoadMore = screen.getAllByTestId(COMMENT_TEST_ID)[0];
      expect(within(firstCommentAfterLoadMore).getByText(comments[3].content)).toBeVisible();
      expect(getThreadMock).toHaveBeenCalledWith(2, "4");
    });

    it("shows a 'load more replies' button that lets you load earlier replies", async () => {
      getThreadMock.mockImplementation(async (threadId, pageToken) => {
        if (threadId === 3) {
          return pageToken
            ? {
                nextPageToken: "",
                repliesList: [{ ...comments[4], threadId: 72, content: "Agreed!" }],
              }
            : { nextPageToken: "71", repliesList: [comments[4]] };
        }
        return getThread(threadId);
      });
      renderDiscussion();

      const user = userEvent.setup();

      user.click(
        await screen.findByRole("button", {
          name: t("communities:load_earlier_replies"),
        }),
      );

      await waitFor(() => {
        expect(screen.getByText("Agreed!")).toBeVisible();
      });
      expect(getThreadMock).toHaveBeenCalledTimes(6);

      // 1 for main discussion + 4 comments + 1 for second page of reply for oldest comment
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
    mockRouter.back = jest.fn();
    renderDiscussion();
    await screen.findByRole("heading", {
      level: 1,
      name: "What is there to do in Amsterdam?",
    });

    const user = userEvent.setup();

    user.click(
      await screen.findByRole("button", {
        name: t("communities:previous_page"),
      }),
    );

    await waitFor(() => {
      expect(mockRouter.back).toHaveBeenCalled();
    });
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

      const discussionCommentForm = within(await screen.findByTestId(COMMENT_TREE_COMMENT_FORM_TEST_ID));

      const newComment = "Glad I checked it out. It was great!";

      getThreadMock.mockImplementation(getThreadAfterSuccessfulComment({ newComment, threadIdToUpdate: 2 }));

      const user = userEvent.setup();

      const commentInput = await discussionCommentForm.findByLabelText(t("communities:write_comment_a11y_label"));

      await waitFor(() => expect(commentInput).toBeVisible());

      user.type(commentInput, newComment);

      await waitFor(
        () => {
          expect(commentInput).toHaveValue(newComment);
        },
        { timeout: 5000 },
      );

      user.click(
        discussionCommentForm.getByRole("button", {
          name: t("communities:comment"),
        }),
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

      const discussionCommentForm = within(await screen.findByTestId(COMMENT_TREE_COMMENT_FORM_TEST_ID));

      const user = userEvent.setup();

      const commentInput = await discussionCommentForm.findByLabelText(t("communities:write_comment_a11y_label"));

      await waitFor(() => expect(commentInput).toBeVisible());

      user.type(commentInput, "new comment");

      await waitFor(
        () => {
          expect(commentInput).toHaveValue("new comment");
        },
        { timeout: 5000 },
      );

      user.click(
        discussionCommentForm.getByRole("button", {
          name: t("communities:comment"),
        }),
      );

      await assertErrorAlert(errorMessage);
    });
  });

  describe("Editing a discussion", () => {
    async function openEditForm() {
      renderDiscussion();
      const user = userEvent.setup();
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));
      user.click(screen.getByTestId("discussion-page-more-options"));
      user.click(await screen.findByTestId("discussion-page-edit-discussion"));
      await screen.findByLabelText(t("communities:new_discussion_title"));
      return user;
    }

    it("shows the ellipsis menu button when the user can edit", async () => {
      renderDiscussion();
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));
      expect(screen.getByTestId("discussion-page-more-options")).toBeVisible();
    });

    it("does not show the ellipsis menu when the user cannot edit or moderate", async () => {
      getDiscussionMock.mockResolvedValue(discussions[1]);
      renderDiscussion();
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));
      await screen.findByRole("heading", {
        level: 1,
        name: discussions[1].title,
      });
      expect(screen.queryByTestId("discussion-page-more-options")).not.toBeInTheDocument();
    });

    it("opens the inline edit form pre-filled with current values", async () => {
      await openEditForm();
      expect(screen.getByLabelText(t("communities:new_discussion_title"))).toHaveValue(discussions[0].title);
      expect(screen.getByTestId("content-input")).toBeVisible();
    });

    it("calls updateDiscussion when saved", async () => {
      const user = await openEditForm();
      user.click(screen.getByRole("button", { name: t("global:save") }));
      await waitFor(() => {
        expect(updateDiscussionMock).toHaveBeenCalledWith(
          discussions[0].discussionId,
          discussions[0].title,
          discussions[0].content,
        );
      });
    });

    it("does not call updateDiscussion when Cancel is clicked", async () => {
      const user = await openEditForm();
      user.click(screen.getByRole("button", { name: t("global:cancel") }));
      await waitFor(() => {
        expect(screen.queryByLabelText(t("communities:new_discussion_title"))).not.toBeInTheDocument();
      });
      expect(updateDiscussionMock).not.toHaveBeenCalled();
    });

    it("shows an error alert if the update fails", async () => {
      mockConsoleError();
      updateDiscussionMock.mockRejectedValue(new Error("Update failed"));
      const user = await openEditForm();
      user.click(screen.getByRole("button", { name: t("global:save") }));
      await assertErrorAlert("Update failed");
    });
  });

  describe("Reporting a discussion", () => {
    it("submits a report for the discussion itself", async () => {
      reportContentMock.mockResolvedValue(new Empty());
      renderDiscussion();
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      const user = userEvent.setup();

      user.click(
        screen.getByRole("button", {
          name: t("communities:report_discussion_button_a11y"),
        }),
      );

      const reason = t("global:report.flag.reason.spam");
      const reasonSelect = await screen.findByLabelText(t("global:report.flag.reason_label"));
      user.selectOptions(reasonSelect, reason);
      await waitFor(() => expect(reasonSelect).toHaveValue(reason));

      user.click(screen.getByRole("button", { name: t("global:submit") }));

      await waitFor(() => {
        expect(reportContentMock).toHaveBeenCalledWith({
          authorUser: discussions[0].creatorUserId,
          contentRef: `community/${discussions[0].ownerCommunityId}/discussion/${discussions[0].discussionId}`,
          description: "",
          reason,
        });
      });
    });

    it("does not show the report button for a deleted discussion", async () => {
      getDiscussionMock.mockResolvedValue({ ...discussions[0], deleted: true });
      renderDiscussion();
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      expect(
        await screen.findByRole("heading", {
          level: 1,
          name: t("communities:discussion_deleted"),
        }),
      ).toBeVisible();
      expect(
        screen.queryByRole("button", {
          name: t("communities:report_discussion_button_a11y"),
        }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Deleting a discussion", () => {
    async function openDeleteDialog() {
      renderDiscussion();
      const user = userEvent.setup();
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));
      user.click(screen.getByTestId("discussion-page-more-options"));
      user.click(await screen.findByTestId("discussion-page-delete-discussion"));
      await screen.findByRole("heading", {
        name: t("communities:delete_discussion_dialog.title"),
      });
      return user;
    }

    it("opens the delete confirmation dialog", async () => {
      await openDeleteDialog();
      expect(screen.getByText(t("communities:delete_discussion_dialog.message"))).toBeVisible();
    });

    it("calls deleteDiscussion when confirmed", async () => {
      const user = await openDeleteDialog();
      user.click(
        screen.getByRole("button", {
          name: t("communities:delete_discussion_dialog.confirm"),
        }),
      );
      await waitFor(() => {
        expect(deleteDiscussionMock).toHaveBeenCalledWith(discussions[0].discussionId);
      });
    });

    it("does not call deleteDiscussion when Cancel is clicked", async () => {
      const user = await openDeleteDialog();
      user.click(
        screen.getByRole("button", {
          name: t("communities:delete_discussion_dialog.cancel"),
        }),
      );
      expect(deleteDiscussionMock).not.toHaveBeenCalled();
    });
  });

  describe("Editing and deleting a comment", () => {
    const editableComment = {
      threadId: 6,
      content: "My editable comment",
      authorUserId: 1,
      createdTime: { seconds: 1578000000, nanos: 0 },
      numReplies: 0,
      deleted: false,
      canEdit: true,
    };

    beforeEach(() => {
      getThreadMock.mockImplementation(async (threadId) => {
        if (threadId === 2) {
          return { nextPageToken: "", repliesList: [editableComment] };
        }
        return { nextPageToken: "", repliesList: [] };
      });
    });

    it("shows the ellipsis menu for a comment the user can edit", async () => {
      renderDiscussion();
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));
      expect(await screen.findByTestId(`comment-${editableComment.threadId}-more-options`)).toBeVisible();
    });

    it("calls updateReply when the comment edit form is submitted", async () => {
      renderDiscussion();
      const user = userEvent.setup();
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));
      user.click(await screen.findByTestId(`comment-${editableComment.threadId}-more-options`));
      user.click(await screen.findByTestId(`comment-${editableComment.threadId}-edit-comment`));
      await screen.findByTestId(`comment-${editableComment.threadId}-edit-input`);
      user.click(screen.getByRole("button", { name: t("global:save") }));
      await waitFor(() => {
        expect(updateReplyMock).toHaveBeenCalledWith(editableComment.threadId, editableComment.content);
      });
    });

    it("calls deleteReply when 'Delete comment' is selected", async () => {
      renderDiscussion();
      const user = userEvent.setup();
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));
      user.click(await screen.findByTestId(`comment-${editableComment.threadId}-more-options`));
      user.click(await screen.findByTestId(`comment-${editableComment.threadId}-delete-comment`));
      await waitFor(() => {
        expect(deleteReplyMock).toHaveBeenCalledWith(editableComment.threadId);
      });
    });
  });

  describe("Adding a comment/reply to a comment", () => {
    const FIRST_COMMENT_FORM_TEST_ID = "comment-6-comment-form";
    it("posts and displays the new comment below the top level comment successfully", async () => {
      renderDiscussion();

      const firstComment = within((await screen.findAllByTestId(COMMENT_TEST_ID))[0]);

      const user = userEvent.setup();

      user.click(firstComment.getByRole("button", { name: t("global:reply") }));
      const commentFormContainer = screen.getByTestId(FIRST_COMMENT_FORM_TEST_ID);

      // The comment form is opened when the transition container has height as "auto"
      await waitFor(() => {
        expect(window.getComputedStyle(commentFormContainer).height).toEqual("auto");
      });

      const newComment = "+100";
      getThreadMock.mockImplementation(getThreadAfterSuccessfulComment({ newComment, threadIdToUpdate: 6 }));

      const commentInput = within(commentFormContainer).getByLabelText(t("communities:write_comment_a11y_label"));

      await waitFor(() => expect(commentInput).toBeVisible());

      user.type(commentInput, newComment);

      await waitFor(() => {
        expect(commentInput).toHaveValue(newComment);
      });

      user.click(
        within(commentFormContainer).getByRole("button", {
          name: t("communities:comment"),
        }),
      );
      // Check refetch loading state is shown while user is waiting for reply
      expect(await screen.findByTestId(REFETCH_LOADING_TEST_ID)).toBeInTheDocument();

      expect(await screen.findByText(newComment)).toBeVisible();
      expect(postReplyMock).toHaveBeenCalledTimes(1);
      // (threadId, content)
      expect(postReplyMock).toHaveBeenCalledWith(6, newComment);
    });

    it("closes the comment form when the close button is clicked", async () => {
      renderDiscussion();

      const firstComment = within((await screen.findAllByTestId(COMMENT_TEST_ID))[0]);

      const user = userEvent.setup();

      user.click(firstComment.getByRole("button", { name: t("global:reply") }));
      // The comment form is opened when the transition container has height as "auto"
      const commentFormContainer = screen.getByTestId(FIRST_COMMENT_FORM_TEST_ID);
      await waitFor(() => {
        expect(window.getComputedStyle(commentFormContainer).height).toEqual("auto");
      });
      user.click(
        within(commentFormContainer).getByRole("button", {
          name: t("global:close"),
        }),
      );

      // The transition container has 0 height when the form is closed
      await waitFor(() => {
        expect(window.getComputedStyle(commentFormContainer).height).toEqual("0px");
      });
    });
  });
});
