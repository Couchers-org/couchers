import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/router";
import { AuthRes } from "proto/auth_pb";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { MockedService } from "test/utils";

import CompleteResetPassword from "./CompleteResetPassword";

const { t } = i18n;

const CompletePasswordResetMock = service.account
  .CompletePasswordResetV2 as MockedService<
  typeof service.account.CompletePasswordResetV2
>;

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
  setUser: jest.fn(),
}));

const mockUseRouter = useRouter as jest.Mock;
const mockPush = jest.fn();

// Mock localStorage to ensure tests start with clean state
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("CompletePasswordReset page", () => {
  beforeEach(() => {
    // Clear localStorage to ensure unauthenticated state
    localStorageMock.clear();

    CompletePasswordResetMock.mockResolvedValue(new AuthRes());

    mockUseRouter.mockReturnValue({
      query: { token: "aaa123" },
      push: mockPush,
    });
  });

  it("shows the set new password form correctly", async () => {
    render(<CompleteResetPassword />, { wrapper });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: t("auth:change_password_form.title"),
      }),
    ).toBeVisible();

    expect(
      screen.getByText(t("auth:change_password_form.subtitle")),
    ).toBeVisible();

    expect(
      screen.getByRole("button", { name: t("global:submit") }),
    ).toBeVisible();
  });

  describe("password visibility toggle", () => {
    beforeEach(() => {
      render(<CompleteResetPassword />, { wrapper });
    });

    it.each([["new_password"], ["confirm_password"]])(
      "toggles %s visibility when clicking the button",
      async (fieldName) => {
        const user = userEvent.setup();
        const passwordField = await screen.findByLabelText(
          t(`auth:change_password_form.${fieldName}`),
        );

        // Initially password should be hidden
        expect(passwordField).toHaveAttribute("type", "password");

        const showButton = screen.getByLabelText(
          t(`auth:change_password_form.show_${fieldName}`),
        );

        expect(showButton).toHaveAttribute(
          "aria-label",
          t(`auth:change_password_form.show_${fieldName}`),
        );

        await user.click(showButton);

        await waitFor(() => {
          expect(passwordField).toHaveAttribute("type", "text");
        });

        expect(showButton).toHaveAttribute(
          "aria-label",
          t(`auth:change_password_form.hide_${fieldName}`),
        );

        const hideButton = screen.getByLabelText(
          t(`auth:change_password_form.hide_${fieldName}`),
        );
        await user.click(hideButton);

        // Password should be hidden again
        await waitFor(() => {
          expect(passwordField).toHaveAttribute("type", "password");
        });
      },
    );

    it.each([["new_password"], ["confirm_password"]])(
      "allows typing visible text in the password field when toggled",
      async (fieldName) => {
        const user = userEvent.setup();
        const passwordField = await screen.findByLabelText(
          t(`auth:change_password_form.${fieldName}`),
        );

        await user.type(passwordField, "mypassword");
        expect(passwordField).toHaveValue("mypassword");
        expect(passwordField).toHaveAttribute("type", "password");

        const showButton = screen.getByLabelText(
          t(`auth:change_password_form.show_${fieldName}`),
        );
        await user.click(showButton);

        // Verify text is still there and type is now text
        await waitFor(() => {
          expect(passwordField).toHaveValue("mypassword");
          expect(passwordField).toHaveAttribute("type", "text");
        });
      },
    );
  });

  it("shows a warning when empty token", () => {
    mockUseRouter.mockReturnValue({
      query: { token: "" },
      push: mockPush,
    });

    render(<CompleteResetPassword />, { wrapper });

    expect(
      screen.queryByText(t("auth:change_password_form.token_error")),
    ).toBeInTheDocument();
  });

  it("don't show a warning when valid token", () => {
    render(<CompleteResetPassword />, { wrapper });

    expect(
      screen.queryByText(t("auth:change_password_form.token_error")),
    ).not.toBeInTheDocument();
  });

  it("does not submit if empty form", async () => {
    render(<CompleteResetPassword />, { wrapper });

    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: t("global:submit") }));

    await waitFor(() => {
      expect(CompletePasswordResetMock).not.toHaveBeenCalled();
    });
  });

  it("does not submit if password don't match", async () => {
    render(<CompleteResetPassword />, { wrapper });

    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText(t("auth:change_password_form.new_password")),
      "1111",
    );

    await user.type(
      screen.getByLabelText(t("auth:change_password_form.confirm_password")),
      "2222",
    );

    await user.click(screen.getByRole("button", { name: t("global:submit") }));

    await waitFor(() => {
      expect(CompletePasswordResetMock).not.toHaveBeenCalled();
    });
  });

  it("submits the reset password request successfully", async () => {
    mockUseRouter.mockReturnValue({
      query: { token: "aaa123" },
      push: mockPush,
    });

    render(<CompleteResetPassword />, { wrapper });

    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText(t("auth:change_password_form.new_password")),
      "1111",
    );

    await user.type(
      screen.getByLabelText(t("auth:change_password_form.confirm_password")),
      "1111",
    );

    await user.click(screen.getByRole("button", { name: t("global:submit") }));

    expect(
      await screen.findByText(
        t("auth:change_password_form.reset_password_success"),
      ),
    ).toBeVisible();

    expect(CompletePasswordResetMock).toHaveBeenCalledTimes(1);
  });

  it("shows an error alert if the reset password request failed", async () => {
    jest.spyOn(console, "error").mockReturnValue(undefined);
    CompletePasswordResetMock.mockRejectedValue(new Error("GRPC error"));

    mockUseRouter.mockReturnValue({
      query: { token: "aaa123" },
      push: mockPush,
    });

    render(<CompleteResetPassword />, { wrapper });

    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText(t("auth:change_password_form.new_password")),
      "1111",
    );

    await user.type(
      screen.getByLabelText(t("auth:change_password_form.confirm_password")),
      "1111",
    );

    await user.click(screen.getByRole("button", { name: t("global:submit") }));

    expect(
      screen.queryByText(t("auth:change_password_form.reset_password_success")),
    ).not.toBeInTheDocument();
  });
});
