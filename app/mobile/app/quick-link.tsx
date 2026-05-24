import { useLocalSearchParams } from "expo-router";

import WebEmbed from "@/components/WebEmbed";

export default function QuickLinkScreen() {
  const { payload, sig } = useLocalSearchParams<{
    payload?: string;
    sig?: string;
  }>();
  const path =
    payload && sig
      ? `/quick-link?payload=${encodeURIComponent(payload)}&sig=${encodeURIComponent(sig)}`
      : "/quick-link";

  return <WebEmbed path={path} />;
}
