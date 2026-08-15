import { recipe } from "../runner/recipe";

export const memberDashboard = recipe({
  id: "member/dashboard",
  title: "Dashboard",
  as: "member",
  async capture({ nav, shot }) {
    await nav.goto("/dashboard");
    await shot("default");
  },
});

export const memberProfile = recipe({
  id: "member/profile",
  title: "Own profile",
  as: "member",
  async capture({ nav, shot }) {
    await nav.goto("/dashboard");
    await nav.toOwnProfile();
    await shot("overview");
  },
});

export const memberSearch = recipe({
  id: "member/search",
  title: "Search for hosts",
  as: "member",
  async capture({ nav, shot }) {
    await nav.goto("/search");
    await shot("results");
  },
});

export const memberMessages = recipe({
  id: "member/messages",
  title: "Messages",
  as: "member",
  async capture({ nav, shot }) {
    await nav.goto("/messages");
    await shot("list");
  },
});

export const memberAccountSettings = recipe({
  id: "member/account-settings",
  title: "Account settings",
  as: "member",
  async capture({ nav, shot }) {
    await nav.goto("/dashboard");
    await nav.toAccountSettings();
    await shot("top");
  },
});
