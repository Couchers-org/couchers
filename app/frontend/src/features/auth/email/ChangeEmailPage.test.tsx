import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChangeEmailPage from "features/auth/email/ChangeEmailPage";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { GetAccountInfoRes } from "pb/account_pb";
import { service } from "service/index";
import wrapper from "test/hookWrapper";
import { MockedService } from "test/utils";

const getAccountInfoMock = service.account.getAccountInfo as MockedService<
  typeof service.account.getAccountInfo
>;
const changeEmailMock = service.account.changeEmail as MockedService<
  typeof service.account.changeEmail
>;

describe("ChangeEmailPage", () => {
  beforeEach(() => {
    changeEmailMock.mockResolvedValue(new Empty());
  });

  describe("if the user has a password", () => {
    beforeEach(() => {
      getAccountInfoMock.mockResolvedValue({
        hasPassword: true,
        loginMethod: GetAccountInfoRes.LoginMethod.PASSWORD,
      });
    });

    it("shows the full change email form", async () => {
      render(<ChangeEmailPage />, { wrapper });

      expect(
        screen.getByRole("heading", { name: "Change email" })
      ).toBeVisible();
      expect(await screen.findByLabelText("Current password")).toBeVisible();
      expect(screen.getByLabelText("New email")).toBeVisible();
      expect(screen.getByRole("button", { name: "Submit" })).toBeVisible();
    });

    it("does not try to submit the form if the user didn't provide their old password", async () => {
      render(<ChangeEmailPage />, { wrapper });

      userEvent.type(
        await screen.findByLabelText("New email"),
        "test@example.com"
      );
      userEvent.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(changeEmailMock).not.toHaveBeenCalled();
      });
    });

    it("does not try to submit the form if the user didn't provide a new email", async () => {
      render(<ChangeEmailPage />, { wrapper });

      userEvent.type(
        await screen.findByLabelText("Current password"),
        "password"
      );
      userEvent.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(changeEmailMock).not.toHaveBeenCalled();
      });
    });

    it("changes the user's email successfully if all required fields have been filled in", async () => {
      render(<ChangeEmailPage />, { wrapper });

      userEvent.type(
        await screen.findByLabelText("Current password"),
        "password"
      );
      userEvent.type(screen.getByLabelText("New email"), "test@example.com");
      userEvent.click(screen.getByRole("button", { name: "Submit" }));

      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(
        "Your email change has been received. Check your new email to complete the change."
      );
      expect(changeEmailMock).toHaveBeenCalledTimes(1);
      expect(changeEmailMock).toHaveBeenCalledWith(
        "test@example.com",
        "password"
      );

      // Also check form has been cleared
      expect(screen.getByLabelText("Current password")).not.toHaveValue();
      expect(screen.getByLabelText("New email")).not.toHaveValue();
    });

    it("submits sanitized email to the backend if user uses uppercase characters or adds whitespaces at the start/end", async () => {
      render(<ChangeEmailPage />, { wrapper });

      userEvent.type(
        await screen.findByLabelText("Current password"),
        "password"
      );
      userEvent.type(
        screen.getByLabelText("New email"),
        "   tEst@examPle.Com   "
      );
      userEvent.click(screen.getByRole("button", { name: "Submit" }));

      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(
        "Your email change has been received. Check your new email to complete the change."
      );
      expect(changeEmailMock).toHaveBeenCalledTimes(1);
      expect(changeEmailMock).toHaveBeenCalledWith(
        "test@example.com",
        "password"
      );

      // Also check form has been cleared
      expect(screen.getByLabelText("Current password")).not.toHaveValue();
      expect(screen.getByLabelText("New email")).not.toHaveValue();
    });
  });

  describe("if the user does not have a password", () => {
    beforeEach(() => {
      getAccountInfoMock.mockResolvedValue({
        hasPassword: false,
        loginMethod: GetAccountInfoRes.LoginMethod.MAGIC_LINK,
      });
    });

    it("does not show the current password field", async () => {
      render(<ChangeEmailPage />, { wrapper });

      expect(await screen.findByLabelText("New email")).toBeVisible();
      expect(
        screen.queryByLabelText("Current password")
      ).not.toBeInTheDocument();
    });

    it("changes the user's email successfully if the user has provided a new email", async () => {
      render(<ChangeEmailPage />, { wrapper });

      userEvent.type(
        await screen.findByLabelText("New email"),
        "test@example.com"
      );
      userEvent.click(screen.getByRole("button", { name: "Submit" }));

      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(
        "Your email change has been received. Check your new email to complete the change."
      );
      expect(changeEmailMock).toHaveBeenCalledTimes(1);
      expect(changeEmailMock).toHaveBeenCalledWith(
        "test@example.com",
        undefined
      );

      // Also check form has been cleared
      expect(screen.getByLabelText("New email")).not.toHaveValue();
    });

    it("submits sanitized email to the backend if user uses uppercase characters or adds whitespaces at the start/end", async () => {
      render(<ChangeEmailPage />, { wrapper });

      userEvent.type(
        await screen.findByLabelText("New email"),
        "  tesT@eXample.cOm  "
      );

      userEvent.click(screen.getByRole("button", { name: "Submit" }));

      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(
        "Your email change has been received. Check your new email to complete the change."
      );
      expect(changeEmailMock).toHaveBeenCalledTimes(1);
      expect(changeEmailMock).toHaveBeenCalledWith(
        "test@example.com",
        undefined
      );

      // Also check form has been cleared
      expect(screen.getByLabelText("New email")).not.toHaveValue();
    });

    it("shows an error alert if the change password request failed", async () => {
      jest.spyOn(console, "error").mockReturnValue(undefined);
      changeEmailMock.mockRejectedValue(new Error("Invalid email"));
      render(<ChangeEmailPage />, { wrapper });

      userEvent.type(
        await screen.findByLabelText("New email"),
        "test@example.com"
      );
      userEvent.click(screen.getByRole("button", { name: "Submit" }));

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toBeVisible();
      expect(errorAlert).toHaveTextContent("Invalid email");
      expect(
        screen.queryByText(/Your email change has been received/i)
      ).not.toBeInTheDocument();
    });
  });
});
