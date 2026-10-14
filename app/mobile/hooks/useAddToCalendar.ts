import {
  createEventInCalendarAsync,
  requestCalendarPermissionsAsync,
} from "expo-calendar";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, Platform } from "react-native";

// Sent by the web app's sendNativeAddToCalendar (app/web/utils/nativeLink.ts)
export interface CalendarEventData {
  title: string;
  startDate: string;
  endDate: string;
  timeZone: string;
  location: string;
  notes: string;
}

// From iOS 17 the system's add-event sheet runs out of process and needs no permission
function needsCalendarPermission() {
  return Platform.OS === "ios" && parseInt(String(Platform.Version), 10) < 17;
}

/**
 * Opens the OS's own "new event" screen prefilled with the event,
 * so the user picks the calendar and saves it themselves
 */
export function useAddToCalendar() {
  const { t } = useTranslation();

  const addToCalendar = useCallback(
    async (event: CalendarEventData) => {
      try {
        if (needsCalendarPermission()) {
          const { status, canAskAgain } =
            await requestCalendarPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              t("errors.calendar_permission_required"),
              canAskAgain
                ? t("errors.calendar_permission_explanation")
                : t("errors.calendar_permission_denied_permanently"),
              [
                { text: t("common.cancel"), style: "cancel" },
                ...(canAskAgain
                  ? []
                  : [
                      {
                        text: t("common.open_settings"),
                        onPress: () => Linking.openSettings(),
                      },
                    ]),
              ],
              { cancelable: true },
            );
            return;
          }
        }

        await createEventInCalendarAsync({
          title: event.title,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          timeZone: event.timeZone,
          location: event.location,
          notes: event.notes,
        });
      } catch (error) {
        // e.g. no calendar app installed on Android
        if (__DEV__) {
          console.error("Add to calendar error:", error);
        }
        Alert.alert(t("errors.add_to_calendar_failed"));
      }
    },
    [t],
  );

  return { addToCalendar };
}
