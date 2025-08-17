import { expect, test } from "@playwright/test";
const uuid = crypto.randomUUID();

const NAME = "John Doe";
const USERNAME = `john_${uuid.replaceAll("-", "_")}`;

const EMAIL = `${uuid}@test.com`;
const PASSWORD = "a-valid-password";

console.log(`Username: ${USERNAME}`);
console.log(`Username: ${EMAIL}`);

const MAILDEV_URL = process.env.MAILDEV_URL || "http://maildev:1080";

const getEmailConfirmLink = async (baseURL: string) => {
  const emails = await (await fetch(`${MAILDEV_URL}/email`)).json();

  const emailHtmlContent = emails[0].html as string;

  expect(emailHtmlContent).toBeDefined();

  const confirmLinkStartIndex = emailHtmlContent.indexOf(baseURL || "");
  const confirmLinkEndIndex = emailHtmlContent.indexOf(
    '"',
    confirmLinkStartIndex
  );

  return emailHtmlContent.substring(confirmLinkStartIndex, confirmLinkEndIndex);
};

test.describe("Create account", async () => {
  test("Signup flow", async ({ page }) => {
    await fetch(`${MAILDEV_URL}/email/all`, {
      method: "delete",
    });

    await page.goto("/signup");

    await page.locator("#name").fill(NAME);
    await page.locator("#email").fill(EMAIL);
    await page.locator("button[type=submit]").click();

    await expect(
      page.getByRole("heading", { name: "Your account details" })
    ).toBeVisible();

    await page.fill("#username", USERNAME);
    await page.fill("#password", PASSWORD);
    await page.fill("#birthdate", "01-01-2000");

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

    await expect(page.getByText("Community Guidelines")).toBeVisible();

    const checkboxes = await page.getByRole("checkbox").all();

    for (let checkbox of checkboxes) {
      await checkbox.check();
    }

    await page.getByRole("button", { name: "Submit" }).click();
  });
});
