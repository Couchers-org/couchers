import { render, screen } from "@testing-library/react";
import { FRIENDS, NEW_CHAT } from "features/messages/constants";
import CreateGroupChat from "features/messages/groupchats/CreateGroupChat";
import mockRouter from "next-router-mock";
import { service } from "service";
import users from "test/fixtures/users.json";
import wrapper from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";
import { MockedService } from "test/utils";

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
    mockRouter.setCurrentUrl(`/create-group-chat-test?to=${users[0].username}`);
    render(<CreateGroupChat />, { wrapper });
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

describe("CreateGroupChat without router state", () => {
  beforeEach(() => {
    render(<CreateGroupChat />, { wrapper });
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
