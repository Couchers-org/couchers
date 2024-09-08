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

const getAccountInfoMock = service.account.getAccountInfo as MockedService<
  typeof service.account.getAccountInfo
>;

const accountInfo = {
  username: "tester",
  email: "email@couchers.org",
  profileComplete: true,
  phone: "+46701740605",
  phoneVerified: true,
  timezone: "Australia/Broken_Hill",
  hasStrongVerification: false,
  birthdateVerificationStatus: 1,
  genderVerificationStatus: 3,
  doNotEmail: false,
};

describe("MessageUserButton", () => {
  beforeEach(() => {
    setErrorMock.mockClear();
    getAccountInfoMock.mockResolvedValue(accountInfo);
  });

  it("redirects to thread if dm exists", async () => {
    getDirectMessageMock.mockResolvedValueOnce(99);
    const user = users[0];
    render(<MessageUserButton user={user} setMutationError={setErrorMock} />, {
      wrapper,
    });

    const button = screen.getByRole("button");

    await waitFor(() => {
      expect(button).toBeEnabled();
    });

    userEvent.click(button);

    await waitFor(() => expect(mockRouter.pathname).toBe(routeToGroupChat(99)));
  });

  it("redirects to chat tab with state if dm doesn't exist", async () => {
    getDirectMessageMock.mockResolvedValueOnce(false);
    const user = users[0];
    render(<MessageUserButton user={user} setMutationError={setErrorMock} />, {
      wrapper,
    });

    const button = screen.getByRole("button");

    await waitFor(() => {
      expect(button).toBeEnabled();
    });

    userEvent.click(button);

    await waitFor(() =>
      expect(mockRouter.asPath).toBe(routeToCreateMessage(user.username))
    );
  });
});
