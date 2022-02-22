import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChangePassword from "features/auth/password/ChangePassword";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { GetAccountInfoRes } from "proto/account_pb";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { MockedService, t } from "test/utils";

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
  phoneVerified: false,
  timezone: "America/New_York",
};

const accountWithLink = {
  hasPassword: false,
  loginMethod: GetAccountInfoRes.LoginMethod.MAGIC_LINK,
  username: "tester",
  email: "email@couchers.org",
  profileComplete: true,
  phone: "+46701740605",
  phoneVerified: true,
  timezone: "America/New_York",
};

describe("ChangePassword", () => {
  beforeEach(() => {
    changePasswordMock.mockResolvedValue(new Empty());
  });

  describe("if the user has a password", () => {
    beforeEach(async () => {
      getAccountInfoMock.mockResolvedValue(accountWithPassword);
      render(<ChangePassword {...accountWithPassword} />, { wrapper });
    });

    it("shows the full change password form", async () => {
      expect(
        screen.getByRole("heading", {
          name: t("auth:change_password_form.title"),
        })
      ).toBeVisible();
      expect(
        await screen.findByLabelText(
          t("auth:change_password_form.old_password")
        )
      ).toBeVisible();
      expect(
        screen.getByLabelText(t("auth:change_password_form.new_password"))
      ).toBeVisible();
      expect(
        screen.getByLabelText(t("auth:change_password_form.confirm_password"))
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: t("global:submit") })
      ).toBeVisible();
    });

    it("does not try to submit the form if the user doesn't provide its old password", async () => {
      userEvent.click(
        await screen.findByRole("button", { name: t("global:submit") })
      );

      await waitFor(() => {
        expect(changePasswordMock).not.toHaveBeenCalled();
      });
    });

    it("does not try to submit the form if the new and confirm password values don't match", async () => {
      userEvent.type(
        await screen.findByLabelText(
          t("auth:change_password_form.new_password")
        ),
        "password"
      );
      userEvent.type(
        screen.getByLabelText(t("auth:change_password_form.confirm_password")),
        "password1"
      );
      userEvent.click(screen.getByRole("button", { name: t("global:submit") }));

      expect(
        await screen.findByText(/This does not match the new password/i)
      ).toBeVisible();
      expect(changePasswordMock).not.toHaveBeenCalled();
    });

    it("updates the user's password successfully if a new password has been given", async () => {
      userEvent.type(
        await screen.findByLabelText(
          t("auth:change_password_form.old_password")
        ),
        "old_password"
      );
      userEvent.type(
        screen.getByLabelText(t("auth:change_password_form.new_password")),
        "new_password"
      );
      userEvent.type(
        screen.getByLabelText(t("auth:change_password_form.confirm_password")),
        "new_password"
      );
      userEvent.click(screen.getByRole("button", { name: t("global:submit") }));

      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(
        t("auth:change_password_form.password_changed_success")
      );
      expect(changePasswordMock).toHaveBeenCalledTimes(1);
      expect(changePasswordMock).toHaveBeenCalledWith(
        "old_password",
        "new_password"
      );

      // Also check form has been cleared
      expect(
        screen.getByLabelText(t("auth:change_password_form.old_password"))
      ).not.toHaveValue();
      expect(
        screen.getByLabelText(t("auth:change_password_form.new_password"))
      ).not.toHaveValue();
      expect(
        screen.getByLabelText(t("auth:change_password_form.confirm_password"))
      ).not.toHaveValue();
    });

    it("clears the user password successfully if no new password has been given", async () => {
      userEvent.type(
        await screen.findByLabelText(
          t("auth:change_password_form.old_password")
        ),
        "old_password"
      );
      userEvent.click(screen.getByRole("button", { name: t("global:submit") }));

      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(t("auth:reset_password_success"));
      expect(changePasswordMock).toHaveBeenCalledTimes(1);
      expect(changePasswordMock).toHaveBeenCalledWith("old_password", "");

      // Also check form has been cleared
      expect(
        screen.getByLabelText(t("auth:change_password_form.old_password"))
      ).not.toHaveValue();
      expect(
        screen.getByLabelText(t("auth:change_password_form.new_password"))
      ).not.toHaveValue();
      expect(
        screen.getByLabelText(t("auth:change_password_form.confirm_password"))
      ).not.toHaveValue();
    });
  });

  describe("if the user does not have a password", () => {
    beforeEach(async () => {
      getAccountInfoMock.mockResolvedValue(accountWithLink);
      render(<ChangePassword {...accountWithLink} />, { wrapper });
    });

    it("does not show the old password field", async () => {
      // Wait for new password field/form to show up first, otherwise old password not visible is always
      // gonna be true
      expect(
        await screen.findByLabelText(
          t("auth:change_password_form.new_password")
        )
      ).toBeVisible();
      expect(
        screen.queryByLabelText(t("auth:change_password_form.old_password"))
      ).not.toBeInTheDocument();
    });

    // When user doesn't have an old password, new password becomes a required field
    it("does not try to submit the form if the user doesn't provide a new password", async () => {
      userEvent.click(
        await screen.findByRole("button", { name: t("global:submit") })
      );

      await waitFor(() => {
        expect(changePasswordMock).not.toHaveBeenCalled();
      });
    });

    it("submits the change password request successfully if a new password has been given", async () => {
      userEvent.type(
        await screen.findByLabelText(
          t("auth:change_password_form.new_password")
        ),
        "new_password"
      );
      userEvent.type(screen.getByLabelText("Confirm password"), "new_password");
      userEvent.click(screen.getByRole("button", { name: t("global:submit") }));

      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(
        t("auth:change_password_form.password_changed_success")
      );
      expect(changePasswordMock).toHaveBeenCalledTimes(1);
      expect(changePasswordMock).toHaveBeenCalledWith(
        undefined,
        "new_password"
      );

      // Also check form has been cleared
      expect(
        screen.getByLabelText(t("auth:change_password_form.new_password"))
      ).not.toHaveValue();
      expect(
        screen.getByLabelText(t("auth:change_password_form.confirm_password"))
      ).not.toHaveValue();
    });
  });

  it("shows an error alert if change password request failed", async () => {
    jest.spyOn(console, "error").mockReturnValue(undefined);
    changePasswordMock.mockRejectedValue(new Error("The password is insecure"));
    render(<ChangePassword {...accountWithLink} />, { wrapper });

    userEvent.type(
      await screen.findByLabelText(t("auth:change_password_form.new_password")),
      "new_password"
    );
    userEvent.type(
      screen.getByLabelText(t("auth:change_password_form.confirm_password")),
      "new_password"
    );
    userEvent.click(screen.getByRole("button", { name: t("global:submit") }));

    const errorAlert = await screen.findByRole("alert");
    expect(errorAlert).toBeVisible();
    expect(errorAlert).toHaveTextContent("The password is insecure");
    expect(
      screen.queryByText(/Your password change has been processed/i)
    ).not.toBeInTheDocument();
  });
});
