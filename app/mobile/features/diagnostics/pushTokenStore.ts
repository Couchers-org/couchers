import AsyncStorage from "@react-native-async-storage/async-storage";

// The last Expo push token registered with the backend, persisted so diagnostics can report it.
const PUSH_TOKEN_KEY = "diagnostics.pushToken";

export async function setStoredPushToken(token: string): Promise<void> {
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
}

export async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
}
