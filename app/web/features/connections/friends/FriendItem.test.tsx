import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { service } from "service";
import liteUsers from "test/fixtures/liteUsers.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import FriendItem from "./FriendItem";

const { t } = i18n;

const removeFriendMock = service.api.removeFriend as jest.MockedFunction<typeof service.api.removeFriend>;

describe("FriendItem", () => {
  it("calls removeFriend when the remove button is clicked", async () => {
    render(<FriendItem friend={liteUsers[0]} onError={() => {}} />, {
      wrapper,
    });

    const user = userEvent.setup();

    user.click(screen.getByTestId("friend-item-more-options"));

    const removeMenuItems = await screen.findAllByTestId("friend-item-remove-friend");
    const removeMenuItem = removeMenuItems[0];

    expect(removeMenuItem).toBeVisible();

    await user.click(removeMenuItem);

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

    expect(removeFriendMock).toHaveBeenCalledWith(1);
  });
});
