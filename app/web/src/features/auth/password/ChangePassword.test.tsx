import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  CHANGE_PASSWORD,
  CONFIRM_PASSWORD,
  NEW_PASSWORD,
  OLD_PASSWORD,
  PASSWORD_CHANGED,
  RESET_PASSWORD_SUCCESS,
  SUBMIT,
} from "features/auth/constants";
import ChangePassword from "features/auth/password/ChangePassword";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { GetAccountInfoRes } from "proto/account_pb";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { MockedService } from "test/utils";

const changePasswordMock = service.account.changePassword as MockedService<
  typeof service.account.changePassword
>;
const getAccountInfoMock = service.account.getAccountInfo as MockedService<
  typeof service.account.getAccountInfo
>;

const accountWithPassword = {
  hasPassword: true,
  loginMethod: GetAccountInfoRes.LoginMethod.PASSWORD,
  username: "tester",
  email: "email@couchers.org",
  profileComplete: true,
  phone: "",
  timezone: "America/New_York",
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

describe("ChangePassword", () => {
  beforeEach(() => {
    changePasswordMock.mockResolvedValue(new Empty());
  });

  describe("if the user has a password", () => {
    beforeEach(() => {
      getAccountInfoMock.mockResolvedValue(accountWithPassword);
      render(<ChangePassword {...accountWithPassword} />, { wrapper });
    });

    it("shows the full change password form", async () => {
      expect(
        screen.getByRole("heading", { name: CHANGE_PASSWORD })
      ).toBeVisible();
      expect(await screen.findByLabelText(OLD_PASSWORD)).toBeVisible();
      expect(screen.getByLabelText(NEW_PASSWORD)).toBeVisible();
      expect(screen.getByLabelText(CONFIRM_PASSWORD)).toBeVisible();
      expect(screen.getByRole("button", { name: SUBMIT })).toBeVisible();
    });

    it("does not try to submit the form if the user doesn't provide its old password", async () => {
      userEvent.click(await screen.findByRole("button", { name: SUBMIT }));

      await waitFor(() => {
        expect(changePasswordMock).not.toHaveBeenCalled();
      });
    });

    it("does not try to submit the form if the new and confirm password values don't match", async () => {
      userEvent.type(await screen.findByLabelText(NEW_PASSWORD), "password");
      userEvent.type(screen.getByLabelText(CONFIRM_PASSWORD), "password1");
      userEvent.click(screen.getByRole("button", { name: SUBMIT }));

      expect(
        await screen.findByText(/This does not match the new password/i)
      ).toBeVisible();
      expect(changePasswordMock).not.toHaveBeenCalled();
    });

    it("updates the user's password successfully if a new password has been given", async () => {
      userEvent.type(
        await screen.findByLabelText(OLD_PASSWORD),
        "old_password"
      );
      userEvent.type(screen.getByLabelText(NEW_PASSWORD), "new_password");
      userEvent.type(screen.getByLabelText(CONFIRM_PASSWORD), "new_password");
      userEvent.click(screen.getByRole("button", { name: SUBMIT }));

      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(PASSWORD_CHANGED);
      expect(changePasswordMock).toHaveBeenCalledTimes(1);
      expect(changePasswordMock).toHaveBeenCalledWith(
        "old_password",
        "new_password"
      );

      // Also check form has been cleared
      expect(screen.getByLabelText(OLD_PASSWORD)).not.toHaveValue();
      expect(screen.getByLabelText(NEW_PASSWORD)).not.toHaveValue();
      expect(screen.getByLabelText(CONFIRM_PASSWORD)).not.toHaveValue();
    });

    it("clears the user password successfully if no new password has been given", async () => {
      userEvent.type(
        await screen.findByLabelText(OLD_PASSWORD),
        "old_password"
      );
      userEvent.click(screen.getByRole("button", { name: SUBMIT }));

      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(RESET_PASSWORD_SUCCESS);
      expect(changePasswordMock).toHaveBeenCalledTimes(1);
      expect(changePasswordMock).toHaveBeenCalledWith("old_password", "");

      // Also check form has been cleared
      expect(screen.getByLabelText(OLD_PASSWORD)).not.toHaveValue();
      expect(screen.getByLabelText(NEW_PASSWORD)).not.toHaveValue();
      expect(screen.getByLabelText(CONFIRM_PASSWORD)).not.toHaveValue();
    });
  });

  describe("if the user does not have a password", () => {
    beforeEach(() => {
      getAccountInfoMock.mockResolvedValue(accountWithLink);
      render(<ChangePassword {...accountWithLink} />, { wrapper });
    });

    it("does not show the old password field", async () => {
      // Wait for new password field/form to show up first, otherwise old password not visible is always
      // gonna be true
      expect(await screen.findByLabelText(NEW_PASSWORD)).toBeVisible();
      expect(screen.queryByLabelText(OLD_PASSWORD)).not.toBeInTheDocument();
    });

    // When user doesn't have an old password, new password becomes a required field
    it("does not try to submit the form if the user doesn't provide a new password", async () => {
      userEvent.click(await screen.findByRole("button", { name: SUBMIT }));

      await waitFor(() => {
        expect(changePasswordMock).not.toHaveBeenCalled();
      });
    });

    it("submits the change password request successfully if a new password has been given", async () => {
      userEvent.type(
        await screen.findByLabelText(NEW_PASSWORD),
        "new_password"
      );
      userEvent.type(screen.getByLabelText("Confirm password"), "new_password");
      userEvent.click(screen.getByRole("button", { name: SUBMIT }));

      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(PASSWORD_CHANGED);
      expect(changePasswordMock).toHaveBeenCalledTimes(1);
      expect(changePasswordMock).toHaveBeenCalledWith(
        undefined,
        "new_password"
      );

      // Also check form has been cleared
      expect(screen.getByLabelText(NEW_PASSWORD)).not.toHaveValue();
      expect(screen.getByLabelText(CONFIRM_PASSWORD)).not.toHaveValue();
    });
  });

  it("shows an error alert if change password request failed", async () => {
    jest.spyOn(console, "error").mockReturnValue(undefined);
    changePasswordMock.mockRejectedValue(new Error("The password is insecure"));
    render(<ChangePassword {...accountWithLink} />, { wrapper });

    userEvent.type(await screen.findByLabelText(NEW_PASSWORD), "new_password");
    userEvent.type(screen.getByLabelText(CONFIRM_PASSWORD), "new_password");
    userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    const errorAlert = await screen.findByRole("alert");
    expect(errorAlert).toBeVisible();
    expect(errorAlert).toHaveTextContent("The password is insecure");
    expect(
      screen.queryByText(/Your password change has been processed/i)
    ).not.toBeInTheDocument();
  });
});
