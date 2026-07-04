import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import type { ComponentProps } from "react";
import { discussionBaseRoute } from "routes";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getAccountInfo } from "test/serviceMockDefaults";
import { MockedService } from "test/utils";

import CommentForm from "./CommentForm";

const { t } = i18n;

jest.mock("components/MarkdownInput");

const postReplyMock = service.threads.postReply as MockedService<
  typeof service.threads.postReply
>;
const getAccountInfoMock = service.account.getAccountInfo as MockedService<
  typeof service.account.getAccountInfo
>;

function renderCommentForm(
  props: Partial<ComponentProps<typeof CommentForm>> = {},
) {
  mockRouter.setCurrentUrl(
    `${discussionBaseRoute}/1/what-is-there-to-do-in-amsterdam`,
  );
  render(<CommentForm threadId={999} shown={true} {...props} />, { wrapper });
}

beforeEach(() => {
  // CommentForm always reads accountInfo (to gate submission when an
  // attemptedAction is set); give it a default so tests that don't care
  // about the gate don't hit an unmocked query.
  getAccountInfoMock.mockImplementation(getAccountInfo);
});

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

describe("Comment form with attemptedAction (event comment gate)", () => {
  beforeAll(() => {
    // The "Comment form" describe above leaves fake timers active; restore
    // real timers so `await user.type`/`user.click` resolve normally here.
    jest.useRealTimers();
  });

  beforeEach(() => {
    postReplyMock.mockClear();
  });

  it("shows the profile incomplete dialog instead of posting when the profile is incomplete", async () => {
    getAccountInfoMock.mockImplementation(async () => ({
      ...(await getAccountInfo()),
      profileComplete: false,
    }));
    renderCommentForm({ attemptedAction: "comment_on_event" });

    const user = userEvent.setup();

    const commentInput = (await screen.findByLabelText(
      t("communities:write_comment_a11y_label"),
    )) as HTMLInputElement;
    await user.type(commentInput, "This is a valid comment");

    await user.click(
      screen.getByRole("button", { name: t("communities:comment") }),
    );

    expect(
      await screen.findByLabelText(t("profile:complete_profile_dialog.title")),
    ).toBeVisible();
    expect(postReplyMock).not.toHaveBeenCalled();
  });

  it("posts the comment as usual when the profile is complete", async () => {
    renderCommentForm({ attemptedAction: "comment_on_event" });

    const user = userEvent.setup();

    const commentInput = (await screen.findByLabelText(
      t("communities:write_comment_a11y_label"),
    )) as HTMLInputElement;
    await user.type(commentInput, "This is a valid comment");

    await user.click(
      screen.getByRole("button", { name: t("communities:comment") }),
    );

    await waitFor(() => expect(postReplyMock).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByLabelText(t("profile:complete_profile_dialog.title")),
    ).not.toBeInTheDocument();
  });
});
