import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { discussionBaseRoute } from "routes";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { MockedService } from "test/utils";

import CommentForm from "./CommentForm";

const { t } = i18n;

jest.mock("components/MarkdownInput");

const postReplyMock = service.threads.postReply as MockedService<
  typeof service.threads.postReply
>;

function renderCommentForm() {
  mockRouter.setCurrentUrl(
    `${discussionBaseRoute}/1/what-is-there-to-do-in-amsterdam`,
  );
  render(<CommentForm threadId={999} shown={true} />, { wrapper });
}

describe("Comment form", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-05-10"));
  });

  it("renders the comment form successfully", async () => {
    renderCommentForm();

    //can't check if visible, since this renders collapsed
    expect(screen.getByTestId("comment-999-comment-form")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t("communities:comment") }),
    ).toBeInTheDocument(); //can't check if visible, since this renders collapsed
  });

  it("submits valid comment without issue", async () => {
    renderCommentForm();
    const newComment = "This is a valid comment";

    const user = userEvent.setup();

    const commentInput = (await screen.findByLabelText(
      t("communities:write_comment_a11y_label"),
    )) as HTMLInputElement;

    user.type(commentInput, newComment);

    await waitFor(
      () => {
        expect(commentInput).toHaveValue(newComment);
      },
      { timeout: 2000 },
    );

    user.click(screen.getByRole("button", { name: t("communities:comment") }));

    await waitFor(() => expect(postReplyMock).toHaveBeenCalledTimes(1));
  });

  it("cannot be submitted empty", async () => {
    renderCommentForm();

    expect(
      screen.getByLabelText(t("communities:write_comment_a11y_label")),
    ).toBeEmptyDOMElement();

    const user = userEvent.setup();

    user.click(screen.getByRole("button", { name: t("communities:comment") }));

    expect(postReplyMock).not.toHaveBeenCalled();
  });

  it("cannot be submitted with only whitespace", async () => {
    renderCommentForm();

    const user = userEvent.setup();

    const commentInput = (await screen.findByLabelText(
      t("communities:write_comment_a11y_label"),
    )) as HTMLInputElement;

    user.type(commentInput, "   ");

    await waitFor(() => expect(commentInput).toHaveValue("   "));

    user.click(screen.getByRole("button", { name: t("communities:comment") }));

    expect(postReplyMock).not.toHaveBeenCalled();
  });
});
