import { useColorScheme } from "@mui/material/styles";
import { useIsNativeEmbed } from "platform/nativeLink";
import { useEffect } from "react";

/**
 * Syncs the web app's color scheme to the native mobile app on initial load.
 * This ensures the native UI matches the web app's theme preference.
 */
export default function NativeColorSchemeSync() {
  const { mode } = useColorScheme();
  const isNativeEmbed = useIsNativeEmbed();

  useEffect(() => {
    if (!isNativeEmbed || !window.ReactNativeWebView) return;

    // Send the current color scheme to native app
    // "system" mode sends null so native follows system preference
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
