import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChangePasswordPage from "features/auth/password/ChangePasswordPage";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { GetAccountInfoRes } from "pb/account_pb";
import { service } from "service/index";
import wrapper from "test/hookWrapper";
import { MockedService } from "test/utils";

const changePasswordMock = service.account.changePassword as MockedService<
  typeof service.account.changePassword
>;
const getAccountInfoMock = service.account.getAccountInfo as MockedService<
  typeof service.account.getAccountInfo
>;

describe("ChangePasswordPage", () => {
  beforeEach(() => {
    changePasswordMock.mockResolvedValue(new Empty());
  });

  describe("if the user has a password", () => {
    beforeEach(() => {
      getAccountInfoMock.mockResolvedValue({
        hasPassword: true,
        loginMethod: GetAccountInfoRes.LoginMethod.PASSWORD,
      });
    });

    it("shows the full change password form", async () => {
      render(<ChangePasswordPage />, { wrapper });

      expect(
        screen.getByRole("heading", { name: "Change password" })
      ).toBeVisible();
      expect(await screen.findByLabelText("Old password")).toBeVisible();
      expect(
        screen.getByText(
          /Please enter a password, or leave the "New password" and "Confirm password" fields blank/i
        )
      ).toBeVisible();
      expect(screen.getByLabelText("New password")).toBeVisible();
      expect(screen.getByLabelText("Confirm password")).toBeVisible();
      expect(screen.getByRole("button", { name: "Submit" })).toBeVisible();
    });

    it("does not try to submit the form if the user doesn't provide its old password", async () => {
      render(<ChangePasswordPage />, { wrapper });

      userEvent.click(await screen.findByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(changePasswordMock).not.toHaveBeenCalled();
      });
    });

    it("does not try to submit the form if the new and confirm password values don't match", async () => {
      render(<ChangePasswordPage />, { wrapper });

      userEvent.type(await screen.findByLabelText("New password"), "password");
      userEvent.type(screen.getByLabelText("Confirm password"), "password1");
      userEvent.click(screen.getByRole("button", { name: "Submit" }));

      expect(
        await screen.findByText(/This does not match the new password/i)
      ).toBeVisible();
      expect(changePasswordMock).not.toHaveBeenCalled();
    });

    it("updates the user's password successfully if a new password has been given", async () => {
      render(<ChangePasswordPage />, { wrapper });

      userEvent.type(
        await screen.findByLabelText("Old password"),
        "old_password"
      );
      userEvent.type(screen.getByLabelText("New password"), "new_password");
      userEvent.type(screen.getByLabelText("Confirm password"), "new_password");
      userEvent.click(screen.getByRole("button", { name: "Submit" }));

      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(
        "Your password change has been processed. Check your email for confirmation."
      );
      expect(changePasswordMock).toHaveBeenCalledTimes(1);
      expect(changePasswordMock).toHaveBeenCalledWith(
        "old_password",
        "new_password"
      );

      // Also check form has been cleared
      expect(screen.getByLabelText("Old password")).not.toHaveValue();
      expect(screen.getByLabelText("New password")).not.toHaveValue();
      expect(screen.getByLabelText("Confirm password")).not.toHaveValue();
    });

    it("clears the user password successfully if no new password has been given", async () => {
      render(<ChangePasswordPage />, { wrapper });

      userEvent.type(
        await screen.findByLabelText("Old password"),
        "old_password"
      );
      userEvent.click(screen.getByRole("button", { name: "Submit" }));

      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(
        "Your password change has been processed. Check your email for confirmation."
      );
      expect(changePasswordMock).toHaveBeenCalledTimes(1);
      expect(changePasswordMock).toHaveBeenCalledWith("old_password", "");

      // Also check form has been cleared
      expect(screen.getByLabelText("Old password")).not.toHaveValue();
      expect(screen.getByLabelText("New password")).not.toHaveValue();
      expect(screen.getByLabelText("Confirm password")).not.toHaveValue();
    });
  });

  describe("if the user does not have a password", () => {
    beforeEach(() => {
      getAccountInfoMock.mockResolvedValue({
        hasPassword: false,
        loginMethod: GetAccountInfoRes.LoginMethod.MAGIC_LINK,
      });
    });

    it("does not show the old password field", async () => {
      render(<ChangePasswordPage />, { wrapper });

      // Wait for new password field/form to show up first, otherwise old password not visible is always
      // gonna be true
      expect(await screen.findByLabelText("New password")).toBeVisible();
      expect(screen.getByText("Please enter a password.")).toBeVisible();
      expect(screen.queryByLabelText("Old password")).not.toBeInTheDocument();
    });

    // When user doesn't have an old password, new password becomes a required field
    it("does not try to submit the form if the user doesn't provide a new password", async () => {
      render(<ChangePasswordPage />, { wrapper });

      userEvent.click(await screen.findByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(changePasswordMock).not.toHaveBeenCalled();
      });
    });

    it("submits the change password request successfully if a new password has been given", async () => {
      render(<ChangePasswordPage />, { wrapper });

      userEvent.type(
        await screen.findByLabelText("New password"),
        "new_password"
      );
      userEvent.type(screen.getByLabelText("Confirm password"), "new_password");
      userEvent.click(screen.getByRole("button", { name: "Submit" }));

      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(
        "Your password change has been processed. Check your email for confirmation."
      );
      expect(changePasswordMock).toHaveBeenCalledTimes(1);
      expect(changePasswordMock).toHaveBeenCalledWith(
        undefined,
        "new_password"
      );

      // Also check form has been cleared
      expect(screen.getByLabelText("New password")).not.toHaveValue();
      expect(screen.getByLabelText("Confirm password")).not.toHaveValue();
    });

    it("shows an error alert if the change password request failed", async () => {
      jest.spyOn(console, "error").mockReturnValue(undefined);
      changePasswordMock.mockRejectedValue(
        new Error("The password is insecure")
      );
      render(<ChangePasswordPage />, { wrapper });

      userEvent.type(
        await screen.findByLabelText("New password"),
        "new_password"
      );
      userEvent.type(screen.getByLabelText("Confirm password"), "new_password");
      userEvent.click(screen.getByRole("button", { name: "Submit" }));

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toBeVisible();
      expect(errorAlert).toHaveTextContent("The password is insecure");
      expect(
        screen.queryByText(/Your password change has been processed/i)
      ).not.toBeInTheDocument();
    });
  });
});
