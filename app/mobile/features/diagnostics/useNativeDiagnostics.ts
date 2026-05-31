import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, AppStateStatus, Platform } from "react-native";

import { useAuthContext } from "@/features/auth/AuthContext";
import {
  getInstallId,
  getPlatformDeviceIds,
  getStickyId,
} from "@/features/diagnostics/installId";
import {
  isActionable,
  updateMode,
  UpdatePrompt,
} from "@/features/diagnostics/updateDecision";
import { NativeUpdateInfo } from "@/proto/bugs_pb";
import {
  appVariant,
  createdAt,
  embeddedDebugVersion,
  embeddedDisplayVersion,
  isEmbeddedLaunch,
  runningDebugVersion,
  runningDebugVersionOTA,
  runningDisplayVersion,
  runtimeVersion,
  updateId,
} from "@/service/buildInfo";
import { checkNativeStatus } from "@/service/checkNativeStatus";

const LAST_OPEN_KEY = "diagnostics.lastOpenAt";
const LAST_NAG_KEY = "diagnostics.lastNagDismissedAt";
const PING_THROTTLE_MS = 5 * 60 * 1000;

// Cleared on process restart, so dismissing a session-scoped prompt suppresses it
// until the next cold start.
let warnDismissedThisSession = false;
let nagDismissedThisSession = false;

// Decides whether a freshly-received decision should actually be shown, honouring
// the dismissal rules each mode carries.
async function isSuppressed(
  prompt: UpdatePrompt,
  now: number,
): Promise<boolean> {
  switch (prompt.mode) {
    case "block":
      return false;
    case "warn":
      return warnDismissedThisSession;
    case "nag": {
      const interval = prompt.info.nagInterval?.seconds ?? 0;
      if (interval <= 0) return nagDismissedThisSession;
      const lastRaw = await AsyncStorage.getItem(LAST_NAG_KEY);
      const last = lastRaw ? Number(lastRaw) : null;
      return last !== null && now - last < interval * 1000;
    }
  }
}

// Records a dismissal so isSuppressed() hides the prompt for the right duration.
async function recordDismissal(
  prompt: UpdatePrompt,
  now: number,
): Promise<void> {
  switch (prompt.mode) {
    case "block":
      return;
    case "warn":
      warnDismissedThisSession = true;
      return;
    case "nag":
      if ((prompt.info.nagInterval?.seconds ?? 0) <= 0) {
        nagDismissedThisSession = true;
      } else {
        await AsyncStorage.setItem(LAST_NAG_KEY, String(now));
      }
  }
}

export interface NativeDiagnostics {
  // The update prompt to render right now, or null when nothing should be shown.
  prompt: UpdatePrompt | null;
  // Dismisses the current prompt (no-op for non-dismissible "block" prompts).
  dismiss: () => void;
}

// Reports a diagnostics snapshot to CheckNativeStatus on cold start and each foreground
// transition (throttled to at most once per PING_THROTTLE_MS), and surfaces the backend's
// update decision as a prompt to render. The ping itself is best-effort and fire-and-forget.
export function useNativeDiagnostics(): NativeDiagnostics {
  const { authenticated } = useAuthContext();
  const { i18n } = useTranslation();

  const [prompt, setPrompt] = useState<UpdatePrompt | null>(null);
  const promptRef = useRef<UpdatePrompt | null>(null);
  promptRef.current = prompt;

  // Refs so the AppState listener sees current values without re-subscribing.
  const authenticatedRef = useRef(authenticated);
  authenticatedRef.current = authenticated;
  const localeRef = useRef(i18n.language);
  localeRef.current = i18n.language;

  const dismiss = useCallback(() => {
    const current = promptRef.current;
    if (!current) return;
    setPrompt(null);
    recordDismissal(current, Date.now()).catch(() => {});
  }, []);

  useEffect(() => {
    async function surface(
      info: NativeUpdateInfo.AsObject | undefined,
      now: number,
    ) {
      if (!info || !isActionable(info)) {
        setPrompt(null);
        return;
      }
      const candidate: UpdatePrompt = {
        info,
        mode: updateMode(info, new Date(now)),
      };
      setPrompt((await isSuppressed(candidate, now)) ? null : candidate);
    }

    async function maybeReport() {
      try {
        const now = Date.now();
        const lastOpenRaw = await AsyncStorage.getItem(LAST_OPEN_KEY);
        const lastOpenAt = lastOpenRaw ? Number(lastOpenRaw) : null;

        if (lastOpenAt && now - lastOpenAt < PING_THROTTLE_MS) {
          return;
        }

        const timeSinceLastOpenSeconds = lastOpenAt
          ? (now - lastOpenAt) / 1000
          : undefined;

        const [installId, stickyId, deviceIds, permission] = await Promise.all([
          getInstallId(),
          getStickyId().catch(() => undefined),
          getPlatformDeviceIds(),
          Notifications.getPermissionsAsync(),
        ]);

        // The live Expo push token — the address this device would actually
        // receive on. Fetched only when permission is already granted, so it
        // never triggers a prompt; best-effort, never blocks the ping.
        let pushToken: string | undefined;
        if (permission.granted && Device.isDevice) {
          const projectId =
            Constants.expoConfig?.extra?.eas?.projectId ??
            Constants.easConfig?.projectId ??
            process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
          if (projectId) {
            try {
              pushToken = (
                await Notifications.getExpoPushTokenAsync({ projectId })
              ).data;
            } catch {
              pushToken = undefined;
            }
          }
        }

        const result = await checkNativeStatus({
          // Device / install identity
          installId,
          stickyId,
          idfv: deviceIds.idfv,
          androidId: deviceIds.androidId,
          deviceName: Device.deviceName ?? undefined,
          platform: Platform.OS,
          osVersion: String(Platform.Version),
          locale: localeRef.current,
          userState: authenticatedRef.current ? "authenticated" : "logged_out",
          // Build identity — the same set we report to Sentry (service/buildInfo.ts):
          // the embedded store build, the running (possibly OTA) bundle, and the
          // runtimeVersion/channel that decide which OTAs apply.
          appVariant,
          appVersion: Constants.expoConfig?.version ?? "unknown",
          nativeBuild: Application.nativeBuildVersion ?? "unknown",
          embeddedDisplayVersion,
          embeddedDebugVersion,
          runningDisplayVersion,
          runningDebugVersion,
          runningDebugVersionOTA,
          runtimeVersion,
          updateId,
          isEmbeddedLaunch,
          launchSource: isEmbeddedLaunch ? "embedded" : "ota",
          createdAt,
          // Push + timing
          pushPermission: permission.status,
          pushPermissionInfo: permission,
          pushToken,
          timeSinceLastOpenSeconds,
          occurred: new Date(now).toISOString(),
        });

        await AsyncStorage.setItem(LAST_OPEN_KEY, String(now));
        await surface(result.updateInfo, now);
      } catch (error) {
        console.warn("Failed to check native status:", error);
      }
    }

    maybeReport();

    const subscription = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "active") {
          maybeReport();
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return { prompt, dismiss };
}
