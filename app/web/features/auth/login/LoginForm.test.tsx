import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { MockedService } from "test/utils";

import LoginForm from "./LoginForm";

const { t } = i18n;

const passwordLoginMock = service.user.passwordLogin as MockedService<typeof service.user.passwordLogin>;

describe("LoginForm", () => {
  beforeEach(() => {
    passwordLoginMock.mockResolvedValue({
      userId: 1,
      jailed: false,
    });
  });

  describe("password visibility toggle", () => {
    beforeEach(() => {
      render(<LoginForm />, { wrapper });
    });

    it("renders the password visibility toggle button", async () => {
      const toggleButton = await screen.findByLabelText(t("auth:login_page.form.show_password"));
      expect(toggleButton).toBeInTheDocument();
    });

    it("toggles password visibility when clicking the button", async () => {
      const user = userEvent.setup();
      const passwordField = await screen.findByLabelText(t("auth:login_page.form.password_field_label"));

      // Initially password should be hidden
      expect(passwordField).toHaveAttribute("type", "password");

      const showButton = screen.getByLabelText(t("auth:login_page.form.show_password"));
      await user.click(showButton);

      await waitFor(() => {
        expect(passwordField).toHaveAttribute("type", "text");
      });

      const hideButton = screen.getByLabelText(t("auth:login_page.form.hide_password"));
      await user.click(hideButton);

      // Password should be hidden again
      await waitFor(() => {
        expect(passwordField).toHaveAttribute("type", "password");
      });
    });

    it("changes aria-label when toggling password visibility", async () => {
      const user = userEvent.setup();

      const showButton = await screen.findByLabelText(t("auth:login_page.form.show_password"));
      expect(showButton).toHaveAttribute("aria-label", t("auth:login_page.form.show_password"));

      await user.click(showButton);

      await waitFor(() => {
        const hideButton = screen.getByLabelText(t("auth:login_page.form.hide_password"));
        expect(hideButton).toHaveAttribute("aria-label", t("auth:login_page.form.hide_password"));
      });
    });

    it("allows typing visible text in the password field when toggled", async () => {
      const user = userEvent.setup();
      const passwordField = await screen.findByLabelText(t("auth:login_page.form.password_field_label"));

      await user.type(passwordField, "mypassword");
      expect(passwordField).toHaveValue("mypassword");
      expect(passwordField).toHaveAttribute("type", "password");

      const showButton = screen.getByLabelText(t("auth:login_page.form.show_password"));
      await user.click(showButton);

      // Verify text is still there and type is now text
      await waitFor(() => {
        expect(passwordField).toHaveValue("mypassword");
        expect(passwordField).toHaveAttribute("type", "text");
      });
    });
  });

  describe("form submission", () => {
    it("submits login form with correct credentials", async () => {
      render(<LoginForm />, { wrapper });
      const user = userEvent.setup();

      const usernameField = await screen.findByLabelText(t("auth:login_page.form.username_field_label"));
      const passwordField = screen.getByLabelText(t("auth:login_page.form.password_field_label"));

      await user.type(usernameField, "testuser");
      await user.type(passwordField, "testpassword");

      const loginButton = screen.getByRole("button", {
        name: t("global:login"),
      });
      await user.click(loginButton);

      await waitFor(() => {
        expect(passwordLoginMock).toHaveBeenCalledWith("testuser", "testpassword", true);
      });
    });
  });
});
