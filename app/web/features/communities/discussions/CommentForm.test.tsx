import { act,render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { discussionBaseRoute } from "routes";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { MockedService, t } from "test/utils";

import CommentForm from "./CommentForm";

jest.mock("components/MarkdownInput");

const postReplyMock = service.threads.postReply as MockedService<
  typeof service.threads.postReply
>;

function renderCommentForm() {
  console.log("rendering comment form");
  mockRouter.setCurrentUrl(
    `${discussionBaseRoute}/1/what-is-there-to-do-in-amsterdam`
  );
  render(<CommentForm threadId={999} shown={true} />, { wrapper });
}

describe("Comment form", () => {
  beforeAll(() => {
    console.log("Running tests for comment form!");
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-05-10"));
  });

  afterAll(() => {
    console.log("Finished running tests for comment form!");
  });

  it("renders the comment form successfully", async () => {
    renderCommentForm();

    //can't check if visible, since this renders collapsed
    expect(screen.getByTestId("comment-999-comment-form")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Comment" })).toBeInTheDocument(); //can't check if visible, since this renders collapsed
  });

  it("submits valid comment without issue", async () => {
    renderCommentForm();
    const newComment = "This is a valid comment";

    await act(async () => {
      userEvent.type(
        screen.getByLabelText(t("communities:write_comment_a11y_label")),
        newComment
      );

      userEvent.click(screen.getByRole("button", { name: "Comment" }));
    });

    expect(postReplyMock).toHaveBeenCalledTimes(1);
  });

  it("cannot be submitted empty", async () => {
    renderCommentForm();

    expect(
      screen.getByLabelText(t("communities:write_comment_a11y_label"))
    ).toBeEmptyDOMElement();

    await act(async () => {
      userEvent.click(screen.getByRole("button", { name: "Comment" }));
    });

    expect(postReplyMock).not.toHaveBeenCalled();
  });
});
