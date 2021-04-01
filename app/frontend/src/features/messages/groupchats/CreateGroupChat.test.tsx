import { render, screen } from "@testing-library/react";
import { FRIENDS, NEW_CHAT } from "features/messages/constants";
import CreateGroupChat from "features/messages/groupchats/CreateGroupChat";
import { User } from "pb/api_pb";
import users from "test/fixtures/users.json";
import { getHookWrapperWithClient } from "test/hookWrapper";

describe("CreateGroupChat with router state", () => {
  beforeEach(() => {
    const { wrapper } = getHookWrapperWithClient({
      initialRouterEntries: [
        {
          pathname: "create-group-chat-test",
          state: { createMessageTo: users[0] as User.AsObject },
        },
      ],
    });
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
    const { wrapper } = getHookWrapperWithClient();
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
