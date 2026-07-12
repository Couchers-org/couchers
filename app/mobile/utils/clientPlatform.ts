import { Platform } from "react-native";

export type ClientPlatform = "app_ios" | "app_android";

export function getClientPlatform(): ClientPlatform | null {
  switch (Platform.OS) {
    case "ios":
      return "app_ios";
    case "android":
      return "app_android";
    default:
      return null;
  }
}
