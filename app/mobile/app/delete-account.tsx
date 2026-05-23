import { useLocalSearchParams } from "expo-router";

import WebEmbed from "@/components/WebEmbed";

export default function DeleteAccountScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const path = token
    ? `/delete-account?token=${encodeURIComponent(token)}`
    : "/delete-account";

  return <WebEmbed path={path} />;
}
