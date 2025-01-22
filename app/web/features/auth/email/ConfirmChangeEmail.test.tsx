import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import mockRouter from "next-router-mock";
import { loginRoute } from "routes";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { MockedService } from "test/utils";

import ConfirmChangeEmail from "./ConfirmChangeEmail";

const { t } = i18n;

const confirmChangeEmailMock = service.account
  .confirmChangeEmail as MockedService<
  typeof service.account.confirmChangeEmail
>;

function renderPage() {
  mockRouter.setCurrentUrl("?token=Em4iLR3seTtok3n");
  render(<ConfirmChangeEmail />, { wrapper });
}

describe("ConfirmChangeEmail", () => {
  it("shows the loading state on initial load", async () => {
    confirmChangeEmailMock.mockImplementation(() => new Promise(() => void 0));
    renderPage();

    expect(
      await screen.findByText(
        t("auth:change_email_confirmation.change_in_progress"),
      ),
    ).toBeVisible();
  });

  describe("when the change email completes successfully", () => {
    beforeEach(async () => {
      confirmChangeEmailMock.mockResolvedValue(new Empty());
      renderPage();
    });

    it("shows the success alert", async () => {
      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(
        t("auth:change_email_confirmation.success_message"),
      );
      expect(confirmChangeEmailMock).toHaveBeenCalledTimes(1);
      expect(confirmChangeEmailMock).toHaveBeenLastCalledWith(
        "Em4iLR3seTtok3n",
      );
    });

    it("shows a link that takes you to the login page when clicked", async () => {
      const user = userEvent.setup();

      await user.click(
        await screen.findByRole("link", { name: t("auth:login_prompt") }),
      );

      expect(mockRouter.pathname).toBe(loginRoute);
    });
  });

  it("shows an error alert if the reset password process failed to complete", async () => {
    jest.spyOn(console, "error").mockReturnValue(undefined);
    confirmChangeEmailMock.mockRejectedValue(new Error("Invalid token"));
    renderPage();

    const errorAlert = await screen.findByRole("alert");
    expect(errorAlert).toBeVisible();
    expect(errorAlert).toHaveTextContent("Error changing email: Invalid token");
  });
});
