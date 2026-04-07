import { useLocalSearchParams } from "expo-router";

import WebEmbed from "@/components/WebEmbed";

export default function ConfirmEmailScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const path = token
    ? `/confirm-email?token=${encodeURIComponent(token)}`
    : "/confirm-email";

  return <WebEmbed path={path} />;
}
