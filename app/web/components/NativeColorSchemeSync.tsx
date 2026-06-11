import { useColorScheme } from "@mui/material/styles";
import { useEffect, useRef } from "react";
import { useIsNativeEmbed } from "utils/nativeLink";

/**
 * Syncs the web app's color scheme to the native mobile app on initial load.
 * This ensures the native UI matches the web app's theme preference.
 */
export default function NativeColorSchemeSync() {
  const { mode } = useColorScheme();
  const isNativeEmbed = useIsNativeEmbed();
  const lastSentModeRef = useRef<typeof mode | undefined>(undefined);

  useEffect(() => {
    if (!isNativeEmbed || !window.ReactNativeWebView) return;
    // Skip if we already sent this mode — prevents a feedback loop on some
    // Android builds where Appearance.setColorScheme() fires a system event
    // that propagates back into the WebView and re-triggers this effect.
    if (lastSentModeRef.current === mode) return;
    lastSentModeRef.current = mode;

    const nativeMode = mode === "system" ? null : mode;
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: "COLOR_SCHEME_CHANGE",
        mode: nativeMode,
      }),
    );
  }, [isNativeEmbed, mode]);

  return null;
}
