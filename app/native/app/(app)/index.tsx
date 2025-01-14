import { messagesRoute } from "@/routes";
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href={messagesRoute as any} />;
}