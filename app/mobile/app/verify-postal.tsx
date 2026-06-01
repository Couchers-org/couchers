import { useLocalSearchParams } from "expo-router";

import WebEmbed from "@/components/WebEmbed";

export default function VerifyPostalScreen() {
  const { c } = useLocalSearchParams<{ c?: string }>();
  const path = c
    ? `/verify-postal?c=${encodeURIComponent(c)}`
    : "/verify-postal";

  return <WebEmbed path={path} />;
}
