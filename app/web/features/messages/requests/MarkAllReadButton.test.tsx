import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MarkAllReadButton from "features/messages/requests/MarkAllReadButton";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { MessageThreadCategory } from "proto/conversations_pb";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { assertErrorAlert, mockConsoleError } from "test/utils";

const { t } = i18n;

const markAllThreadsSeenMock = service.conversations
  .markAllThreadsSeen as jest.MockedFunction<
  typeof service.conversations.markAllThreadsSeen
>;

describe("MarkAllReadButton", () => {
  beforeEach(() => {
    markAllThreadsSeenMock.mockResolvedValue(new Empty());
  });

  it.each([
    ["chats", MessageThreadCategory.MESSAGE_THREAD_CATEGORY_CHATS],
    ["hosting", MessageThreadCategory.MESSAGE_THREAD_CATEGORY_HOSTING],
    ["surfing", MessageThreadCategory.MESSAGE_THREAD_CATEGORY_SURFING],
    [
      "public-trips",
      MessageThreadCategory.MESSAGE_THREAD_CATEGORY_MY_PUBLIC_TRIPS,
    ],
  ] as const)(
    "marks all threads seen for the %s filter",
    async (type, expectedCategory) => {
      const label =
        type === "public-trips"
          ? t("messages:mark_all_read_button_text_public_trips")
          : t(`messages:mark_all_read_button_text_${type}`);
      render(<MarkAllReadButton type={type} />, { wrapper });

      const user = userEvent.setup();
      await user.click(await screen.findByRole("button", { name: label }));

      await waitFor(() => {
        expect(markAllThreadsSeenMock).toHaveBeenCalledWith({
          categories: [expectedCategory],
          onlyUnread: false,
          onlyArchived: false,
        });
      });
    },
  );

  it("marks everything seen for the all filter", async () => {
    render(<MarkAllReadButton type="all" />, { wrapper });
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", {
        name: t("messages:mark_all_read_button_text"),
      }),
    );

    await waitFor(() => {
      expect(markAllThreadsSeenMock).toHaveBeenCalledWith({
        categories: [],
        onlyUnread: false,
        onlyArchived: false,
      });
    });
  });

  it("gives an error alert", async () => {
    mockConsoleError();
    markAllThreadsSeenMock.mockRejectedValueOnce(new Error("Generic error"));
    render(<MarkAllReadButton type="chats" />, { wrapper });

    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", {
        name: t("messages:mark_all_read_button_text_chats"),
      }),
    );

    await assertErrorAlert("Generic error");
  });
});
