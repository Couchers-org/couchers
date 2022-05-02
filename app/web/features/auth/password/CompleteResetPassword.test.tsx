import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import mockRouter from "next-router-mock";
import { loginRoute } from "routes";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { MockedService, t } from "test/utils";

import CompleteResetPassword from "./CompleteResetPassword";

const completePasswordResetMock = service.account
  .completePasswordReset as MockedService<
  typeof service.account.completePasswordReset
>;

function renderPage() {
  mockRouter.setCurrentUrl("?token=P4w0rdR3seTtok3n");
  render(<CompleteResetPassword />, { wrapper });
}

describe("CompleteResetPassword", () => {
  it("shows the loading state on initial load", async () => {
    completePasswordResetMock.mockImplementation(
      () => new Promise(() => void 0)
    );
    renderPage();

    expect(await screen.findByRole("progressbar")).toBeVisible();
  });

  describe("when the reset password completes successfully", () => {
    beforeEach(async () => {
      completePasswordResetMock.mockResolvedValue(new Empty());
      renderPage();
    });

    it("shows the success alert", async () => {
      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(t("auth:reset_password_success"));
      expect(completePasswordResetMock).toHaveBeenCalledTimes(1);
      expect(completePasswordResetMock).toHaveBeenLastCalledWith(
        "P4w0rdR3seTtok3n"
      );
    });

    it("shows a link that takes you to the login page when clicked", async () => {
      await userEvent.click(
        await screen.findByRole("link", { name: t("auth:login_prompt") })
      );

      expect(mockRouter.pathname).toBe(loginRoute);
    });
  });

  it("shows an error alert if the reset password process failed to complete", async () => {
    jest.spyOn(console, "error").mockReturnValue(undefined);
    completePasswordResetMock.mockRejectedValue(new Error("Invalid token"));
    renderPage();

    const errorAlert = await screen.findByRole("alert");
    expect(errorAlert).toBeVisible();
    expect(errorAlert).toHaveTextContent(
      t("auth:reset_password_error", { message: "Invalid token" })
    );
  });
});
