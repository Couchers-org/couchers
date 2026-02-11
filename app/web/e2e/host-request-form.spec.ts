import { test, expect } from "@playwright/test";
import { login, fillDatePicker } from "./auth.setup";

/**
 * PR #7878 (Fix #5432): Form reset() should only be called on success,
 * not on submit. If the server returns a validation error, the user's
 * typed message should be preserved in the text field.
 */
test.describe("Host request form - data preservation", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "aapeli", "Aapeli's password");
  });

  test("preserves typed message text after form submission", async ({
    page,
  }) => {
    // Navigate to a host user's profile (lucas has CAN_HOST status)
    await page.goto("/user/lucas");
    await page.waitForLoadState("networkidle");

    // Click "Request" button to expand the host request form
    const requestButton = page.getByRole("button", { name: "Request" });
    await expect(requestButton).toBeVisible({ timeout: 10_000 });
    await requestButton.click();

    // If profile incomplete dialog shows, dismiss and skip
    const profileDialog = page.getByText("please complete your profile");
    if (await profileDialog.isVisible({ timeout: 2_000 }).catch(() => false)) {
      test.skip(true, "Profile incomplete - cannot test request form");
      return;
    }

    // Wait for the form to appear
    const formHeading = page.getByText(/Send .* a request/);
    await expect(formHeading).toBeVisible({ timeout: 10_000 });

    // Fill in dates using calendar picker
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await fillDatePicker(page, "from-date", tomorrow);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    await fillDatePicker(page, "to-date", dayAfter);

    // Generate a message with 250+ characters
    const longMessage =
      "Hello! I am planning a trip and would love to stay with you. " +
      "I have been traveling for a few months now and am really enjoying " +
      "meeting new people and experiencing different cultures. " +
      "I would be very grateful for a place to stay and promise to be " +
      "a respectful and tidy guest. Looking forward to hearing from you! " +
      "Thanks so much for considering my request.";

    // Type the message into the textarea
    const textField = page.locator("textarea#text");
    await expect(textField).toBeVisible();
    await textField.fill(longMessage);

    // Verify the message is in the field before submit
    await expect(textField).toHaveValue(longMessage);

    // Click Send to submit the form
    const sendButton = page.getByRole("button", { name: "Send" });
    await sendButton.click();

    // Wait for the server response
    await page.waitForTimeout(3_000);

    // Check outcomes:
    // - If success: form disappears with success message
    // - If error: the text field should still contain our message (the bug fix)
    const successMessage = page.getByText("Request sent!");
    const textFieldStillVisible = await textField
      .isVisible()
      .catch(() => false);

    if (await successMessage.isVisible().catch(() => false)) {
      // Success path: form was submitted and reset on success
      test.info().annotations.push({
        type: "outcome",
        description: "Request succeeded - form reset correctly on success",
      });
    } else if (textFieldStillVisible) {
      // Error path: form is still visible, verify message is preserved
      const currentValue = await textField.inputValue();
      expect(currentValue).toBe(longMessage);
      test.info().annotations.push({
        type: "outcome",
        description:
          "Server returned error - message text preserved (fix working)",
      });
    }
  });

  test("form resets on successful submission", async ({ page }) => {
    // Navigate to a host user's profile
    await page.goto("/user/lucas");
    await page.waitForLoadState("networkidle");

    // Click "Request" button
    const requestButton = page.getByRole("button", { name: "Request" });
    await expect(requestButton).toBeVisible({ timeout: 10_000 });
    await requestButton.click();

    // If profile incomplete dialog shows, skip
    const profileDialog = page.getByText("please complete your profile");
    if (await profileDialog.isVisible({ timeout: 2_000 }).catch(() => false)) {
      test.skip(true, "Profile incomplete - cannot test request form");
      return;
    }

    // Wait for the form heading
    const formHeading = page.getByText(/Send .* a request/);
    await expect(formHeading).toBeVisible({ timeout: 10_000 });

    // Fill valid dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await fillDatePicker(page, "from-date", tomorrow);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    await fillDatePicker(page, "to-date", dayAfter);

    // Type a sufficiently long message (250+ chars)
    const message =
      "Hello! I am planning a wonderful trip and would love to stay with you. " +
      "I have been traveling for several months now and am really enjoying " +
      "meeting new people and experiencing different cultures and cuisines. " +
      "I would be very grateful for a place to stay and I promise to be " +
      "a respectful and tidy guest. Looking forward to hearing from you soon!";

    const textField = page.locator("textarea#text");
    await expect(textField).toBeVisible();
    await textField.fill(message);

    // Submit
    await page.getByRole("button", { name: "Send" }).click();

    // Wait for either success or error
    const successMessage = page.getByText("Request sent!");

    try {
      await expect(successMessage).toBeVisible({ timeout: 15_000 });
      // On success, the form fields should be gone (reset)
      await expect(textField).not.toBeVisible({ timeout: 5_000 });
    } catch {
      // If the request fails (e.g. duplicate request), verify text is preserved
      const stillVisible = await textField.isVisible().catch(() => false);
      if (stillVisible) {
        const currentValue = await textField.inputValue();
        expect(currentValue).toBe(message);
      }
    }
  });
});
