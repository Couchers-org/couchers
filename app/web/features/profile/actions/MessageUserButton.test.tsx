import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MessageUserButton from "features/profile/actions/MessageUserButton";
import mockRouter from "next-router-mock";
import React from "react";
import { routeToCreateMessage, routeToGroupChat } from "routes";
import { service } from "service";
import users from "test/fixtures/users.json";
import wrapper from "test/hookWrapper";
import { MockedService } from "test/utils";

const setErrorMock = jest.fn();
const getDirectMessageMock = service.conversations
  .getDirectMessage as MockedService<
  typeof service.conversations.getDirectMessage
>;

describe("MessageUserButton", () => {
  beforeEach(() => {
    setErrorMock.mockClear();
  });

  it("redirects to thread if dm exists", async () => {
    getDirectMessageMock.mockResolvedValueOnce(99);
    const user = users[0];
    render(<MessageUserButton user={user} setMutationError={setErrorMock} />, {
      wrapper,
    });

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(mockRouter.pathname).toBe(routeToGroupChat(99)));
  });

  it("redirects to chat tab with state if dm doesn't exist", async () => {
    getDirectMessageMock.mockResolvedValueOnce(false);
    const user = users[0];
    render(<MessageUserButton user={user} setMutationError={setErrorMock} />, {
      wrapper,
    });

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(mockRouter.asPath).toBe(routeToCreateMessage(user.username))
    );
  });
});
