import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { assertErrorAlert, t } from "test/utils";

import Login from "./Login";

const checkUsernameMock = service.auth.checkUsername as jest.MockedFunction<
  typeof service.auth.checkUsername
>;

it("shows the known gRPC error from the API", async () => {
  const errorMessage = "Couldn't find that user.";
  checkUsernameMock.mockRejectedValue({
    code: 5,
    message: errorMessage,
  });
  render(<Login />, { wrapper });

  await userEvent.type(
    await screen.findByLabelText(
      t("auth:login_page.form.username_field_label")
    ),
    "invalid"
  );
  await userEvent.click(
    screen.getByRole("button", { name: t("global:continue") })
  );

  await assertErrorAlert(errorMessage);
});

it("shows the fatal error message for unknown errors", async () => {
  checkUsernameMock.mockRejectedValue({
    message: "unknown error",
  });
  render(<Login />, { wrapper });

  await userEvent.type(
    await screen.findByLabelText(
      t("auth:login_page.form.username_field_label")
    ),
    "invalid"
  );
  await userEvent.click(
    screen.getByRole("button", { name: t("global:continue") })
  );

  await assertErrorAlert(t("global:error.fatal_message"));
});
