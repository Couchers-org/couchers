/**
 * Global ref to track the current WebView path across all WebEmbed instances.
 * This ensures we always have the correct current path, even when switching
 * between routes/tabs where each has its own WebEmbed instance.
 */
export const globalWebPathRef = { current: "/" };

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
