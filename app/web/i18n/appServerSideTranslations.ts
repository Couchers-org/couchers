import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { CONNECTIONS, MESSAGES, NOTIFICATIONS, PROFILE } from "./namespaces";

/**
 * Drop-in replacement for serverSideTranslations that always includes the
 * namespaces required by app-shell components (ProfileSheet uses PROFILE,
 * CONNECTIONS, MESSAGES; the nav's notifications feed uses NOTIFICATIONS).
 * Without this, navigating between pages that have different namespace sets
 * causes translation keys to flash in the ProfileSheet.
 */
export async function appServerSideTranslations(locale: string, namespacesRequired: string[]) {
  return serverSideTranslations(
    locale,
    [...new Set([...namespacesRequired, PROFILE, CONNECTIONS, MESSAGES, NOTIFICATIONS])],
    nextI18nextConfig,
  );
}
