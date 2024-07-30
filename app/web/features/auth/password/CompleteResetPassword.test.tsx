import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedService, t } from "test/utils";
import { AuthRes } from "proto/auth_pb";
import { useRouter } from "next/router";
import wrapper from "test/hookWrapper";
import { service } from "service";

import CompletePasswordReset from "./CompleteResetPassword";

const CompletePasswordResetMock = service.account
  .CompletePasswordResetV2 as MockedService<
  typeof service.account.CompletePasswordResetV2
>;

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

const mockUseRouter = useRouter as jest.Mock;

describe("CompletePasswordReset page", () => {
  beforeEach(() => {
    CompletePasswordResetMock.mockResolvedValue(new AuthRes());

    mockUseRouter.mockReturnValue({
      query: { token: "aaa123" },
    });
  });

  it("shows the set new password form correctly", async () => {
    render(<CompletePasswordReset />, { wrapper });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: t("auth:change_password_form.title"),
      })
    ).toBeVisible();

    expect(
      screen.getByText(t("auth:change_password_form.subtitle"))
    ).toBeVisible();

    expect(
      screen.getByRole("button", { name: t("global:submit") })
    ).toBeVisible();
  });

  it("shows a warning when empty token", () => {
    mockUseRouter.mockReturnValue({
      query: { token: "" },
    });

    render(<CompletePasswordReset />, { wrapper });

    expect(
      screen.queryByText(t("auth:change_password_form.token_error"))
    ).toBeInTheDocument();
  });

  it("don't show a warning when valid token", () => {
    render(<CompletePasswordReset />, { wrapper });

    expect(
      screen.queryByText(t("auth:change_password_form.token_error"))
    ).not.toBeInTheDocument();
  });

  it("does not submit if empty form", async () => {
    render(<CompletePasswordReset />, { wrapper });

    userEvent.click(screen.getByRole("button", { name: t("global:submit") }));

    await waitFor(() => {
      expect(CompletePasswordResetMock).not.toHaveBeenCalled();
    });
  });

  it("does not submit if password don't match", async () => {
    render(<CompletePasswordReset />, { wrapper });

    userEvent.type(
      screen.getByLabelText(t("auth:change_password_form.new_password")),
      "1111"
    );

    userEvent.type(
      screen.getByLabelText(t("auth:change_password_form.confirm_password")),
      "2222"
    );

    userEvent.click(screen.getByRole("button", { name: t("global:submit") }));

    await waitFor(() => {
      expect(CompletePasswordResetMock).not.toHaveBeenCalled();
    });
  });

  it("submits the reset password request successfully", async () => {
    mockUseRouter.mockReturnValue({
      query: { token: "aaa123" },
    });

    render(<CompletePasswordReset />, { wrapper });

    userEvent.type(
      screen.getByLabelText(t("auth:change_password_form.new_password")),
      "1111"
    );

    userEvent.type(
      screen.getByLabelText(t("auth:change_password_form.confirm_password")),
      "1111"
    );

    userEvent.click(screen.getByRole("button", { name: t("global:submit") }));

    expect(
      await screen.findByText(
        t("auth:change_password_form.reset_password_success")
      )
    ).toBeVisible();

    expect(CompletePasswordResetMock).toHaveBeenCalledTimes(1);
  });

  it("shows an error alert if the reset password request failed", async () => {
    jest.spyOn(console, "error").mockReturnValue(undefined);
    CompletePasswordResetMock.mockRejectedValue(new Error("GRPC error"));

    mockUseRouter.mockReturnValue({
      query: { token: "aaa123" },
    });

    render(<CompletePasswordReset />, { wrapper });

    userEvent.type(
      screen.getByLabelText(t("auth:change_password_form.new_password")),
      "1111"
    );

    userEvent.type(
      screen.getByLabelText(t("auth:change_password_form.confirm_password")),
      "1111"
    );

    userEvent.click(screen.getByRole("button", { name: t("global:submit") }));

    expect(
      screen.queryByText(t("auth:change_password_form.reset_password_success"))
    ).not.toBeInTheDocument();
  });
});
