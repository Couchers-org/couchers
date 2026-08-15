import { Page } from "@playwright/test";

/**
 * Everything that has to be true before a screenshot is comparable to the same
 * screenshot taken a week from now. Without this, relative timestamps, spinner
 * frames and font swaps make every diff a false positive.
 */

/** Arbitrary but fixed: dummy-data birthdays and events sit either side of it. */
export const FIXED_TIME = new Date("2026-06-15T12:00:00Z");

const KILL_ANIMATIONS_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
  }
  /* The caret blinks, which lands in screenshots as a 1px diff. */
  * { caret-color: transparent !important; }
`;

/** Call once per page, before the first navigation. */
export async function installStability(page: Page): Promise<void> {
  await page.clock.install({ time: FIXED_TIME });
}

/** Call after navigating, immediately before capturing. */
export async function settle(page: Page): Promise<void> {
  await page.addStyleTag({ content: KILL_ANIMATIONS_CSS });
  // networkidle is discouraged for assertions but is the right call for
  // screenshots: we genuinely want every avatar and map tile to have landed.
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {
    // A page with polling (e.g. the ping interval) never goes idle; the fonts
    // and images below are the part that actually matters for the capture.
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
}
