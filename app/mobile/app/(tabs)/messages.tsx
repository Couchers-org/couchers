import { useLocalSearchParams } from "expo-router";

import WebEmbed from "@/components/WebEmbed";
import { buildWebEmbedPath } from "@/utils/buildWebEmbedPath";

export default function MessagesScreen() {
  const params = useLocalSearchParams();
  const path = buildWebEmbedPath("/messages", params);

  return <WebEmbed path={path} />;
}
