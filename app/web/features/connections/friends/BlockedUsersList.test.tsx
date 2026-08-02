import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { service } from "service";
import liteUsers from "test/fixtures/liteUsers.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getBlockedUsers } from "test/serviceMockDefaults";

import BlockedUsersList from "./BlockedUsersList";

const { t } = i18n;

const getBlockedUsersMock = service.blocking.getBlockedUsers as jest.MockedFunction<
  typeof service.blocking.getBlockedUsers
>;

describe("BlockedUsersList", () => {
  it("shows a loading indicator when blocked users are loading", async () => {
    // Use a controlled deferred to make loading state visible, then resolve
    function createDeferred<T>() {
      let resolve!: (value: T | PromiseLike<T>) => void;
      let reject!: (reason?: unknown) => void;
      const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    }

    const deferred = createDeferred<ReturnType<typeof getBlockedUsers>>();
    // @ts-expect-error: mocking service to return our deferred
    getBlockedUsersMock.mockImplementation(() => deferred.promise);

    render(<BlockedUsersList refetchFriends={jest.fn()} />, { wrapper });

    expect(await screen.findByRole("progressbar")).toBeVisible();
  });

  it("renders the blocked users list when data is loaded", async () => {
    getBlockedUsersMock.mockImplementation(getBlockedUsers);

    render(<BlockedUsersList refetchFriends={jest.fn()} />, { wrapper });

    const blockedUserItems = await screen.findAllByTestId("friend-item");
    expect(blockedUserItems).toHaveLength(3);
  });

  it("renders the empty state message if the current user has no blocked users", async () => {
    getBlockedUsersMock.mockResolvedValue({
      blockedUsersList: [],
    });

    render(<BlockedUsersList refetchFriends={jest.fn()} />, { wrapper });

    expect(await screen.findByText(t("connections:no_blocked_users"))).toBeVisible();
    expect(screen.queryByTestId("friend-item")).not.toBeInTheDocument();
  });

  it("shows an error alert if blocked users failed to load", async () => {
    getBlockedUsersMock.mockRejectedValue(new Error("Error loading blocked users"));
    jest.spyOn(console, "error").mockReturnValue(undefined);
    render(<BlockedUsersList refetchFriends={jest.fn()} />, { wrapper });

    const errorAlert = await screen.findByRole("alert");
    expect(within(errorAlert).getByText("Error loading blocked users")).toBeVisible();
  });

  it("calls refetchFriends to requery friends when unblocked", async () => {
    getBlockedUsersMock.mockImplementation(getBlockedUsers);

    const refetchFriendsMock = jest.fn();
    render(<BlockedUsersList refetchFriends={refetchFriendsMock} />, {
      wrapper,
    });

    const user = await userEvent.setup();

    expect(await screen.findByText(liteUsers[1].name)).toBeVisible();

    const moreOptionsButtons = await screen.findAllByTestId("blocked-user-item-more-options");

    await user.click(moreOptionsButtons[1]);

    const unblockButtons = await screen.findAllByTestId("blocked-user-item-unblock-user");

    expect(unblockButtons).toHaveLength(3);

    await user.click(unblockButtons[1]);

    expect(
      await screen.findByText(
        t("connections:unblock_user_confirmation_dialog.title", {
          name: liteUsers[1].name,
        }),
      ),
    ).toBeVisible();
    const confirmButton = screen.getByRole("button", {
      name: t("connections:unblock_user_confirmation_dialog.confirm"),
    });

    await user.click(confirmButton);

    expect(refetchFriendsMock).toHaveBeenCalledTimes(1);
    expect(getBlockedUsersMock).toHaveBeenCalledTimes(1);
  });
});
