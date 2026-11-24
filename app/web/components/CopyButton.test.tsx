import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import CopyButton from "./CopyButton";

const { t } = i18n;

function mockClipboard(writeText: jest.Mock) {
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
}

describe("CopyButton", () => {
  it("copies the text and confirms it", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    render(<CopyButton text="https://couchers.org" />, { wrapper });

    await userEvent.click(screen.getByRole("button", { name: t("global:copy_button.a11y") }));

    expect(writeText).toHaveBeenCalledWith("https://couchers.org");
    expect(await screen.findByText(t("global:copy_button.copied_message"))).toBeVisible();
  });

  it("tells the user when copying fails", async () => {
    mockClipboard(jest.fn().mockRejectedValue(new Error("denied")));
    render(<CopyButton text="https://couchers.org" />, { wrapper });

    await userEvent.click(screen.getByRole("button", { name: t("global:copy_button.a11y") }));

    expect(await screen.findByText(t("global:copy_button.failed_message"))).toBeVisible();
    expect(screen.queryByText(t("global:copy_button.copied_message"))).not.toBeInTheDocument();
  });
});
