import { render, screen } from "@testing-library/react";
import CreateGroupChat from "features/messages/groupchats/CreateGroupChat";
import mockRouter from "next-router-mock";
import { service } from "service";
import users from "test/fixtures/users.json";
import wrapper from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";
import { MockedService, t } from "test/utils";

const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;

const listFriendsMock = service.api.listFriends as MockedService<
  typeof service.api.listFriends
>;

describe("CreateGroupChat with query string", () => {
  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
    listFriendsMock.mockResolvedValue([1, 2]);
    mockRouter.setCurrentUrl(`/messages/chats?to=${users[0].username}`);
    render(<CreateGroupChat />, { wrapper });
  });

  it("initially shows the create dialog with a user pre-filled", async () => {
    expect(
      await screen.findByLabelText(
        t("messages:create_chat.friends_input_label")
      )
    ).toBeVisible();
    expect(screen.getByText(users[0].name)).toBeVisible();
    expect(
      screen.queryByRole("heading", {
        name: t("messages:create_chat.dm_title"),
        level: 2,
      })
    ).toBeVisible();
  });
});

describe("CreateGroupChat without router state", () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl("create-group-chat-test");
    render(<CreateGroupChat />, { wrapper });
  });

  it("doesn't initially show the create dialog", async () => {
    expect(
      screen.getByLabelText(t("messages:create_chat.friends_input_label"))
    ).not.toBeVisible();
    expect(
      screen.queryByRole("heading", {
        name: t("messages:create_chat.group_title"),
        level: 2,
        hidden: true,
      })
    ).toBeNull();
  });
});
