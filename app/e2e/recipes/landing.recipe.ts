import { recipe } from "../runner/recipe";

export const landingHome = recipe({
  id: "landing/home",
  title: "Landing page",
  as: "anon",
  async capture({ nav, shot }) {
    await nav.goto("/");
    await shot("above-the-fold");
    await shot("full", { fullPage: true });
  },
});

export const landingFaq = recipe({
  id: "landing/faq",
  title: "FAQ",
  as: "anon",
  async capture({ nav, shot }) {
    await nav.goto("/faq");
    await shot("top");
  },
});

export const landingTerms = recipe({
  id: "landing/terms",
  title: "Terms of service",
  as: "anon",
  async capture({ nav, shot }) {
    await nav.goto("/terms");
    await shot("top");
  },
});
