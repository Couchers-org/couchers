import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";

import { service } from "../../../service";
import wrapper from "../../../test/hookWrapper";
import { MockedService } from "../../../test/utils";
import ResetPasswordPage from "./ResetPasswordPage";

const resetPasswordMock = service.account.resetPassword as MockedService<
  typeof service.account.resetPassword
>;

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    resetPasswordMock.mockResolvedValue(new Empty());
  });

  it("shows the reset password form correctly", () => {
    render(<ResetPasswordPage />, { wrapper });

    expect(
      screen.getByRole("heading", { level: 1, name: "Reset your password" })
    ).toBeVisible();
    expect(screen.getByLabelText("Enter your username/email")).toBeVisible();
    expect(screen.getByRole("button", { name: "Submit" })).toBeVisible();

    // Does not show error state or success message, since we've done nothing yet
    expect(
      screen.queryByText("Check your email for a reset password link!")
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not try to submit the reset password form if the field is not filled in", async () => {
    render(<ResetPasswordPage />, { wrapper });

    userEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(resetPasswordMock).not.toHaveBeenCalled();
    });
  });

  it("submits the reset password request successfully", async () => {
    render(<ResetPasswordPage />, { wrapper });

    userEvent.type(screen.getByLabelText("Enter your username/email"), "test");
    userEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(
      await screen.findByText("Check your email for a reset password link!")
    ).toBeVisible();
    expect(resetPasswordMock).toHaveBeenCalledTimes(1);
    expect(resetPasswordMock).toHaveBeenCalledWith("test");
  });

  it("shows an error alert if the reset password request failed", async () => {
    jest.spyOn(console, "error").mockReturnValue(undefined);
    resetPasswordMock.mockRejectedValue(new Error("GRPC error"));
    render(<ResetPasswordPage />, { wrapper });

    userEvent.type(screen.getByLabelText("Enter your username/email"), "test");
    userEvent.click(screen.getByRole("button", { name: "Submit" }));

    const errorAlert = await screen.findByRole("alert");
    expect(errorAlert).toBeVisible();
    expect(errorAlert).toHaveTextContent("GRPC error");
    expect(
      screen.queryByText("Check your email for a reset password link!")
    ).not.toBeInTheDocument();
  });
});
