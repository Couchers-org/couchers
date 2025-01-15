import { loginRoute } from "@/routes";
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href={loginRoute as any} />;
}
