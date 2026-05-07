/**
 * Global ref to track the last path we navigated to from mobile router.
 * Used to prevent sync loops when mobile router navigates WebView.
 */
export const lastMobileNavigationRef = { current: null as string | null };

/**
 * Callback registered by the currently-focused WebEmbed to dispatch an Escape
 * key into its WebView. Called by the tab bar on any tab press so that open
 * menus (e.g. notifications) close even when the active tab is re-tapped.
 */
export const dispatchEscapeRef = { current: null as (() => void) | null };

/**
 * Timestamp (Date.now()) of the most recent LOGIN_SUCCESS. Used by WebEmbed's
 * LOGOUT handler to distinguish real logouts from cookie-sync false alarms:
 * iOS's WKHTTPCookieStore→NSHTTPCookieStorage sync is progressively slower
 * after each login/logout cycle, so a LOGOUT fired within the grace period is
 * treated as a false alarm and the WebView is reloaded instead.
 */
export const lastLoginTimeRef = { current: 0 };
