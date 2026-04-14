import { useLocalSearchParams } from "expo-router";

import WebEmbed from "@/components/WebEmbed";

export default function SignupScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const path = token ? `/signup?token=${encodeURIComponent(token)}` : "/signup";

  return <WebEmbed path={path} />;
}
