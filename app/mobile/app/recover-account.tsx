import { useLocalSearchParams } from "expo-router";

import WebEmbed from "@/components/WebEmbed";

export default function RecoverAccountScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const path = token
    ? `/recover-account?token=${encodeURIComponent(token)}`
    : "/recover-account";

  return <WebEmbed path={path} />;
}
