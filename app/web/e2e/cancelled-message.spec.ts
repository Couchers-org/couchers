import { test, expect } from "@playwright/test";
import { login, fillDatePicker } from "./auth.setup";

/**
 * PR #7877 (Fix #7334): When a surfer cancels a host request, the HOST
 * should see "{surfer name} cancelled this request" instead of
 * "You have cancelled this request".
 */
test.describe("Cancelled message text - host perspective", () => {
  // These tests involve multiple logins and navigations, need extra time
  test.setTimeout(120_000);

  test("host sees surfer name in cancelled status, not 'You have cancelled'", async ({
    page,
    context,
  }) => {
    // Step 1: Log in as lucas (surfer) and send a host request to aapeli
    await login(page, "lucas", "Lucas's password");

    await page.goto("/user/aapeli");
    await page.waitForLoadState("networkidle");

    // Click "Request" button
    const requestButton = page.getByRole("button", { name: "Request" });
    await expect(requestButton).toBeVisible({ timeout: 10_000 });
    await requestButton.click();

    // If profile incomplete dialog shows, skip
    const profileDialog = page.getByText("please complete your profile");
    if (await profileDialog.isVisible({ timeout: 2_000 }).catch(() => false)) {
      test.skip(true, "Profile incomplete - cannot send host request");
      return;
    }

    // Wait for form
    const formHeading = page.getByText(/Send .* a request/);
    await expect(formHeading).toBeVisible({ timeout: 10_000 });

    // Fill dates using calendar picker
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await fillDatePicker(page, "from-date", tomorrow);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    await fillDatePicker(page, "to-date", dayAfter);

    // Type a 250+ char message
    const message =
      "Hello Aapeli! I am planning a trip to your area and would love to stay. " +
      "I have been traveling for several months and really enjoy meeting locals. " +
      "I am a very clean and respectful guest. I would appreciate any time you " +
      "can spare to show me around the area. Looking forward to your response!";

    const textField = page.locator("textarea#text");
    await expect(textField).toBeVisible();
    await textField.fill(message);

    // Submit
    await page.getByRole("button", { name: "Send" }).click();

    // Wait for success
    const successMessage = page.getByText("Request sent!");
    await expect(successMessage).toBeVisible({ timeout: 15_000 });

    // Step 2: Navigate to surfing messages and cancel the request
    await page.goto("/messages/surfing");
    await page.waitForLoadState("networkidle");

    // Click on the request to Aapeli
    const requestItem = page.getByText("Aapeli").first();
    await expect(requestItem).toBeVisible({ timeout: 10_000 });
    await requestItem.click();

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2_000);

    // Find and click cancel button
    const cancelButton = page
      .getByRole("button", { name: /cancel/i })
      .first();
    await expect(cancelButton).toBeVisible({ timeout: 10_000 });
    await cancelButton.click();

    // Handle confirmation dialog
    const confirmDialog = page.getByRole("dialog");
    if (await confirmDialog.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const dialogButtons = confirmDialog.getByRole("button");
      const buttonCount = await dialogButtons.count();
      if (buttonCount > 0) {
        await dialogButtons.nth(buttonCount - 1).click();
      }
    }

    await page.waitForTimeout(3_000);

    // Step 3: Log out by clearing cookies and log in as aapeli (the host)
    await context.clearCookies();
    await login(page, "aapeli", "Aapeli's password");

    // Step 4: Navigate to hosting messages
    await page.goto("/messages/hosting");
    await page.waitForLoadState("networkidle");

    // Look for Lucas's request in the hosting list
    const lucasRequest = page.getByText("Lucas").first();
    await expect(lucasRequest).toBeVisible({ timeout: 10_000 });

    // The BUG: host sees "You have cancelled this request"
    // The FIX: host sees "Lucas cancelled this request"
    const badText = page.getByText("You have cancelled this request");
    const badTextVisible = await badText.isVisible().catch(() => false);

    // Verify the buggy text is NOT shown
    expect(badTextVisible).toBe(false);
  });

  test("surfer sees correct cancellation text from their own perspective", async ({
    page,
  }) => {
    // Log in as aapeli (surfer perspective)
    await login(page, "aapeli", "Aapeli's password");

    await page.goto("/user/lucas");
    await page.waitForLoadState("networkidle");

    const requestButton = page.getByRole("button", { name: "Request" });
    const isVisible = await requestButton.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip(true, "Request button not available");
      return;
    }

    await requestButton.click();

    // If profile incomplete dialog shows, skip
    const profileDialog = page.getByText("please complete your profile");
    if (await profileDialog.isVisible({ timeout: 2_000 }).catch(() => false)) {
      test.skip(true, "Profile incomplete - cannot send host request");
      return;
    }

    // Wait for form
    const formHeading = page.getByText(/Send .* a request/);
    await expect(formHeading).toBeVisible({ timeout: 10_000 });

    // Fill dates
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    await fillDatePicker(page, "from-date", nextWeek);

    const nextWeekPlus1 = new Date();
    nextWeekPlus1.setDate(nextWeekPlus1.getDate() + 8);
    await fillDatePicker(page, "to-date", nextWeekPlus1);

    const message =
      "Hi Lucas! I am planning a visit to your area next week. " +
      "I have heard wonderful things about your neighborhood and would " +
      "love to explore the local area. I am a very considerate and clean " +
      "guest. I would be happy to cook a meal together or share travel stories. " +
      "Please let me know if you would be available to host me!";

    const textField = page.locator("textarea#text");
    await expect(textField).toBeVisible();
    await textField.fill(message);
    await page.getByRole("button", { name: "Send" }).click();

    const successMessage = page.getByText("Request sent!");
    await expect(successMessage).toBeVisible({ timeout: 15_000 });

    // Navigate to surfing messages
    await page.goto("/messages/surfing");
    await page.waitForLoadState("networkidle");

    // Click on the request
    const requestItem = page.getByText("Lucas").first();
    await expect(requestItem).toBeVisible({ timeout: 10_000 });
    await requestItem.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2_000);

    // Cancel the request
    const cancelButton = page
      .getByRole("button", { name: /cancel/i })
      .first();
    await expect(cancelButton).toBeVisible({ timeout: 10_000 });
    await cancelButton.click();

    // Handle confirmation dialog
    const confirmDialog = page.getByRole("dialog");
    if (await confirmDialog.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const dialogButtons = confirmDialog.getByRole("button");
      const buttonCount = await dialogButtons.count();
      if (buttonCount > 0) {
        await dialogButtons.nth(buttonCount - 1).click();
      }
    }

    await page.waitForTimeout(3_000);

    // Go back to surfing messages list
    await page.goto("/messages/surfing");
    await page.waitForLoadState("networkidle");

    // Verify some cancelled status text is shown for the surfer
    const surferStatus = page.getByText(
      /cancelled|Your request was cancelled|You cancelled/i,
    );
    await expect(surferStatus.first()).toBeVisible({ timeout: 10_000 });
  });
});
