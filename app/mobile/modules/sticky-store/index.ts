import { requireNativeModule } from "expo-modules-core";

// Key/value store backed by the platform's synced storage — iCloud Keychain
// (iOS) and Block Store (Android) — so values survive reinstalls and follow the
// user to their other devices. Strings only, capped at a few KB per entry.
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
