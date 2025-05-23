import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { removeFriend } from "service/api";
import liteUsers from "test/fixtures/liteUsers.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import FriendItem from "./FriendItem";

const { t } = i18n;

jest.mock("service/api", () => ({
  removeFriend: jest.fn(),
}));

describe("FriendItem", () => {
  it("calls removeFriend when the remove button is clicked", async () => {
    render(<FriendItem friend={liteUsers[0]} onError={() => {}} />, {
      wrapper,
    });

    const user = userEvent.setup();

    user.click(screen.getByTestId("friend-item-more-options"));

    const removeMenuItem = await screen.findByTestId("remove-friend");

    expect(removeMenuItem).toBeVisible();

    user.click(removeMenuItem);

    expect(
      await screen.findByRole("dialog", {
        name: t("connections:remove_friend"),
      }),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", {
        name: t("connections:remove_friend_confirmation_dialog.confirm"),
      }),
    );

    expect(removeFriend).toHaveBeenCalledWith(1);
  });
});
