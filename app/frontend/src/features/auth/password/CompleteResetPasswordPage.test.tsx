import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Route, Switch } from "react-router-dom";

import { loginRoute, resetPasswordRoute } from "../../../AppRoutes";
import { service } from "../../../service";
import { getHookWrapperWithClient } from "../../../test/hookWrapper";
import { MockedService } from "../../../test/utils";
import CompleteResetPasswordPage from "./CompleteResetPasswordPage";

const completePasswordResetMock = service.account
  .completePasswordReset as MockedService<
  typeof service.account.completePasswordReset
>;

function renderPage() {
  const { wrapper } = getHookWrapperWithClient({
    initialRouterEntries: [`${resetPasswordRoute}/P4w0rdR3seTtok3n`],
  });

  render(
    <Switch>
      <Route path={`${resetPasswordRoute}/:resetToken`}>
        <CompleteResetPasswordPage />
      </Route>
      <Route path={loginRoute}>Log in page</Route>
    </Switch>,
    { wrapper }
  );
}

describe("CompleteResetPasswordPage", () => {
  it("shows the loading state on initial load", async () => {
    completePasswordResetMock.mockImplementation(
      () => new Promise(() => void 0)
    );
    renderPage();

    expect(
      await screen.findByText("Password reset in progress...")
    ).toBeVisible();
  });

  describe("when the reset password completes successfully", () => {
    beforeEach(() => {
      completePasswordResetMock.mockResolvedValue(new Empty());
      renderPage();
    });

    it("shows the success alert", async () => {
      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(
        "Your password has been reset successfully!"
      );
      expect(completePasswordResetMock).toHaveBeenCalledTimes(1);
      expect(completePasswordResetMock).toHaveBeenLastCalledWith(
        "P4w0rdR3seTtok3n"
      );
    });

    it("shows a link that takes you to the login page when clicked", async () => {
      userEvent.click(
        await screen.findByRole("link", { name: "Click here to login" })
      );

      expect(await screen.findByText("Log in page")).toBeInTheDocument();
    });
  });

  it("shows an error alert if the reset password process failed to complete", async () => {
    completePasswordResetMock.mockRejectedValue(new Error("Invalid token"));
    renderPage();

    const errorAlert = await screen.findByRole("alert");
    expect(errorAlert).toBeVisible();
    expect(errorAlert).toHaveTextContent(
      "Error resetting password: Invalid token"
    );
  });
});
