import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { assertErrorAlert, t } from "test/utils";

import Login from "./Login";

const passwordLoginMock = service.user.passwordLogin as jest.MockedFunction<
  typeof service.user.passwordLogin
>;

it("shows the known gRPC error from the API", async () => {
  const errorMessage = "Couldn't find that user.";
  passwordLoginMock.mockRejectedValue({
    code: 5,
    message: errorMessage,
  });
  render(<Login />, { wrapper });

  userEvent.type(
    await screen.findByLabelText(
      t("auth:login_page.form.username_field_label")
    ),
    "invalid"
  );
  userEvent.type(
    await screen.findByLabelText(
      t("auth:login_page.form.password_field_label")
    ),
    "wrongpwd"
  );
  userEvent.click(screen.getByRole("button", { name: t("global:continue") }));

  await assertErrorAlert(errorMessage);
});

it("shows the fatal error message for unknown errors", async () => {
  passwordLoginMock.mockRejectedValue({
    message: "unknown error",
  });
  render(<Login />, { wrapper });

  userEvent.type(
    await screen.findByLabelText(
      t("auth:login_page.form.username_field_label")
    ),
    "invalid"
  );
  userEvent.type(
    await screen.findByLabelText(
      t("auth:login_page.form.password_field_label")
    ),
    "wrongpwd"
  );
  userEvent.click(screen.getByRole("button", { name: t("global:continue") }));

  await assertErrorAlert(t("global:error.fatal_message"));
});
