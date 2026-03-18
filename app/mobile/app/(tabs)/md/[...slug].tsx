import { useLocalSearchParams } from "expo-router";

import WebEmbed from "@/components/WebEmbed";

export default function MarkdownScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string[] }>();
  const path = `/md/${(slug ?? []).join("/")}`;

  return <WebEmbed path={path} />;
}
