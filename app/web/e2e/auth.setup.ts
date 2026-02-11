import { Page, expect } from "@playwright/test";

/**
 * Log in as a user via the login page.
 * Waits for redirect to dashboard after successful login.
 */
export async function login(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  // Clear all cookies/storage to ensure a clean login state
  await page.context().clearCookies();

  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  // Dismiss Next.js error overlay if present (dev mode shows overlay for
  // non-critical fetch errors like cdn.couchers.org being unreachable)
  await dismissNextjsOverlay(page);

  // If already redirected away from login (already authenticated), we're done
  if (!page.url().includes("/login")) {
    return;
  }

  // Wait for login form to be interactive
  const usernameField = page.locator("#username");
  await expect(usernameField).toBeVisible({ timeout: 10_000 });

  // Fill in login form
  await usernameField.fill(username);
  await page.locator("#password").fill(password);

  // Dismiss overlay again in case it reappeared
  await dismissNextjsOverlay(page);

  // Submit - use force:true in case an overlay is partially blocking
  await page.locator('button[type="submit"]').click({ force: true });

  // Wait for redirect away from login page (to dashboard or wherever)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}

/**
 * Dismiss the Next.js development error overlay if it's present.
 * In dev mode, non-critical runtime errors (like failed CDN fetches)
 * can trigger an overlay that blocks interaction with the page.
 */
async function dismissNextjsOverlay(page: Page): Promise<void> {
  // The Next.js error overlay lives inside a <nextjs-portal> element
  // Try to close it by clicking the dismiss/close button
  const closeButton = page.locator(
    "nextjs-portal [aria-label='Close'], nextjs-portal button:has-text('×'), nextjs-portal button:has-text('✕')",
  );
  if (await closeButton.first().isVisible({ timeout: 1_000 }).catch(() => false)) {
    await closeButton.first().click();
    await page.waitForTimeout(300);
    return;
  }

  // Alternative: hide the overlay via JS if the close button isn't found
  await page.evaluate(() => {
    const portal = document.querySelector("nextjs-portal");
    if (portal) {
      (portal as HTMLElement).style.display = "none";
    }
  }).catch(() => {});
}

/**
 * Fill a MUI DatePicker using the calendar popup.
 * This is the most reliable way to interact with MUI DatePickers in Playwright.
 */
export async function fillDatePicker(
  page: Page,
  fieldId: string,
  date: Date,
): Promise<void> {
  // The calendar icon button is a sibling of the input inside the picker container
  // Use the fieldId to find the container, then click the calendar button
  const calendarButton = page.locator(
    `#${fieldId} ~ button, #${fieldId}-label ~ div button[aria-label]`,
  );

  // Find the button by looking for the button adjacent to the picker
  const pickerRoot = page
    .locator(`#${fieldId}`)
    .locator("xpath=ancestor::div[contains(@class, 'MuiFormControl')]");
  const openButton = pickerRoot.locator(
    'button[aria-label="Choose date"], button[class*="openPickerButton"], button',
  );

  // Click the calendar button to open the picker dialog
  await openButton.first().click();

  // Wait for the calendar popup/popper to be visible
  await page.waitForTimeout(500);

  const targetDay = date.getDate();
  const targetMonth = date.toLocaleString("en-US", { month: "long" });
  const targetYear = date.getFullYear();

  // Navigate months if needed - look for the header text
  for (let attempt = 0; attempt < 12; attempt++) {
    // Check current month displayed in the calendar header
    const headerSelector =
      ".MuiPickersCalendarHeader-label, [class*='PickersCalendarHeader'] [class*='label']";
    const headerText = await page.locator(headerSelector).last().textContent();

    if (
      headerText &&
      headerText.includes(targetMonth) &&
      headerText.includes(String(targetYear))
    ) {
      break;
    }

    // Click next month
    const nextBtn = page.locator(
      "[aria-label='Go to next month'], .MuiPickersArrowSwitcher-nextIconButton",
    );
    if (await nextBtn.last().isVisible().catch(() => false)) {
      await nextBtn.last().click();
      await page.waitForTimeout(300);
    } else {
      break;
    }
  }

  // Click the target day button
  // MUI renders days as buttons inside gridcells
  const dayButton = page
    .getByRole("gridcell", { name: String(targetDay), exact: true })
    .first();
  await dayButton.click();

  // Wait for picker to close
  await page.waitForTimeout(300);
}
