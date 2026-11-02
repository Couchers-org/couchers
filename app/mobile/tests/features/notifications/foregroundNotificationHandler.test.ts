import type { Notification } from "expo-notifications";

import { handleForegroundNotification } from "@/features/notifications/foregroundNotificationHandler";
import { currentActiveWebPathRef } from "@/state/webViewState";

function notificationFor(url?: string) {
  return {
    request: { content: { data: url ? { url } : {} } },
  } as unknown as Notification;
}

const shown = {
  shouldShowBanner: true,
  shouldShowList: true,
  shouldPlaySound: true,
  shouldSetBadge: true,
};

const quiet = {
  shouldShowBanner: false,
  shouldShowList: true,
  shouldPlaySound: false,
  shouldSetBadge: true,
};

describe("handleForegroundNotification", () => {
  afterEach(() => {
    currentActiveWebPathRef.current = null;
  });

  it("stays quiet when the user is already viewing the notification's page", async () => {
    currentActiveWebPathRef.current = "/messages/chats/42";

    await expect(
      handleForegroundNotification(
        notificationFor("https://couchers.org/messages/chats/42"),
      ),
    ).resolves.toEqual(quiet);
  });

  it("ignores query strings when comparing pages", async () => {
    currentActiveWebPathRef.current = "/messages/chats/42?tab=info";

    await expect(
      handleForegroundNotification(
        notificationFor("https://couchers.org/messages/chats/42?ref=push"),
      ),
    ).resolves.toEqual(quiet);
  });

  it("shows the notification when the user is on another page", async () => {
    currentActiveWebPathRef.current = "/dashboard";

    await expect(
      handleForegroundNotification(
        notificationFor("https://couchers.org/messages/chats/42"),
      ),
    ).resolves.toEqual(shown);
  });

  it("shows the notification for a different chat whose id starts the same", async () => {
    currentActiveWebPathRef.current = "/messages/chats/42";

    await expect(
      handleForegroundNotification(
        notificationFor("https://couchers.org/messages/chats/4"),
      ),
    ).resolves.toEqual(shown);
  });

  it("shows notifications without a URL", async () => {
    currentActiveWebPathRef.current = "/dashboard";

    await expect(
      handleForegroundNotification(notificationFor()),
    ).resolves.toEqual(shown);
  });
});
