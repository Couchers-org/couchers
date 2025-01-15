import { groupChatsRoute } from "@/routes";
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href={groupChatsRoute as any} />;
}