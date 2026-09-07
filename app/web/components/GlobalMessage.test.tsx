import { GrowthBook } from "@growthbook/growthbook";
import { GrowthBookProvider } from "@growthbook/growthbook-react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GlobalMessage } from "components/GlobalMessage";
import devFlags from "feature-flags.dev.json";
import React from "react";

// Mirrors how FeatureFlagProvider loads feature-flags.dev.json: each value becomes a defaultValue.
function renderWithFlags(flags: Record<string, unknown>) {
  const growthbook = new GrowthBook();
  growthbook.initSync({
    payload: {
      features: Object.fromEntries(Object.entries(flags).map(([key, value]) => [key, { defaultValue: value }])),
    },
  });
  return render(
    <GrowthBookProvider growthbook={growthbook}>
      <GlobalMessage />
    </GrowthBookProvider>,
  );
}

beforeEach(() => localStorage.clear());

describe("GlobalMessage", () => {
  it("renders nothing for the committed dev overrides", () => {
    renderWithFlags(devFlags);
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
