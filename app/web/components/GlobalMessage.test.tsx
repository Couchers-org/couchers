import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GlobalMessage } from "components/GlobalMessage";
import devFlags from "feature-flags.dev.json";
import React from "react";
import { getHookWrapperWithClient } from "test/hookWrapper";

// Mirrors how FeatureFlagProvider loads feature-flags.dev.json: each value becomes a defaultValue.
function renderWithFlags(flags: Record<string, unknown>) {
  const { wrapper } = getHookWrapperWithClient(
    Object.fromEntries(Object.entries(flags).map(([key, value]) => [key, { defaultValue: value }])),
  );
  return render(<GlobalMessage />, { wrapper });
}

beforeEach(() => localStorage.clear());

describe("GlobalMessage", () => {
  it("renders nothing for the committed dev overrides", () => {
    renderWithFlags(devFlags);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([
    { name: "a non-string severity", value: { severity: 1, message: "boom" } },
    { name: "an unknown severity", value: { severity: "critical", message: "boom" } },
    { name: "a missing message", value: { severity: "info" } },
    { name: "a value that isn't an object", value: "boom" },
  ])("renders nothing for $name", ({ value }) => {
    renderWithFlags({ global_message: value });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keys dismissal on the message contents", async () => {
    const message = { severity: "info", message: "first" };

    const first = renderWithFlags({ global_message: message });
    await userEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    first.unmount();

    const again = renderWithFlags({ global_message: message });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    again.unmount();

    renderWithFlags({ global_message: { severity: "info", message: "second" } });
    expect(screen.getByRole("alert")).toHaveTextContent("second");
  });
});
