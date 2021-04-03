import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ENTER_EMAIL,
  RESET_PASSWORD,
  RESET_PASSWORD_LINK,
  SUBMIT,
} from "features/auth/constants";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { MockedService } from "test/utils";

import ResetPassword from "./ResetPassword";

const resetPasswordMock = service.account.resetPassword as MockedService<
  typeof service.account.resetPassword
>;

describe("ResetPassword", () => {
  beforeEach(() => {
    resetPasswordMock.mockResolvedValue(new Empty());
  });

  it("shows the reset password form correctly", () => {
    render(<ResetPassword />, { wrapper });

    expect(
      screen.getByRole("heading", { level: 1, name: RESET_PASSWORD })
    ).toBeVisible();
    expect(screen.getByLabelText(ENTER_EMAIL)).toBeVisible();
    expect(screen.getByRole("button", { name: SUBMIT })).toBeVisible();

    // Does not show error state or success message, since we've done nothing yet
    expect(
      screen.queryByText("Check your email for a reset password link!")
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not try to submit the reset password form if the field is not filled in", async () => {
    render(<ResetPassword />, { wrapper });

    userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    await waitFor(() => {
      expect(resetPasswordMock).not.toHaveBeenCalled();
    });
  });

  it("submits the reset password request successfully", async () => {
    render(<ResetPassword />, { wrapper });

    userEvent.type(screen.getByLabelText(ENTER_EMAIL), "test");
    userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    expect(
      await screen.findByText("Check your email for a reset password link!")
    ).toBeVisible();
    expect(resetPasswordMock).toHaveBeenCalledTimes(1);
    expect(resetPasswordMock).toHaveBeenCalledWith("test");
  });

  it("shows an error alert if the reset password request failed", async () => {
    jest.spyOn(console, "error").mockReturnValue(undefined);
    resetPasswordMock.mockRejectedValue(new Error("GRPC error"));
    render(<ResetPassword />, { wrapper });

    userEvent.type(screen.getByLabelText(ENTER_EMAIL), "test");
    userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    const errorAlert = await screen.findByRole("alert");
    expect(errorAlert).toBeVisible();
    expect(errorAlert).toHaveTextContent("GRPC error");
    expect(screen.queryByText(RESET_PASSWORD_LINK)).not.toBeInTheDocument();
  });
});
