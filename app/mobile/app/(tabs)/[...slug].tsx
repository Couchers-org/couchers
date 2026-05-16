import { Href, Redirect, useLocalSearchParams, useRouter } from "expo-router";

import WebEmbed from "@/components/WebEmbed";
import { detailRouteOriginRef } from "@/state/webViewState";

export default function CatchAllScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string[] }>();
  const router = useRouter();

  // slug is undefined/empty when nav state is restored without a valid path
  // (e.g. after app restart). Redirect to dashboard rather than loading
  // WEB_BASE_URL + "/" which would hit /logout and invalidate the session.
  if (!slug || slug.length === 0) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  const path = `/${slug.join("/")}`;
  return (
    <WebEmbed
      key={path}
      path={path}
      onNativeBackFallback={() => {
        const origin = detailRouteOriginRef.current;
        if (origin) {
          detailRouteOriginRef.current = null;
          router.navigate(origin as Href);
        }
      }}
    />
  );
}
