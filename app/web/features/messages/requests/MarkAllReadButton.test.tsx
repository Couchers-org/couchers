import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MarkAllReadButton from "features/messages/requests/MarkAllReadButton";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { MessageThreadFilter } from "proto/conversations_pb";
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
    ["chats", MessageThreadFilter.MESSAGE_THREAD_FILTER_CHATS],
    ["hosting", MessageThreadFilter.MESSAGE_THREAD_FILTER_HOSTING],
    ["surfing", MessageThreadFilter.MESSAGE_THREAD_FILTER_SURFING],
    ["public-trips", MessageThreadFilter.MESSAGE_THREAD_FILTER_PUBLIC_TRIPS],
  ] as const)(
    "marks all threads seen for the %s filter",
    async (type, expectedFilter) => {
      const label =
        type === "public-trips"
          ? t("messages:mark_all_read_button_text_public_trips")
          : t(`messages:mark_all_read_button_text_${type}`);
      render(<MarkAllReadButton type={type} />, { wrapper });

      const user = userEvent.setup();
      await user.click(await screen.findByRole("button", { name: label }));

      await waitFor(() => {
        expect(markAllThreadsSeenMock).toHaveBeenCalledWith({
          filter: expectedFilter,
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
        filter: MessageThreadFilter.MESSAGE_THREAD_FILTER_ALL,
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
