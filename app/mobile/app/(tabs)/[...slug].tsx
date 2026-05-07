import { Redirect, useLocalSearchParams } from "expo-router";

import WebEmbed from "@/components/WebEmbed";

export default function CatchAllScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string[] }>();

  // slug is undefined/empty when nav state is restored without a valid path
  // (e.g. after app restart). Redirect to dashboard rather than loading
  // WEB_BASE_URL + "/" which would hit /logout and invalidate the session.
  if (!slug || slug.length === 0) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  const path = `/${slug.join("/")}`;
  return <WebEmbed path={path} />;
}
