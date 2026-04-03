import { useLocalSearchParams } from "expo-router";

import WebEmbed from "@/components/WebEmbed";

export default function CatchAllScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string[] }>();
  const path = `/${(slug ?? []).join("/")}`;

  return <WebEmbed path={path} />;
}
