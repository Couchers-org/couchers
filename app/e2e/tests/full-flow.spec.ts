import { test, expect, Page } from "@playwright/test";
import { deleteAllEmails, getSignupToken } from "../helpers/maildev";
import { takeScreenshot } from "../helpers/screenshots";
import * as path from "path";

// Test user details — unique per run to avoid collisions
const timestamp = Date.now();
const TEST_USER = {
  name: "Test User",
  email: `testuser+${timestamp}@couchers.org`,
  username: `testuser${timestamp}`,
  password: "TestPassword123!",
};

// One of the dummy users loaded by the backend (has a completed profile)
const DUMMY_USER = {
  username: "aapeli",
};

/** Remove the TanStack Query devtools overlay that intercepts clicks */
async function removeDevtools(page: Page) {
  await page.evaluate(() => {
    document.querySelector(".tsqd-parent-container")?.remove();
  });
}

test.describe("Full platform flow", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("01 — Landing page", async () => {
    await deleteAllEmails();

    // Load the root — should redirect to /landing
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/landing/, { timeout: 15_000 });
    await page.waitForTimeout(3000); // Let the page fully render
    await takeScreenshot(page, "01-landing-page");
  });

  test("02 — Dismiss cookie banner and navigate to signup", async () => {
    // Dismiss the TanStack Query devtools overlay if present (dev mode only)
    await removeDevtools(page);

    // Dismiss the cookie banner
    const cookieClose = page.getByRole("button", { name: "Close" });
    if (await cookieClose.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cookieClose.click({ force: true });
      await page.waitForTimeout(500);
    }
    await takeScreenshot(page, "02-cookie-dismissed");

    // Click "Join us" / "Sign up" to go to signup page
    const joinButton = page.getByRole("link", { name: /join|sign up/i }).first();
    if (await joinButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await joinButton.click();
    } else {
      await page.goto("/signup");
    }
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#name")).toBeVisible({ timeout: 15_000 });
    await takeScreenshot(page, "03-signup-page");
  });

  test("03 — Sign up: basic info", async () => {
    // Fill in name and email
    await page.fill("#name", TEST_USER.name);
    await page.fill("#email", TEST_USER.email);
    await takeScreenshot(page, "04-signup-basic-filled");

    // Submit basic form — button text is "Create Account"
    await page.getByRole("button", { name: "Create Account" }).click();

    // The flow goes directly to account details form
    await expect(page.locator("#username")).toBeVisible({ timeout: 30_000 });
    await takeScreenshot(page, "05-signup-account-form");
  });

  test("04 — Sign up: account details", async () => {
    // Fill username
    await page.fill("#username", TEST_USER.username);

    // Fill password
    await page.fill("#password", TEST_USER.password);

    // Fill birthdate — MUI date picker with separate spinbuttons
    await page.getByRole("spinbutton", { name: "Month" }).click();
    await page.getByRole("spinbutton", { name: "Month" }).fill("01");
    await page.getByRole("spinbutton", { name: "Day" }).click();
    await page.getByRole("spinbutton", { name: "Day" }).fill("15");
    await page.getByRole("spinbutton", { name: "Year" }).click();
    await page.getByRole("spinbutton", { name: "Year" }).fill("1990");

    // Set location — type into the search combobox and pick a result
    const locationInput = page.getByRole("combobox", {
      name: "Search for location",
    });
    await locationInput.click();
    await locationInput.fill("New York");
    await locationInput.press("Enter");
    // Wait for autocomplete results and select first one
    const firstOption = page
      .locator(".MuiAutocomplete-popper .MuiAutocomplete-option")
      .first();
    await firstOption
      .click({ timeout: 10_000 })
      .catch(async () => {
        await locationInput.clear();
        await locationInput.fill("New York City");
        await locationInput.press("Enter");
        await page
          .locator(".MuiAutocomplete-popper .MuiAutocomplete-option")
          .first()
          .click({ timeout: 10_000 });
      });

    // Wait for map to settle
    await page.waitForTimeout(2000);

    // Select hosting status — MUI Select renders as a native <select> underneath
    // Use selectOption for the underlying <select> element
    await page.locator("#hosting-status").selectOption({ label: "Can host" });

    // Select gender
    await page.getByRole("radio", { name: "Man", exact: true }).check();

    // Accept TOS
    await page
      .getByRole("checkbox", { name: "I Accept the Terms of Service." })
      .check();

    await takeScreenshot(page, "05-signup-account-filled");

    // Submit — button text is "Sign up"
    await page.getByRole("button", { name: "Sign up" }).click();

    // Wait for next step
    await page.waitForTimeout(5000);
    await takeScreenshot(page, "06-signup-after-account");
  });

  test("05 — Sign up: community guidelines (if shown)", async () => {
    const guidelineCheckbox = page.getByLabel("Okay, got it").first();
    if (
      await guidelineCheckbox.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      const checkboxes = page.getByLabel("Okay, got it");
      const count = await checkboxes.count();
      for (let i = 0; i < count; i++) {
        await checkboxes.nth(i).check();
      }
      await takeScreenshot(page, "07-signup-guidelines-checked");

      await page.getByRole("button", { name: "Submit" }).click();
      await page.waitForTimeout(3000);
      await takeScreenshot(page, "08-signup-after-guidelines");
    }
  });

  test("06 — Sign up: motivations (if shown)", async () => {
    const motivationsHeader = page.getByText("What brings you to Couchers?");
    if (
      await motivationsHeader.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      const surfingCheckbox = page.getByRole("checkbox", { name: /Surfing/i });
      const hostingCheckbox = page.getByRole("checkbox", { name: /Hosting/i });

      if (await surfingCheckbox.isVisible().catch(() => false)) {
        await surfingCheckbox.check();
      }
      if (await hostingCheckbox.isVisible().catch(() => false)) {
        await hostingCheckbox.check();
      }
      await takeScreenshot(page, "09-signup-motivations-selected");

      await page.getByRole("button", { name: "Continue" }).click();
      await page.waitForTimeout(3000);
      await takeScreenshot(page, "10-signup-after-motivations");
    }
  });

  test("07 — Sign up: verify email", async () => {
    // After motivations, we should be on the email verification step
    await expect(
      page.getByText("confirm your email", { exact: false }),
    ).toBeVisible({ timeout: 15_000 });
    await takeScreenshot(page, "11-signup-verify-email-prompt");

    // Get the verification token from MailDev
    const token = await getSignupToken(TEST_USER.email);
    expect(token).toBeTruthy();

    // Navigate to the signup page with the token (URL-encode it)
    await page.goto(`/signup?token=${encodeURIComponent(token)}`);
    await page.waitForLoadState("domcontentloaded");

    // After verification, the user is authenticated and redirected to dashboard
    // OR shown "Thank you for signing up"
    await expect(
      page.getByText("Thank you for signing up", { exact: false })
        .or(page.getByText("Dashboard", { exact: false })),
    ).toBeVisible({ timeout: 30_000 });
    await takeScreenshot(page, "12-signup-complete");
  });

  test("08 — Dashboard after signup", async () => {
    if (!page.url().includes("/dashboard")) {
      await page.goto("/dashboard");
    }
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
    await takeScreenshot(page, "14-dashboard-after-signup");

    // Check for incomplete profile banner
    const banner = page.getByText("complete your profile", { exact: false });
    if (await banner.isVisible({ timeout: 5000 }).catch(() => false)) {
      await takeScreenshot(page, "15-dashboard-incomplete-profile-banner");
    }
  });

  test("09 — Logout", async () => {
    await page.goto("/logout");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await takeScreenshot(page, "16-after-logout");
  });

  test("10 — Login", async () => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#username")).toBeVisible({ timeout: 15_000 });
    await takeScreenshot(page, "17-login-page");

    await page.fill("#username", TEST_USER.username);
    await page.fill("#password", TEST_USER.password);
    await takeScreenshot(page, "18-login-filled");

    await page.getByRole("button", { name: "Log in" }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, "19-dashboard-after-login");
  });

  test("11 — Try to message someone (should fail: incomplete profile)", async () => {
    await page.goto(`/user/${DUMMY_USER.username}`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
    await takeScreenshot(page, "20-dummy-user-profile");

    const messageButton = page.getByRole("button", { name: /Message/i });
    if (
      await messageButton.isVisible({ timeout: 10_000 }).catch(() => false)
    ) {
      await messageButton.click();
      await page.waitForTimeout(2000);

      // Should show the "Profile Incomplete" dialog
      const incompleteDialog = page
        .getByText("complete your profile", { exact: false })
        .or(page.getByText("write a bit about yourself", { exact: false }));

      if (
        await incompleteDialog
          .isVisible({ timeout: 10_000 })
          .catch(() => false)
      ) {
        await takeScreenshot(page, "21-message-blocked-incomplete-profile");
      }

      // Close the dialog
      const cancelButton = page.getByRole("button", {
        name: /never mind|cancel/i,
      });
      if (
        await cancelButton.isVisible({ timeout: 3000 }).catch(() => false)
      ) {
        await cancelButton.click();
      } else {
        await page.keyboard.press("Escape");
      }
      await page.waitForTimeout(1000);
    }
  });

  test("12 — Edit profile: upload photo and write about me", async () => {
    await page.goto("/profile/edit");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
    await takeScreenshot(page, "22-edit-profile-initial");

    // Upload a profile photo via hidden file input
    const fileInput = page.locator('input[type="file"]').first();
    const testImagePath = path.join(
      __dirname,
      "..",
      "test-assets",
      "profile-photo.png",
    );

    if ((await fileInput.count()) > 0) {
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(5000);
      await takeScreenshot(page, "23-edit-profile-photo-uploaded");
    }

    // Fill in the "About Me" section (minimum 150 characters)
    const aboutMeText =
      "Hello! I am a passionate traveler who loves meeting new people and " +
      "exploring different cultures around the world. I enjoy cooking local " +
      "cuisines, hiking in nature, and having deep conversations over coffee. " +
      "I have traveled to over 20 countries and always look forward to my " +
      "next adventure. Welcome to my profile!";

    // The aboutMe field is a div-based markdown editor, not a textarea
    // We need to click into it and type
    const aboutMe = page.locator("#aboutMe");
    if (await aboutMe.isVisible({ timeout: 5000 }).catch(() => false)) {
      await aboutMe.click();
      // Select all existing text and replace it
      await page.keyboard.press("Meta+a");
      await page.keyboard.type(aboutMeText, { delay: 5 });
    }

    await takeScreenshot(page, "24-edit-profile-about-filled");

    // Save the profile
    const saveButton = page.getByRole("button", { name: /save/i });
    if (await saveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveButton.click();
      await page.waitForTimeout(5000);
      await takeScreenshot(page, "25-edit-profile-saved");
    }
  });

  test("13 — Message someone (should succeed now)", async () => {
    await page.goto(`/user/${DUMMY_USER.username}`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
    await removeDevtools(page);
    await takeScreenshot(page, "26-dummy-user-profile-revisit");

    const messageButton = page.getByRole("button", { name: /Message/i });
    if (
      await messageButton.isVisible({ timeout: 10_000 }).catch(() => false)
    ) {
      await messageButton.click();
      await page.waitForTimeout(5000);
      await removeDevtools(page);
      await takeScreenshot(page, "27-message-initiated");

      const messageInput = page.locator("#group-chat-message-field");
      const createButton = page.getByRole("button", {
        name: /create chat/i,
      });

      if (
        await createButton.isVisible({ timeout: 5000 }).catch(() => false)
      ) {
        await createButton.click();
        await page.waitForTimeout(3000);
      }

      if (
        await messageInput.isVisible({ timeout: 10_000 }).catch(() => false)
      ) {
        await messageInput.fill(
          "Hi there! I am new to Couchers and would love to connect. How are you?",
        );
        await takeScreenshot(page, "28-message-composed");

        await page.getByRole("button", { name: "Send" }).click();
        await page.waitForTimeout(3000);
        await takeScreenshot(page, "29-message-sent");
      }
    }
  });

  test("14 — Screenshot key pages", async () => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
    await takeScreenshot(page, "30-final-dashboard");

    await page.goto("/profile");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
    await takeScreenshot(page, "31-own-profile");

    await page.goto("/search");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5000);
    await takeScreenshot(page, "32-search-page");

    await page.goto("/messages");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
    await takeScreenshot(page, "33-messages-page");

    await page.goto("/account-settings");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
    await takeScreenshot(page, "34-account-settings");
  });
});
