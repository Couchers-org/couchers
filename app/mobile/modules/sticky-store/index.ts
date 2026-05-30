import { requireNativeModule } from "expo-modules-core";

// A cross-device, silently-readable key/value store. Values persist in the
// platform's synced credential storage — iCloud Keychain (iOS) and Block Store
// (Android) — so they survive app reinstalls, propagate to the user's other
// devices, and are readable on launch with no user interaction. Intended to back
// a long-lived auth/session token for "stay logged in" across devices.
//
// Strings only, and keep values small: Block Store caps an entry at a few KB.
// This is deliberately NOT secure storage — it trades the user-presence guarantee
// of a passkey/biometric for zero-interaction stickiness. Don't put anything here
// that must not silently follow the user's iCloud/Google account to a new device.
type StickyStoreModule = {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
};

const StickyStore = requireNativeModule<StickyStoreModule>("StickyStore");

export function setItem(key: string, value: string): Promise<void> {
  return StickyStore.setItem(key, value);
}

export function getItem(key: string): Promise<string | null> {
  return StickyStore.getItem(key);
}

export function removeItem(key: string): Promise<void> {
  return StickyStore.removeItem(key);
}
