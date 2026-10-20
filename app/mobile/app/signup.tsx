import { useLocalSearchParams } from "expo-router";

import WebEmbed from "@/components/WebEmbed";

export default function SignupScreen() {
  const { token, ht } = useLocalSearchParams<{ token?: string; ht?: string }>();
  const query = Object.entries({ token, ht })
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value!)}`)
    .join("&");
  const path = query ? `/signup?${query}` : "/signup";

  return <WebEmbed path={path} />;
}
