import { useLocalSearchParams } from "expo-router";

import WebEmbed from "@/components/WebEmbed";
import { buildWebEmbedPath } from "@/utils/buildWebEmbedPath";

export default function CommunitiesScreen() {
  const params = useLocalSearchParams();
  const path = buildWebEmbedPath("/communities", params);

  return <WebEmbed path={path} />;
}
