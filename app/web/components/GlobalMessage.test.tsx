import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GlobalMessage } from "components/GlobalMessage";
import devFlags from "feature-flags.dev.json";
import Sentry from "platform/sentry";
import React from "react";
import { getHookWrapperWithClient } from "test/hookWrapper";

jest.mock("platform/sentry", () => {
  const sentry = { captureException: jest.fn(), setUser: jest.fn() };
  return { __esModule: true, ...sentry, default: sentry };
});

// Mirrors how FeatureFlagProvider loads feature-flags.dev.json: each value becomes a defaultValue.
function renderWithFlags(flags: Record<string, unknown>) {
  const { wrapper } = getHookWrapperWithClient(
    Object.fromEntries(Object.entries(flags).map(([key, value]) => [key, { defaultValue: value }])),
  );
  return render(<GlobalMessage />, { wrapper });
}

beforeEach(() => localStorage.clear());

describe("GlobalMessage", () => {
  it.each([
    { name: "the committed dev overrides", flags: devFlags },
    { name: "an unset flag", flags: {} },
    { name: "an empty message", flags: { global_message: { severity: "info", message: "" } } },
    { name: "a missing message", flags: { global_message: { severity: "info" } } },
  ])("renders nothing and reports nothing for $name", ({ flags }) => {
    renderWithFlags(flags);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it.each([
    { name: "a non-string severity", value: { severity: 1, message: "boom" } },
    { name: "an unknown severity", value: { severity: "critical", message: "boom" } },
    { name: "a missing severity", value: { message: "boom" } },
    { name: "a value that isn't an object", value: "boom" },
    { name: "an array value", value: ["boom"] },
  ])("renders nothing and reports $name", ({ value }) => {
    renderWithFlags({ global_message: value });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: { component: "GlobalMessage" },
        extra: { value: JSON.stringify(value) },
      }),
    );
  });

  it("reports a malformed value once, not on every render", () => {
    const { rerender } = renderWithFlags({ global_message: { message: "boom" } });
    rerender(<GlobalMessage />);
    rerender(<GlobalMessage />);
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
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
