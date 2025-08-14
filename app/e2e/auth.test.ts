import { test } from "@playwright/test";

const NAME = "John Doe";
const EMAIL = "private@felixbalda.com";
const PASSWORD = "testpassword";

test.describe("Create account", async () => {
  test("Placeholder test", async ({ page }) => {
    await page.goto("/signup");

    await page.fill("#name", NAME);
    await page.fill("#email", EMAIL);

    await page.click("div[type=submit]");
  });
});
