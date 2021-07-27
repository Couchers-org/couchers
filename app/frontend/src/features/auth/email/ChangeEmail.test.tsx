import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  CHANGE_EMAIL,
  CHECK_EMAIL,
  CURRENT_PASSWORD,
  NEW_EMAIL,
  SUBMIT,
} from "features/auth/constants";
import ChangeEmail from "features/auth/email/ChangeEmail";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { GetAccountInfoRes } from "proto/account_pb";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { MockedService } from "test/utils";

const getAccountInfoMock = service.account.getAccountInfo as MockedService<
  typeof service.account.getAccountInfo
>;
const changeEmailMock = service.account.changeEmail as MockedService<
  typeof service.account.changeEmail
>;

const accountInfo = {
  hasPassword: true,
  loginMethod: GetAccountInfoRes.LoginMethod.PASSWORD,
  username: "tester",
  email: "email@couchers.org",
  profileComplete: true,
  phone: "+46701740605",
  timezone: "Australia/Melbourne",
};

const accountWithLink = {
  hasPassword: false,
  loginMethod: GetAccountInfoRes.LoginMethod.MAGIC_LINK,
  username: "tester",
  email: "email@couchers.org",
  profileComplete: true,
  phone: "+46701740605",
  timezone: "America/New_York",
};

describe("ChangeEmail", () => {
  beforeEach(() => {
    changeEmailMock.mockResolvedValue(new Empty());
  });

  describe("if the user has a password", () => {
    beforeEach(() => {
      getAccountInfoMock.mockResolvedValue(accountInfo);
      render(<ChangeEmail {...accountInfo} />, { wrapper });
    });

    it("shows the full change email form", async () => {
      expect(screen.getByRole("heading", { name: CHANGE_EMAIL })).toBeVisible();
      expect(await screen.findByLabelText(CURRENT_PASSWORD)).toBeVisible();
      expect(screen.getByLabelText(NEW_EMAIL)).toBeVisible();
      expect(screen.getByRole("button", { name: SUBMIT })).toBeVisible();
    });

    it("does not try to submit the form if the user didn't provide their old password", async () => {
      userEvent.type(
        await screen.findByLabelText(NEW_EMAIL),
        "test@example.com"
      );
      userEvent.click(screen.getByRole("button", { name: SUBMIT }));

      await waitFor(() => {
        expect(changeEmailMock).not.toHaveBeenCalled();
      });
    });

    it("does not try to submit the form if the user didn't provide a new email", async () => {
      userEvent.type(
        await screen.findByLabelText(CURRENT_PASSWORD),
        "password"
      );
      userEvent.click(screen.getByRole("button", { name: SUBMIT }));

      await waitFor(() => {
        expect(changeEmailMock).not.toHaveBeenCalled();
      });
    });

    it("changes the user's email successfully if all required fields have been filled in", async () => {
      userEvent.type(
        await screen.findByLabelText(CURRENT_PASSWORD),
        "password"
      );
      userEvent.type(screen.getByLabelText(NEW_EMAIL), "test@example.com");
      userEvent.click(screen.getByRole("button", { name: SUBMIT }));

      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(CHECK_EMAIL);
      expect(changeEmailMock).toHaveBeenCalledTimes(1);
      expect(changeEmailMock).toHaveBeenCalledWith(
        "test@example.com",
        "password"
      );

      // Also check form has been cleared
      expect(screen.getByLabelText(CURRENT_PASSWORD)).not.toHaveValue();
      expect(screen.getByLabelText(NEW_EMAIL)).not.toHaveValue();
    });
  });

  describe("if the user does not have a password", () => {
    beforeEach(() => {
      getAccountInfoMock.mockResolvedValue(accountWithLink);
      render(<ChangeEmail {...accountWithLink} />, { wrapper });
    });

    it("does not show the current password field", async () => {
      expect(await screen.findByLabelText(NEW_EMAIL)).toBeVisible();
      expect(screen.queryByLabelText(CURRENT_PASSWORD)).not.toBeInTheDocument();
    });

    it("changes the user's email successfully if the user has provided a new email", async () => {
      userEvent.type(
        await screen.findByLabelText(NEW_EMAIL),
        "test@example.com"
      );
      userEvent.click(screen.getByRole("button", { name: SUBMIT }));

      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(CHECK_EMAIL);
      expect(changeEmailMock).toHaveBeenCalledTimes(1);
      expect(changeEmailMock).toHaveBeenCalledWith(
        "test@example.com",
        undefined
      );

      // Also check form has been cleared
      expect(screen.getByLabelText(NEW_EMAIL)).not.toHaveValue();
    });

    it("changes the user's email successfully if the user has provided an email with non-lowercase characters", async () => {
      userEvent.type(
        await screen.findByLabelText(NEW_EMAIL),
        "tesT@eXaMple.cOm"
      );
      userEvent.click(screen.getByRole("button", { name: SUBMIT }));

      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(CHECK_EMAIL);
      expect(changeEmailMock).toHaveBeenCalledTimes(1);
      expect(changeEmailMock).toHaveBeenCalledWith(
        "test@example.com",
        undefined
      );

      // Also check form has been cleared
      expect(screen.getByLabelText(NEW_EMAIL)).not.toHaveValue();
    });
  });

  it("shows an error alert if the change password request failed", async () => {
    jest.spyOn(console, "error").mockReturnValue(undefined);
    changeEmailMock.mockRejectedValue(new Error("Invalid email"));
    render(<ChangeEmail {...accountWithLink} />, { wrapper });

    userEvent.type(await screen.findByLabelText(NEW_EMAIL), "test@example.com");
    userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    const errorAlert = await screen.findByRole("alert");
    expect(errorAlert).toBeVisible();
    expect(errorAlert).toHaveTextContent("Invalid email");
    expect(
      screen.queryByText(/Your email change has been received/i)
    ).not.toBeInTheDocument();
  });
});
