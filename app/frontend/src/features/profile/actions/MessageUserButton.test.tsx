import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MessageUserButton from "features/profile/actions/MessageUserButton";
import { User } from "pb/api_pb";
import React from "react";
import { useHistory } from "react-router-dom";
import { groupChatsRoute, routeToGroupChat } from "routes";
import { service } from "service";
import users from "test/fixtures/users.json";
import wrapper from "test/hookWrapper";
import { MockedService } from "test/utils";

const pushMock = jest.fn();
const setErrorMock = jest.fn();
const getDirectMessageMock = service.conversations
  .getDirectMessage as MockedService<
  typeof service.conversations.getDirectMessage
>;
jest.mock("react-router-dom", () => {
  const pushMock = jest.fn();
  return {
    ...jest.requireActual("react-router-dom"),
    useHistory: () => ({
      push: pushMock,
    }),
  };
});

describe("CreateGroupChat with router state", () => {
  beforeEach(() => {
    pushMock.mockClear();
    setErrorMock.mockClear();
  });

  it("isn't rendered if not friends", async () => {
    jest.spyOn(console, "error").mockReturnValueOnce(undefined);
    render(
      <MessageUserButton
        user={{ ...users[0], friends: User.FriendshipStatus.NOT_FRIENDS }}
        setMutationError={setErrorMock}
      />,
      { wrapper }
    );

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("redirects to thread if dm exists", async () => {
    getDirectMessageMock.mockResolvedValueOnce(99);
    const user = { ...users[0], friends: User.FriendshipStatus.FRIENDS };
    render(<MessageUserButton user={user} setMutationError={setErrorMock} />, {
      wrapper,
    });

    userEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(useHistory().push).toBeCalledWith(routeToGroupChat(99));
    });
  });

  it("redirects to chat tab with state if dm doesn't exist", async () => {
    getDirectMessageMock.mockResolvedValueOnce(false);
    const user = { ...users[0], friends: User.FriendshipStatus.FRIENDS };
    render(<MessageUserButton user={user} setMutationError={setErrorMock} />, {
      wrapper,
    });

    userEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(useHistory().push).toBeCalledWith(groupChatsRoute, {
        createMessageTo: user,
      });
    });
  });
});
