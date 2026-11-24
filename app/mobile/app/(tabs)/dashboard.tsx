import { useLocalSearchParams } from "expo-router";

import WebEmbed from "@/components/WebEmbed";
import { buildWebEmbedPath } from "@/utils/buildWebEmbedPath";

export default function DashboardScreen() {
  const params = useLocalSearchParams();
  const path = buildWebEmbedPath("/dashboard", params);

  return <WebEmbed path={path} />;
}
