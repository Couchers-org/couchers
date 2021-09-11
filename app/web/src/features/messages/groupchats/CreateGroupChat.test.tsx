import { render, screen } from "@testing-library/react";
import { FRIENDS, NEW_CHAT } from "features/messages/constants";
import CreateChat from "features/messages/chats/CreateChat";
import { User } from "proto/api_pb";
import { service } from "service";
import users from "test/fixtures/users.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";
import { MockedService } from "test/utils";

const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;

const listFriendsMock = service.api.listFriends as MockedService<
  typeof service.api.listFriends
>;

describe("CreateChat with router state", () => {
  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
    listFriendsMock.mockResolvedValue([1, 2]);
    const { wrapper } = getHookWrapperWithClient({
      initialRouterEntries: [
        {
          pathname: "create-group-chat-test",
          state: { createMessageTo: users[0] as User.AsObject },
        },
      ],
    });
    render(<CreateChat />, { wrapper });
  });

  it("initially shows the create dialog with a user pre-filled", async () => {
    expect(screen.getByLabelText(FRIENDS)).toBeVisible();
    expect(screen.getByText(users[0].name)).toBeVisible();
    expect(
      screen.queryByRole("heading", {
        name: NEW_CHAT,
        level: 2,
      })
    ).toBeVisible();
  });
});

describe("CreateChat without router state", () => {
  beforeEach(() => {
    const { wrapper } = getHookWrapperWithClient();
    render(<CreateChat />, { wrapper });
  });

  it("doesn't initially show the create dialog", async () => {
    expect(screen.getByLabelText(FRIENDS)).not.toBeVisible();
    expect(
      screen.queryByRole("heading", {
        name: NEW_CHAT,
        level: 2,
        hidden: true,
      })
    ).toBeNull();
  });
});
