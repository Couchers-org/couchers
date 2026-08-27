import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusCode } from "grpc-web";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { assertErrorAlert, MockedService } from "test/utils";

import ChangeSignupEmail from "./ChangeSignupEmail";

const { t } = i18n;

const signupFlowChangeEmailMock = service.auth.signupFlowChangeEmail as MockedService<
  typeof service.auth.signupFlowChangeEmail
>;

const flowState = {
  flowToken: "token",
  needBasic: false,
  needAccount: true,
  needAcceptCommunityGuidelines: false,
  needMotivations: false,
  needFeedback: false,
  needVerifyEmail: true,
};

describe("ChangeSignupEmail", () => {
  beforeEach(() => {
    signupFlowChangeEmailMock.mockReset();

    window.localStorage.setItem(
      "auth.flowState",
      JSON.stringify(flowState),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.localStorage.clear();
  });

  it("renders the change email form", async () => {
    render(<ChangeSignupEmail />, { wrapper });

    expect(
      screen.getByLabelText(
        t("auth:change_signup_email_form.new_email"),
      ),
    ).toBeVisible();

    expect(
      screen.getByRole("button", { name: t("auth:change_signup_email_form.signup_change_email") }),
    ).toBeVisible();
  });

  it("changes the signup email", async () => {
    signupFlowChangeEmailMock.mockResolvedValue(flowState);

    render(<ChangeSignupEmail />, { wrapper });

    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText(
        t("auth:change_signup_email_form.new_email"),
      ),
      "new@example.com",
    );

    await user.click(
      screen.getByRole("button", { name: t("auth:change_signup_email_form.signup_change_email") }),
    );

    await waitFor(() => {
      expect(signupFlowChangeEmailMock).toHaveBeenCalledWith(
        "token",
        "new@example.com",
      );
    });
  });

  it("displays an error when changing to an email that is already in use", async () => {
    signupFlowChangeEmailMock.mockRejectedValue({
      code: StatusCode.FAILED_PRECONDITION,
      message: "That email address is already associated with an account.",
    });

    render(<ChangeSignupEmail />, { wrapper });

    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText(
        t("auth:change_signup_email_form.new_email"),
      ),
      "existing@example.com",
    );

    await user.click(
      screen.getByRole("button", { name: t("auth:change_signup_email_form.signup_change_email") }),
    );

    await assertErrorAlert(
      "That email address is already associated with an account.",
    );
  });

  it("displays an error when the signup flow token is invalid", async () => {
    signupFlowChangeEmailMock.mockRejectedValue({
      code: StatusCode.NOT_FOUND,
      message: "Invalid token",
    });

    render(<ChangeSignupEmail />, { wrapper });

    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText(
        t("auth:change_signup_email_form.new_email"),
      ),
      "new@example.com",
    );

    await user.click(
      screen.getByRole("button", { name: t("auth:change_signup_email_form.signup_change_email") }),
    );

    await assertErrorAlert("Invalid token");
  });
});
