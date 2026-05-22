import * as Updates from "expo-updates";
import { DevSettings } from "react-native";

// Restarts the JS bundle so freshly-saved URL overrides are picked up by the
// gRPC client and webviews. DevSettings.reload() is the path that works when
// running over a dev server (the Dev Tool build); Updates.reloadAsync() covers
// release-mode builds (e.g. staging) where DevSettings is unavailable.
export async function reloadApp(): Promise<void> {
  if (__DEV__) {
    DevSettings.reload();
    return;
  }
  await Updates.reloadAsync();
}
