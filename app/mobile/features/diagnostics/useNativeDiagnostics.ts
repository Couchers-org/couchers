import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as Updates from "expo-updates";
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
import { NativeUpdateAction, NativeUpdateInfo } from "@/proto/bugs_pb";
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
// Safety net so a slow/hung diagnostics ping can't keep the splash up forever.
const STARTUP_GATE_TIMEOUT_MS = 5_000;

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
  prompt: UpdatePrompt | null;
  dismiss: () => void;
  // True while a cold-start OTA download is in progress; render the spinner
  // overlay instead of the app shell.
  autoApplyingOta: boolean;
  // True while the cold-start decision is still pending; keep the splash up.
  startupGate: boolean;
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

  const [autoApplyingOta, setAutoApplyingOta] = useState(false);

  const [startupGate, setStartupGate] = useState(true);
  const startupGateOpenedRef = useRef(false);

  // Only the very first ping is a "cold start"; later AppState 'active' pings
  // never auto-apply, since the user is already using the app.
  const coldStartRef = useRef(true);

  const openStartupGate = useCallback(() => {
    if (startupGateOpenedRef.current) return;
    startupGateOpenedRef.current = true;
    setStartupGate(false);
  }, []);

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
    const timer = setTimeout(openStartupGate, STARTUP_GATE_TIMEOUT_MS);

    async function surface(
      info: NativeUpdateInfo.AsObject | undefined,
      now: number,
      isColdStart: boolean,
    ) {
      if (!info || !isActionable(info)) {
        setPrompt(null);
        return;
      }
      const mode = updateMode(info, new Date(now));

      // Cold-start warn + OTA: silently download + reload instead of prompting.
      // Falls through to the regular warn screen on any failure.
      if (
        isColdStart &&
        mode === "warn" &&
        info.action === NativeUpdateAction.NATIVE_UPDATE_ACTION_OTA
      ) {
        setAutoApplyingOta(true);
        try {
          const result = await Updates.fetchUpdateAsync();
          if (result.isNew) {
            await Updates.reloadAsync();
            return;
          }
          setAutoApplyingOta(false);
          return;
        } catch (error) {
          console.warn("Auto OTA failed, falling back to prompt:", error);
          setAutoApplyingOta(false);
        }
      }

      const candidate: UpdatePrompt = { info, mode };
      setPrompt((await isSuppressed(candidate, now)) ? null : candidate);
    }

    async function maybeReport() {
      const isColdStart = coldStartRef.current;
      coldStartRef.current = false;
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
          installId,
          stickyId,
          idfv: deviceIds.idfv,
          androidId: deviceIds.androidId,
          deviceName: Device.deviceName ?? undefined,
          platform: Platform.OS,
          osVersion: String(Platform.Version),
          locale: localeRef.current,
          userState: authenticatedRef.current ? "authenticated" : "logged_out",
          // Same set we report to Sentry (service/buildInfo.ts).
          appVariant,
          appVersion: Constants.expoConfig?.version ?? "unknown",
          nativeBuild: Application.nativeBuildVersion ?? "unknown",
          embeddedDisplayVersion,
          embeddedDebugVersion,
          runningDisplayVersion,
          runningDebugVersion,
          runningDebugVersionOta: runningDebugVersionOTA,
          runtimeVersion,
          updateId,
          isEmbeddedLaunch,
          launchSource: isEmbeddedLaunch ? "embedded" : "ota",
          createdAt,
          pushPermission: permission.status,
          pushToken,
          timeSinceLastOpenSeconds,
          occurred: new Date(now).toISOString(),
          // Full Notifications permission response; structured but Expo-specific, kept free-form.
          debugJson: JSON.stringify({ pushPermissionInfo: permission }),
        });

        await AsyncStorage.setItem(LAST_OPEN_KEY, String(now));
        await surface(result.updateInfo, now, isColdStart);
      } catch (error) {
        console.warn("Failed to check native status:", error);
      } finally {
        if (isColdStart) openStartupGate();
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
      clearTimeout(timer);
      subscription.remove();
    };
  }, [openStartupGate]);

  return { prompt, dismiss, autoApplyingOta, startupGate };
}
