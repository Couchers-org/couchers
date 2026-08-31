import { expect, Page } from "@playwright/test";

import { settle } from "../runner/stabilize";

/**
 * Navigation shared by recipes and flow specs. Recipes use it to reach a
 * screen; flows use it between assertions. Anything that both need to click
 * belongs here rather than in an individual recipe.
 */
export class Nav {
  constructor(private readonly page: Page) {}

  /** Navigate directly. Prefer clicking through the UI where a flow is under test. */
  async goto(pathname: string): Promise<void> {
    await this.page.goto(pathname, { waitUntil: "domcontentloaded" });
    await settle(this.page);
  }

  /** The avatar button in the top-right that opens the account menu. */
  async openUserMenu(): Promise<void> {
    const trigger = this.page.locator('[aria-controls="navigation-menu"]');
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(this.page.locator("#navigation-menu")).toBeVisible();
  }

  async toOwnProfile(): Promise<void> {
    await this.openUserMenu();
    await this.page.getByRole("link", { name: "Profile" }).click();
    await this.page.waitForURL(/\/profile/);
    await settle(this.page);
  }

  async toAccountSettings(): Promise<void> {
    await this.openUserMenu();
    await this.page.getByRole("link", { name: /account settings/i }).click();
    await this.page.waitForURL(/\/account-settings/);
    await settle(this.page);
  }
}

/**
 * Hides chrome that only exists outside production: the Next.js dev overlay,
 * the react-query devtools button and the preview-environment chip. We run
 * against `yarn dev` on a non-prod backend, so these are always present and
 * would otherwise sit in every screenshot.
 */
export async function hideDevChrome(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      nextjs-portal,
      .tsqd-parent-container,
      [data-nextjs-toast],
      [data-nextjs-dev-tools-button],
      [data-testid="environment-banner"] {
        display: none !important;
      }
    `,
  });
}
