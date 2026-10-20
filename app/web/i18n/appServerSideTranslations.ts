import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { CONNECTIONS, GLOBAL, MESSAGES, NOTIFICATIONS, PROFILE } from "./namespaces";

const APP_SHELL_NAMESPACES = [GLOBAL, NOTIFICATIONS, PROFILE, CONNECTIONS, MESSAGES];

/**
 * Drop-in replacement for serverSideTranslations that always includes the
 * namespaces required by app-shell components (_app renders ProfileSheet,
 * AppRoute renders the navigation and PushNotificationBanner). Without this,
 * navigating between pages that have different namespace sets causes
 * translation keys to flash in those components.
 */
export async function appServerSideTranslations(locale: string, namespacesRequired: string[]) {
  return serverSideTranslations(
    locale,
    [...new Set([...namespacesRequired, ...APP_SHELL_NAMESPACES])],
    nextI18nextConfig,
  );
}
