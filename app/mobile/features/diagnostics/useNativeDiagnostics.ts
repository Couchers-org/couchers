import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as Updates from "expo-updates";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AppState, AppStateStatus, Platform } from "react-native";

import { useAuthContext } from "@/features/auth/AuthContext";
import {
  getInstallId,
  getPlatformDeviceIds,
  getStickyId,
} from "@/features/diagnostics/installId";
import { getStoredPushToken } from "@/features/diagnostics/pushTokenStore";
import { NativeUpdateAction } from "@/proto/bugs_pb";
import { checkNativeStatus } from "@/service/checkNativeStatus";

const LAST_OPEN_KEY = "diagnostics.lastOpenAt";
const PING_THROTTLE_MS = 30 * 60 * 1000;

// Reports a diagnostics snapshot to CheckNativeStatus on cold start and each foreground
// transition, throttled to at most once per PING_THROTTLE_MS. Best-effort and fire-and-forget.
export function useNativeDiagnostics(): void {
  const { authenticated } = useAuthContext();
  const { i18n } = useTranslation();

  // Refs so the AppState listener sees current values without re-subscribing.
  const authenticatedRef = useRef(authenticated);
  authenticatedRef.current = authenticated;
  const localeRef = useRef(i18n.language);
  localeRef.current = i18n.language;

  useEffect(() => {
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

        const [installId, stickyId, deviceIds, pushToken, permission] =
          await Promise.all([
            getInstallId(),
            getStickyId().catch(() => undefined),
            getPlatformDeviceIds(),
            getStoredPushToken(),
            Notifications.getPermissionsAsync(),
          ]);

        const result = await checkNativeStatus({
          installId,
          stickyId,
          idfv: deviceIds.idfv,
          androidId: deviceIds.androidId,
          userState: authenticatedRef.current ? "authenticated" : "logged_out",
          appVersion: Constants.expoConfig?.version ?? "unknown",
          gitHash:
            (Constants.expoConfig?.extra as { gitHash?: string } | undefined)
              ?.gitHash ?? "unknown",
          nativeBuild: Application.nativeBuildVersion ?? "unknown",
          platform: Platform.OS,
          osVersion: String(Platform.Version),
          deviceName: Device.deviceName ?? undefined,
          locale: localeRef.current,
          otaUpdateId: Updates.updateId ?? undefined,
          runtimeVersion: Updates.runtimeVersion ?? undefined,
          otaChannel: Updates.channel ?? undefined,
          isEmbedded: Updates.isEmbeddedLaunch,
          otaCreatedAt: Updates.createdAt?.toISOString() ?? undefined,
          pushPermission: permission.status,
          pushToken: pushToken ?? undefined,
          timeSinceLastOpenSeconds,
          occurred: new Date(now).toISOString(),
        });

        await AsyncStorage.setItem(LAST_OPEN_KEY, String(now));

        // TODO: act on result (fetch OTA, nag, or block) per action/required/actBy.
        if (
          result.action !== NativeUpdateAction.NATIVE_UPDATE_ACTION_NONE &&
          result.action !== NativeUpdateAction.NATIVE_UPDATE_ACTION_UNSPECIFIED
        ) {
          console.log("Native status update prompt:", result);
        }
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
}
