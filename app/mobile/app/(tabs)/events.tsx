import { useLocalSearchParams } from "expo-router";

import WebEmbed from "@/components/WebEmbed";
import { buildWebEmbedPath } from "@/utils/buildWebEmbedPath";

export default function EventsScreen() {
  const params = useLocalSearchParams();
  const path = buildWebEmbedPath("/events", params);

  return <WebEmbed path={path} />;
}
