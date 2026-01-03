import { useLocalSearchParams } from "expo-router";

import WebEmbed from "@/components/WebEmbed";
import { buildWebEmbedPath } from "@/utils/buildWebEmbedPath";

export default function SearchScreen() {
  const params = useLocalSearchParams();
  const path = buildWebEmbedPath("/search", params);

  return <WebEmbed path={path} />;
}
