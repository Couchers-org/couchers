import { expect } from "@playwright/test";

import { recipe } from "../runner/recipe";

export const authLogin = recipe({
  id: "auth/login",
  title: "Log in",
  as: "anon",
  async capture({ page, nav, shot }) {
    await nav.goto("/login");
    await expect(page.locator("#username")).toBeVisible();
    await shot("empty");

    await page.fill("#username", "example_user");
    await page.fill("#password", "hunter2");
    await shot("filled");
  },
});

export const authSignup = recipe({
  id: "auth/signup",
  title: "Sign up — first step",
  as: "anon",
  async capture({ page, nav, shot }) {
    await nav.goto("/signup");
    await expect(page.locator("#name")).toBeVisible();
    await shot("empty");
  },
});

export const authPasswordReset = recipe({
  id: "auth/password-reset",
  title: "Password reset request",
  as: "anon",
  async capture({ nav, shot }) {
    await nav.goto("/password-reset");
    await shot("empty");
  },
});
