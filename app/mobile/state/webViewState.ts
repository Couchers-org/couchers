/**
 * Global ref to track the current WebView path across all WebEmbed instances.
 * This ensures we always have the correct current path, even when switching
 * between routes/tabs where each has its own WebEmbed instance.
 */
export const globalWebPathRef = { current: "/" };
