/**
 * Global ref to track the last path we navigated to from mobile router.
 * Used to prevent sync loops when mobile router navigates WebView.
 */
export const lastMobileNavigationRef = { current: null as string | null };

/**
 * The tab path (e.g. "/search?location=...") that most recently triggered a
 * navigation to a [..slug] detail route. Read by the detail WebEmbed to
 * navigate back to the originating tab when the WebView has no history.
 */
export const detailRouteOriginRef = { current: null as string | null };

/**
 * Callback registered by the currently-focused WebEmbed to dispatch an Escape
 * key into its WebView. Called by the tab bar on any tab press so that open
 * menus (e.g. notifications) close even when the active tab is re-tapped.
 */
export const dispatchEscapeRef = { current: null as (() => void) | null };

/**
 * The web path currently visible in the active WebView tab
 * (e.g. "/en/messages/chats/123"). Used by the foreground notification handler
 * to suppress banners when the user is already viewing the relevant content.
 * Updated by useWebNavigation on every navigation state change.
 */
export const currentActiveWebPathRef = { current: null as string | null };

/**
 * Timestamp (Date.now()) of the most recent LOGIN_SUCCESS. Used by WebEmbed's
 * LOGOUT handler to distinguish real logouts from cookie-sync false alarms:
 * iOS's WKHTTPCookieStore→NSHTTPCookieStorage sync is progressively slower
 * after each login/logout cycle, so a LOGOUT fired within the grace period is
 * treated as a false alarm and the WebView is reloaded instead.
 */
export const lastLoginTimeRef = { current: 0 };
