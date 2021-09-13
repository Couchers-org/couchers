import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ERROR_INFO_FATAL } from "components/ErrorFallback/constants";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { assertErrorAlert } from "test/utils";

import { CONTINUE } from "../constants";
import { EMAIL_USERNAME } from "./constants";
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

  userEvent.type(await screen.findByLabelText(EMAIL_USERNAME), "invalid");
  userEvent.click(screen.getByRole("button", { name: CONTINUE }));

  await assertErrorAlert(errorMessage);
});

it("shows the fatal error message for unknown errors", async () => {
  checkUsernameMock.mockRejectedValue({
    message: "unknown error",
  });
  render(<Login />, { wrapper });

  userEvent.type(await screen.findByLabelText(EMAIL_USERNAME), "invalid");
  userEvent.click(screen.getByRole("button", { name: CONTINUE }));

  await assertErrorAlert(ERROR_INFO_FATAL);
});
