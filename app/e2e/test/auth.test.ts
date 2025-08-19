import { expect, Page, test } from "@playwright/test";

const USERNAME = process.env.TEST_USER_USERNAME || "aapeli";
const PASSWORD = process.env.TEST_USER_PASSWORD || "Aapeli's password";

test.describe("Auth", async () => {
  //  @TODO(FB) Need disposable email API to properly test the signup flow
  test.skip("Signup", async ({ page }) => {
    const uuid = crypto.randomUUID();

    const name = "Test User";
    const username = `test-user-${uuid}`;
    // @TODO(FB) Generate disposable email
    const email = `${uuid}@test.com`;
    const password = "validpassword";

    test.step("Name and email form", async () => {
      await page.goto("/signup");
      await page.locator("#name").fill(name);
      await page.locator("#email").fill(email);
      await page.locator("button[type=submit]").click();
    });

    test.step("Account details 1", async () => {
      await expect(
        page.getByRole("heading", { name: "Your account details" })
      ).toBeVisible();

      await page.fill("#username", username);
      await page.fill("#password", password);
      await page.fill("#birthdate", "01-01-2000");
    });

    test.step("Account details 2", async () => {
      const mapSearchLocator = page.locator("#map-search");

      await mapSearchLocator.fill("Berlin");
      await mapSearchLocator.focus();

      await page.keyboard.press("Enter");

      await page.waitForSelector("#map-search-listbox");

      await page.locator("#map-search-option-0").click({ force: true });

      await page
        .getByRole("combobox", { name: "Hosting status" })
        .selectOption("2");

      await page.check(`input[value="Non-binary"]`);
      await page.check(`input[name="acceptTOS"]`);

      await page.click("button[type=submit]");

      await page.waitForLoadState("networkidle");
    });

    test.step("Account details 3", async () => {
      await page
        .getByRole("combobox", { name: "Hosting status" })
        .selectOption("2");

      await page.check(`input[value="Non-binary"]`);
      await page.check(`input[name="acceptTOS"]`);

      await page.click("button[type=submit]");

      await page.waitForLoadState("networkidle");
    });

    test.step("Community Guidelines", async () => {
      await expect(page.getByText("Community Guidelines")).toBeVisible();

      const checkboxes = await page.getByRole("checkbox").all();

      expect(checkboxes).toHaveLength(4);

      for (const checkbox of checkboxes) {
        await checkbox.click();
      }

      const submitButton = page.getByRole("button", { name: "Submit" });

      await expect(submitButton).toBeEnabled();

      await submitButton.click();
    });

    test.step("Email verification", () => {
      // TODO(FB) Implement
    });
  });

  test.describe("Login", () => {
    const goToAndSubmitLoginForm = async (
      page: Page,
      username: string,
      password: string
    ) => {
      await page.goto("/login");

      await page
        .getByRole("textbox", { name: "Email/Username" })
        .fill(username);

      await page.getByRole("textbox", { name: "Password" }).fill(password);

      await page
        .getByRole("form")
        .getByRole("button", { name: "Log in" })
        .click();
    };

    test("Valid credentials", async ({ page }) => {
      await goToAndSubmitLoginForm(page, USERNAME, PASSWORD);
      await page.waitForURL("**/dashboard");
    });

    test("Invalid password", async ({ page }) => {
      await goToAndSubmitLoginForm(page, USERNAME, PASSWORD + "1");
      await expect(
        page.getByRole("alert").filter({ hasText: "Wrong password." })
      ).toBeVisible();
    });
  });
});
