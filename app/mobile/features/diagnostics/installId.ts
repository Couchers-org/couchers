import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";

import * as StickyStore from "@/modules/sticky-store";

// 128-bit hex ID generated and persisted on first launch; survives restarts/OTA, resets on reinstall.
const INSTALL_ID_KEY = "diagnostics.installId";

// Same 128-bit ID but kept in the cross-device sticky store, so it survives reinstalls and follows
// the user's iCloud/Google account to their other devices. Coarser than installId: use it to
// correlate the same account across reinstalls and devices, not to identify a single install.
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

// Best-effort platform identifiers for cross-install correlation (iOS IDFV, Android SSAID).
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
    // best-effort; never block a ping
  }
  return {};
}
