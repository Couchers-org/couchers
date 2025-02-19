import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChangeEmail from "features/auth/email/ChangeEmail";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { MockedService } from "test/utils";

const { t } = i18n;

const getAccountInfoMock = service.account.getAccountInfo as MockedService<
  typeof service.account.getAccountInfo
>;
const changeEmailMock = service.account.changeEmail as MockedService<
  typeof service.account.changeEmail
>;

const accountInfo = {
  username: "tester",
  email: "email@couchers.org",
  profileComplete: true,
  phone: "+46701740605",
  phoneVerified: true,
  timezone: "Australia/Melbourne",
  hasStrongVerification: false,
  birthdateVerificationStatus: 1,
  genderVerificationStatus: 3,
  doNotEmail: false,
  hasDonated: false,
  isSuperuser: false,
  uiLanguagePreference: "",
};

describe("ChangeEmail", () => {
  beforeEach(() => {
    changeEmailMock.mockResolvedValue(new Empty());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("if the user has a password", () => {
    beforeEach(async () => {
      getAccountInfoMock.mockResolvedValue(accountInfo);
      await render(<ChangeEmail {...accountInfo} />, { wrapper });
    });

    it("shows the full change email form", async () => {
      expect(
        screen.getByRole("heading", {
          name: t("auth:change_email_form.title"),
        }),
      ).toBeVisible();
      expect(
        await screen.findByLabelText(
          t("auth:change_email_form.current_password"),
        ),
      ).toBeVisible();
      expect(
        screen.getByLabelText(t("auth:change_email_form.new_email")),
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: t("global:submit") }),
      ).toBeVisible();
    });

    it("does not try to submit the form if the user didn't provide their old password", async () => {
      const user = userEvent.setup();

      await user.type(
        await screen.findByLabelText(t("auth:change_email_form.new_email")),
        "test@example.com",
      );
      await user.click(
        screen.getByRole("button", { name: t("global:submit") }),
      );

      await waitFor(() => {
        expect(changeEmailMock).not.toHaveBeenCalled();
      });
    });

    it("does not try to submit the form if the user didn't provide a new email", async () => {
      const user = userEvent.setup();

      await user.type(
        await screen.findByLabelText(
          t("auth:change_email_form.current_password"),
        ),
        "password",
      );
      await user.click(
        screen.getByRole("button", { name: t("global:submit") }),
      );

      await waitFor(() => {
        expect(changeEmailMock).not.toHaveBeenCalled();
      });
    });

    it("changes the user's email successfully if all required fields have been filled in", async () => {
      const user = userEvent.setup();

      await user.type(
        await screen.findByLabelText(
          t("auth:change_email_form.current_password"),
        ),
        "password",
      );
      await user.type(
        screen.getByLabelText(t("auth:change_email_form.new_email")),
        "test@example.com",
      );
      await user.click(
        screen.getByRole("button", { name: t("global:submit") }),
      );

      const successAlert = await screen.findByRole("alert");
      expect(successAlert).toBeVisible();
      expect(successAlert).toHaveTextContent(
        t("auth:change_email_form.success_message"),
      );
      expect(changeEmailMock).toHaveBeenCalledTimes(1);
      expect(changeEmailMock).toHaveBeenCalledWith(
        "test@example.com",
        "password",
      );

      // Also check form has been cleared
      expect(
        screen.getByLabelText(t("auth:change_email_form.current_password")),
      ).not.toHaveValue();
      expect(
        screen.getByLabelText(t("auth:change_email_form.new_email")),
      ).not.toHaveValue();
    });
  });

  it("shows an error alert if the change password request failed", async () => {
    jest.spyOn(console, "error").mockReturnValue(undefined);
    changeEmailMock.mockRejectedValue(new Error("Invalid email"));
    await render(<ChangeEmail {...accountInfo} />, { wrapper });

    const user = userEvent.setup();

    await user.type(
      await screen.findByLabelText(
        t("auth:change_email_form.current_password"),
      ),
      "password",
    );
    await user.type(
      await screen.findByLabelText(t("auth:change_email_form.new_email")),
      "test@example.com",
    );
    await user.click(screen.getByRole("button", { name: t("global:submit") }));

    const errorAlert = await screen.findByRole("alert");
    expect(errorAlert).toBeVisible();
    expect(errorAlert).toHaveTextContent("Invalid email");
    expect(
      screen.queryByText(/Your email change has been received/i),
    ).not.toBeInTheDocument();
  });
});
