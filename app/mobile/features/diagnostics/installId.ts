import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";

import * as StickyStore from "@/modules/sticky-store";

const INSTALL_ID_KEY = "diagnostics.installId";

const STICKY_ID_KEY = "diagnostics.stickyId";

function randomId(): string {
  return Array.from(Crypto.getRandomBytes(16), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export async function getInstallId(): Promise<string> {
  const existing = await AsyncStorage.getItem(INSTALL_ID_KEY);
  if (existing) {
    return existing;
  }
  const id = randomId();
  await AsyncStorage.setItem(INSTALL_ID_KEY, id);
  return id;
}

export async function getStickyId(): Promise<string> {
  const existing = await StickyStore.getItem(STICKY_ID_KEY);
  if (existing) {
    return existing;
  }
  const id = randomId();
  await StickyStore.setItem(STICKY_ID_KEY, id);
  return id;
}

export async function getPlatformDeviceIds(): Promise<{
  idfv?: string;
  androidId?: string;
}> {
  try {
    if (Platform.OS === "ios") {
      const idfv = await Application.getIosIdForVendorAsync();
      return { idfv: idfv ?? undefined };
    }
    if (Platform.OS === "android") {
      return { androidId: Application.getAndroidId() ?? undefined };
    }
  } catch {
    return {};
  }
  return {};
}
