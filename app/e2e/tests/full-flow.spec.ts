import { test, expect, Page } from "@playwright/test";
import { deleteAllEmails, getSignupToken } from "../helpers/maildev";
import { setDeviceName, takeScreenshot } from "../helpers/screenshots";
import * as path from "path";

// Test user details — unique per run AND per project to avoid collisions
const timestamp = Date.now();
const projectSuffix = process.env.TEST_PARALLEL_INDEX || "0";
const TEST_USER = {
  name: "Test User",
  email: `testuser+${timestamp}p${projectSuffix}@couchers.org`,
  username: `testuser${timestamp}p${projectSuffix}`,
  password: "TestPassword123!",
};

// One of the dummy users loaded by the backend (has a completed profile)
const DUMMY_USER = {
  username: "aapeli",
};

/**
 * Remove dev-mode overlays that don't exist in production.
 * These are not part of the app — they're dev tooling artifacts.
 * Hides them with CSS rather than removing to avoid re-render loops.
 */
async function cleanDevOverlays(page: Page) {
  await page.evaluate(() => {
    const style = document.getElementById("e2e-dev-overlay-hide");
    if (!style) {
      const s = document.createElement("style");
      s.id = "e2e-dev-overlay-hide";
      s.textContent = `
        nextjs-portal, .tsqd-parent-container {
          display: none !important;
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(s);
    }
    // Dismiss the "preview build" environment banner chip
    const banner = document.querySelector('.MuiChip-deletable');
    if (banner) (banner as HTMLElement).style.display = "none";
  });
}

/** Open the user menu (avatar button in top-right of nav bar) */
async function openUserMenu(page: Page) {
  await cleanDevOverlays(page);
  // The menu trigger has aria-controls="navigation-menu" or shows user initials
  const menuTrigger = page.locator('[aria-controls="navigation-menu"]');
  if (await menuTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
    await menuTrigger.click();
  } else {
    // Fallback: find button with user initials
    const initials = TEST_USER.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    await page.getByRole("button", { name: initials }).click();
  }
  await page.waitForTimeout(500);
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
    setDeviceName(test.info().project.name);
    await deleteAllEmails();

    // This is the only page.goto — starting point
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await cleanDevOverlays(page);
    await takeScreenshot(page, "01-landing-page");
  });

  test("02 — Dismiss cookie banner", async () => {
    // A real user would close the cookie banner
    const cookieClose = page.getByRole("button", { name: "Close" });
    if (await cookieClose.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cookieClose.click();
      await page.waitForTimeout(500);
    }
    await takeScreenshot(page, "02-cookie-dismissed");
  });

  test("03 — Navigate to signup", async () => {
    // Try clicking any visible "Join us" or "Sign up" link or button
    const joinLink = page.getByRole("link", { name: /join us|sign up/i }).first();
    const joinButton = page.getByRole("button", { name: /join us|sign up/i }).first();

    if (await joinLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await joinLink.click();
    } else if (await joinButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await joinButton.click();
    } else {
      // Mobile: scroll down to find the CTA
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      if (await joinLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await joinLink.click();
      } else if (await joinButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await joinButton.click();
      }
    }

    // If we ended up on the login page, click "Join us" link there
    const loginPageJoin = page.getByText("No account yet?");
    if (await loginPageJoin.isVisible({ timeout: 3000 }).catch(() => false)) {
      await takeScreenshot(page, "03a-login-page-detour");
      const signupLink = page.getByRole("link", { name: /join us/i });
      await expect(signupLink).toBeVisible({ timeout: 5000 });
      await signupLink.click();
    }

    await expect(page.locator("#name")).toBeVisible({ timeout: 15_000 });
    await takeScreenshot(page, "03-signup-page");
  });

  test("04 — Sign up: basic info", async () => {
    await page.fill("#name", TEST_USER.name);
    await page.fill("#email", TEST_USER.email);
    await takeScreenshot(page, "04-signup-basic-filled");

    await page.getByRole("button", { name: "Create Account" }).click();

    // Flow goes directly to account details form
    await expect(page.locator("#username")).toBeVisible({ timeout: 30_000 });
    await takeScreenshot(page, "05-signup-account-form");
  });

  test("05 — Sign up: account details", async () => {
    await page.fill("#username", TEST_USER.username);
    await page.fill("#password", TEST_USER.password);

    // Fill birthdate via MUI date picker spinbuttons
    await page.getByRole("spinbutton", { name: "Month" }).click();
    await page.getByRole("spinbutton", { name: "Month" }).fill("01");
    await page.getByRole("spinbutton", { name: "Day" }).click();
    await page.getByRole("spinbutton", { name: "Day" }).fill("15");
    await page.getByRole("spinbutton", { name: "Year" }).click();
    await page.getByRole("spinbutton", { name: "Year" }).fill("1990");

    // Set location via the search combobox
    const locationInput = page.getByRole("combobox", {
      name: "Search for location",
    });
    await locationInput.click();
    await locationInput.fill("New York");
    await locationInput.press("Enter");
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
    await page.waitForTimeout(2000);

    // Select hosting status
    await page.locator("#hosting-status").selectOption({ label: "Can host" });

    // Clean dev overlays before clicking — these don't exist in prod
    await cleanDevOverlays(page);

    // Select gender by clicking the label text
    await page.getByText("Man", { exact: true }).click();

    // Accept TOS by clicking the label text
    await page.getByText("I Accept the Terms of Service.").click();

    await takeScreenshot(page, "06-signup-account-filled");

    await page.getByRole("button", { name: "Sign up" }).click();

    await page.waitForTimeout(5000);
    await takeScreenshot(page, "07-signup-after-account");
  });

  test("06 — Sign up: community guidelines", async () => {
    const guidelineCheckbox = page.getByLabel("Okay, got it").first();
    if (
      await guidelineCheckbox.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      const checkboxes = page.getByLabel("Okay, got it");
      const count = await checkboxes.count();
      for (let i = 0; i < count; i++) {
        await checkboxes.nth(i).check();
      }
      await takeScreenshot(page, "08-signup-guidelines-checked");

      await page.getByRole("button", { name: "Submit" }).click();
      await page.waitForTimeout(3000);
      await takeScreenshot(page, "09-signup-after-guidelines");
    }
  });

  test("07 — Sign up: motivations", async () => {
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
      await takeScreenshot(page, "10-signup-motivations-selected");

      await page.getByRole("button", { name: "Continue" }).click();
      await page.waitForTimeout(3000);
      await takeScreenshot(page, "11-signup-after-motivations");
    }
  });

  test("08 — Sign up: verify email", async () => {
    await expect(
      page.getByText("confirm your email", { exact: false }),
    ).toBeVisible({ timeout: 15_000 });
    await takeScreenshot(page, "12-signup-verify-email-prompt");

    const token = await getSignupToken(TEST_USER.email);
    expect(token).toBeTruthy();

    // The email contains a link — simulate clicking it by navigating to the URL
    // This is the one place we navigate directly, since it's an email link
    await page.goto(`/signup?token=${encodeURIComponent(token)}`, {
      waitUntil: "domcontentloaded",
    });

    // After verification, user is authenticated → redirected to dashboard
    await expect(
      page
        .getByText("Thank you for signing up", { exact: false })
        .or(page.getByText("Dashboard", { exact: false })),
    ).toBeVisible({ timeout: 30_000 });
    await takeScreenshot(page, "13-signup-complete");
  });

  test("09 — Dashboard after signup", async () => {
    // Should already be on dashboard after email verification redirect
    await page.waitForTimeout(3000);
    await cleanDevOverlays(page);

    // Dismiss the push notifications banner if present
    // It's an MUI Alert with an onClose button (aria-label="Close")
    const notifBanner = page.getByRole("alert").filter({ hasText: /push notifications/i });
    if (await notifBanner.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notifBanner.getByRole("button", { name: "Close" }).click();
      await page.waitForTimeout(500);
    }

    await takeScreenshot(page, "14-dashboard-after-signup");
  });

  test("10 — Logout via user menu", async () => {
    // Dismiss the preview banner if it might overlap menu items
    const previewBanner = page.getByText("This is a preview build", { exact: false });
    if (await previewBanner.isVisible({ timeout: 2000 }).catch(() => false)) {
      const closeBanner = previewBanner.locator("..").getByRole("img").last();
      if (await closeBanner.isVisible().catch(() => false)) {
        await closeBanner.click();
        await page.waitForTimeout(500);
      }
    }

    await openUserMenu(page);
    await takeScreenshot(page, "15-user-menu-open");

    // Scroll "Log out" into view and click it
    const logoutLink = page.getByText("Log out", { exact: true });
    await expect(logoutLink).toBeVisible({ timeout: 5000 });
    await logoutLink.scrollIntoViewIfNeeded();
    await logoutLink.click();

    // Wait for logout to complete — page should show "Log in" or redirect to landing
    await page.waitForTimeout(5000);
    await cleanDevOverlays(page);
    await takeScreenshot(page, "16-after-logout");
  });

  test("11 — Navigate to login and log in", async () => {
    // On the logged-out page, click "Log in" button in the nav
    const loginButton = page.getByRole("link", { name: "Log in" }).or(
      page.getByRole("button", { name: "Log in" }),
    );
    await expect(loginButton.first()).toBeVisible({ timeout: 10_000 });
    await loginButton.first().click();

    await expect(page.locator("#username")).toBeVisible({ timeout: 15_000 });
    await takeScreenshot(page, "17-login-page");

    await page.fill("#username", TEST_USER.username);
    await page.fill("#password", TEST_USER.password);
    await takeScreenshot(page, "18-login-filled");

    await page.getByRole("button", { name: "Log in" }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await page.waitForTimeout(2000);
    await cleanDevOverlays(page);
    await takeScreenshot(page, "19-dashboard-after-login");
  });

  test("12 — Navigate to a user profile and try to message (incomplete profile)", async () => {
    // Click "Search" in nav (link on desktop, button on mobile bottom nav)
    const searchNav = page.getByRole("link", { name: /search/i }).first().or(
      page.getByRole("button", { name: /search/i }).first(),
    );
    await expect(searchNav.first()).toBeVisible({ timeout: 10_000 });
    await searchNav.first().click();
    await page.waitForTimeout(3000);
    await cleanDevOverlays(page);
    await takeScreenshot(page, "20-search-page");

    // Navigate to the dummy user's profile — simulates clicking a link from
    // search results or a shared profile URL
    try {
      await page.goto(`/user/${DUMMY_USER.username}`, {
        waitUntil: "domcontentloaded",
      });
    } catch (e: any) {
      if (!e.message?.includes("interrupted by another navigation")) throw e;
      await page.waitForLoadState("domcontentloaded");
    }
    // If we got redirected away (WebKit race), retry
    if (!page.url().includes(`/user/${DUMMY_USER.username}`)) {
      await page.goto(`/user/${DUMMY_USER.username}`, {
        waitUntil: "domcontentloaded",
      });
    }
    await page.waitForTimeout(3000);
    await cleanDevOverlays(page);
    await takeScreenshot(page, "21-dummy-user-profile");

    // Click the Message button
    const messageButton = page.getByRole("button", { name: "Message", exact: true });
    await expect(messageButton).toBeVisible({ timeout: 15_000 });
    await messageButton.click();
    await page.waitForTimeout(2000);

    // Should show the "Profile Incomplete" dialog
    const incompleteDialog = page
      .getByText("complete your profile", { exact: false })
      .or(page.getByText("write a bit about yourself", { exact: false }));

    if (
      await incompleteDialog.isVisible({ timeout: 10_000 }).catch(() => false)
    ) {
      await takeScreenshot(page, "22-message-blocked-incomplete-profile");
    }

    // Close the dialog
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);
  });

  test("13 — Navigate to edit profile, upload photo and write about me", async () => {
    // Navigate to own profile via user menu
    await openUserMenu(page);
    const profileLink = page.getByRole("link", { name: "Profile" });
    await expect(profileLink).toBeVisible({ timeout: 5000 });
    await profileLink.click();
    await page.waitForTimeout(3000);
    await cleanDevOverlays(page);
    await takeScreenshot(page, "23-own-profile");

    // Click "Edit Profile" button on own profile page
    const editButton = page.getByRole("link", { name: /edit profile/i }).first();
    await expect(editButton).toBeVisible({ timeout: 10_000 });
    await editButton.click();
    // Wait for the edit page to load — should have the aboutMe editor
    await expect(page.locator("#aboutMe")).toBeVisible({ timeout: 15_000 });
    await takeScreenshot(page, "24-edit-profile-initial");

    // Upload a profile photo via the file input
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
      await takeScreenshot(page, "25-edit-profile-photo-uploaded");
    }

    // Fill in the "About Me" section (minimum 150 characters)
    const aboutMeText =
      "Hello! I am a passionate traveler who loves meeting new people and " +
      "exploring different cultures around the world. I enjoy cooking local " +
      "cuisines, hiking in nature, and having deep conversations over coffee. " +
      "I have traveled to over 20 countries and always look forward to my " +
      "next adventure. Welcome to my profile!";

    // The aboutMe field is a div-based markdown editor
    const aboutMe = page.locator("#aboutMe");
    if (await aboutMe.isVisible({ timeout: 5000 }).catch(() => false)) {
      await aboutMe.click();
      await page.keyboard.press("Meta+a");
      await page.keyboard.type(aboutMeText, { delay: 5 });
    }

    await takeScreenshot(page, "26-edit-profile-about-filled");

    // Click save
    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeVisible({ timeout: 5000 });
    await saveButton.click();
    await page.waitForTimeout(5000);
    await takeScreenshot(page, "27-edit-profile-saved");
  });

  test("14 — Message someone (should succeed now)", async () => {
    // Navigate back to the dummy user's profile
    try {
      await page.goto(`/user/${DUMMY_USER.username}`, {
        waitUntil: "domcontentloaded",
      });
    } catch (e: any) {
      if (!e.message?.includes("interrupted by another navigation")) throw e;
      await page.waitForLoadState("domcontentloaded");
    }
    await page.waitForTimeout(3000);
    await cleanDevOverlays(page);
    await takeScreenshot(page, "28-dummy-user-profile-revisit");

    // Click the Message button — should work now with completed profile
    const messageButton = page.getByRole("button", { name: "Message", exact: true });
    await expect(messageButton).toBeVisible({ timeout: 10_000 });
    await messageButton.click();
    await page.waitForTimeout(5000);
    await cleanDevOverlays(page);
    await takeScreenshot(page, "29-message-initiated");

    // Look for the message input
    const messageInput = page.locator("#group-chat-message-field");
    const createButton = page.getByRole("button", { name: /create chat/i });

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
      await takeScreenshot(page, "30-message-composed");

      await page.getByRole("button", { name: "Send" }).click();
      await page.waitForTimeout(3000);
      await takeScreenshot(page, "31-message-sent");
    }
  });

  test("15 — Screenshot key pages via navigation", async () => {
    // Dashboard — click the logo or "Home" in bottom nav
    const homeLink = page.getByRole("link", { name: /home/i }).first().or(
      page.getByRole("link", { name: /dashboard/i }).first(),
    );
    if (await homeLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await homeLink.click();
    } else {
      // Click the Couchers logo
      await page.locator('a[href="/dashboard"]').first().click();
    }
    await page.waitForTimeout(3000);
    await cleanDevOverlays(page);
    await takeScreenshot(page, "32-final-dashboard");

    // Messages — link on desktop, button on mobile bottom nav
    const messagesNav = page.getByRole("link", { name: /messages/i }).first().or(
      page.getByRole("button", { name: /messages/i }).first(),
    );
    await expect(messagesNav.first()).toBeVisible({ timeout: 5000 });
    await messagesNav.first().click();
    await page.waitForTimeout(3000);
    await cleanDevOverlays(page);
    await takeScreenshot(page, "33-messages-page");

    // Account settings via user menu
    await openUserMenu(page);
    const settingsLink = page.getByRole("link", {
      name: /account settings/i,
    });
    await expect(settingsLink).toBeVisible({ timeout: 5000 });
    await settingsLink.click();
    await page.waitForTimeout(3000);
    await cleanDevOverlays(page);
    await takeScreenshot(page, "34-account-settings");
  });
});
