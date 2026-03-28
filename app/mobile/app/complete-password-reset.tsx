import { useLocalSearchParams } from "expo-router";

import WebEmbed from "@/components/WebEmbed";

export default function CompletePasswordResetScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const path = token
    ? `/complete-password-reset?token=${encodeURIComponent(token)}`
    : "/complete-password-reset";

  return <WebEmbed path={path} />;
}
