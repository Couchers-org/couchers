import { useRouter } from "next/router";
import { useEffect } from "react";
import { useIsNativeEmbed } from "utils/nativeLink";

/**
 * Handles navigation requests from the mobile app.
 * When the mobile app sends a MOBILE_NAVIGATE message, this component
 * uses Next.js router to navigate client-side, avoiding middleware redirects.
 */
export default function NativeMobileNavigationHandler() {
  const router = useRouter();
  const isNativeEmbed = useIsNativeEmbed();

  useEffect(() => {
    if (!isNativeEmbed) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const payload = event.data;

        // Handle both string and object payloads
        const data =
          typeof payload === "string" ? JSON.parse(payload) : payload;

        if (data?.type === "MOBILE_NAVIGATE" && data?.path) {
          // Extract locale and path (e.g., "/de/dashboard" -> locale="de", pathname="/dashboard")
          const localeMatch = data.path.match(/^\/([a-z]{2}(-[A-Z][a-z]+)?)\//);
          const locale = localeMatch ? localeMatch[1] : "en";
          const pathname = localeMatch
            ? data.path.replace(/^\/[a-z]{2}(-[A-Z][a-z]+)?/, "")
            : data.path;

          // Use the same pattern as LanguagePickerSelect to avoid double locale prefix
          // First argument is pathname (without locale), third argument is options with locale
          router.push(pathname, pathname, { locale, scroll: false });
        }
      } catch {
        // Silently ignore parsing errors from other messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isNativeEmbed, router]);

  return null;
}
