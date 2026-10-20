import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import { Platform } from "react-native";

const FORWARDED_KEY = "installReferrer.forwarded";
const TIMEOUT_MS = 2000;

export async function takeInstallReferrer(): Promise<string | null> {
  if (Platform.OS !== "android") return null;
  if (await AsyncStorage.getItem(FORWARDED_KEY)) return null;
  await AsyncStorage.setItem(FORWARDED_KEY, "1");
  const referrer = Application.getInstallReferrerAsync().catch(() => null);
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), TIMEOUT_MS),
  );
  return (await Promise.race([referrer, timeout])) || null;
}
