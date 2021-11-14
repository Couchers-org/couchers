import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import wrapper from "test/hookWrapper";

import Button from "./Button";

it("should try to log the error to Sentry if one is thrown when the button is clicked", async () => {
  render(
    <Button
      onClick={() => {
        throw new Error("oops");
      }}
    >
      Test button
    </Button>,
    { wrapper }
  );

  userEvent.click(await screen.findByRole("button", { name: "Test button" }));

  await waitFor(() => {
    expect(testKit.reports()).toHaveLength(1);
    expect(testKit.reports()[0]).toHaveProperty("error.message", "oops");
  });
});
