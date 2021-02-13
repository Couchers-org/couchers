import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";

import { service } from "../../../service";
import wrapper from "../../../test/hookWrapper";
import { MockedService } from "../../../test/utils";
import ChangePasswordPage from "./ChangePasswordPage";

const changePasswordMock = service.account.changePassword as MockedService<
  typeof service.account.changePassword
>;

describe("ChangePasswordPage", () => {
  beforeEach(() => {
    changePasswordMock.mockResolvedValue(new Empty());
  });

  it("does not show the old password field if the user does not have a password", async () => {
    // TODO: trigger getAccountInfo mock to return no password when queried when new API gets merged
    render(<ChangePasswordPage />, { wrapper });

    // Assert old password field doesn't show up
  });

  it("shows the full change password form if the user has a password", async () => {
    render(<ChangePasswordPage />, { wrapper });

    expect(
      screen.getByRole("heading", { name: "Change password" })
    ).toBeVisible();
    expect(screen.getByLabelText("Old password")).toBeVisible();
    expect(screen.getByLabelText("New password")).toBeVisible();
    expect(screen.getByLabelText("Confirm password")).toBeVisible();
    expect(screen.getByRole("button", { name: "Submit" })).toBeVisible();
  });

  it("does not try to submit the form if the new and confirm password values don't match", async () => {
    render(<ChangePasswordPage />, { wrapper });

    userEvent.type(screen.getByLabelText("New password"), "password");
    userEvent.type(screen.getByLabelText("Confirm password"), "password1");
    userEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(
      await screen.findByText(/This does not match the new password/i)
    ).toBeVisible();
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it("submits the change password request successfully", async () => {
    render(<ChangePasswordPage />, { wrapper });

    userEvent.type(screen.getByLabelText("New password"), "new_password");
    userEvent.type(screen.getByLabelText("Confirm password"), "new_password");
    userEvent.click(screen.getByRole("button", { name: "Submit" }));

    const successAlert = await screen.findByRole("alert");
    expect(successAlert).toBeVisible();
    expect(successAlert).toHaveTextContent(
      "Your password change has been processed. Check your email for confirmation."
    );
    expect(changePasswordMock).toHaveBeenCalledTimes(1);
    expect(changePasswordMock).toHaveBeenCalledWith("", "new_password");
  });

  it("submits the change password request successfully with an old password if one is given", async () => {
    render(<ChangePasswordPage />, { wrapper });

    userEvent.type(screen.getByLabelText("Old password"), "old_password");
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
  });

  it("shows an error alert if the change password request failed", async () => {
    jest.spyOn(console, "error").mockReturnValue(undefined);
    changePasswordMock.mockRejectedValue(new Error("The password is insecure"));
    render(<ChangePasswordPage />, { wrapper });

    userEvent.type(screen.getByLabelText("Old password"), "old_password");
    userEvent.type(screen.getByLabelText("New password"), "new_password");
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
