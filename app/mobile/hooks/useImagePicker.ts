import {
  ImagePickerResult,
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
} from "expo-image-picker";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ActionSheetIOS, Alert, Linking, Platform } from "react-native";

interface ImagePickResult {
  success: boolean;
  imageBase64?: string;
  mimeType?: string;
  canceled?: boolean;
  error?: string;
}

interface UseImagePickerReturn {
  pickImage: (onResult: (result: ImagePickResult) => void) => void;
}

/**
 * Custom hook for handling image picking from camera or library
 * Includes permission handling and platform-specific UI
 */
export function useImagePicker(): UseImagePickerReturn {
  const { t } = useTranslation();

  const showPicker = useCallback(
    async (
      source: "camera" | "library",
      onResult: (result: ImagePickResult) => void,
    ) => {
      try {
        let result: ImagePickerResult;

        if (source === "camera") {
          const { status, canAskAgain } = await requestCameraPermissionsAsync();
          if (status !== "granted") {
            // Permission denied - show alert with option to open Settings
            const alertTitle = t("errors.camera_permission_required");
            const alertMessage = canAskAgain
              ? t("errors.camera_permission_explanation")
              : t("errors.camera_permission_denied_permanently");

            Alert.alert(
              alertTitle,
              alertMessage,
              [
                {
                  text: t("common.cancel"),
                  style: "cancel",
                  onPress: () => onResult({ success: false, canceled: true }),
                },
                ...(canAskAgain
                  ? []
                  : [
                      {
                        text: t("common.open_settings"),
                        onPress: () => {
                          Linking.openSettings();
                          onResult({ success: false, canceled: true });
                        },
                      },
                    ]),
              ],
              { cancelable: true },
            );
            return;
          }

          result = await launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 0.8,
            base64: true,
          });
        } else {
          result = await launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 0.8,
            base64: true,
          });
        }

        if (result.canceled) {
          onResult({ success: false, canceled: true });
          return;
        }

        const asset = result.assets[0];
        if (!asset.base64) {
          throw new Error("Failed to get image data");
        }

        const mimeType = asset.mimeType || "image/jpeg";
        onResult({
          success: true,
          imageBase64: asset.base64,
          mimeType,
        });
      } catch (error) {
        if (__DEV__) {
          console.error("Image pick error:", error);
        }
        onResult({
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to pick image",
        });
      }
    },
    [t],
  );

  const pickImage = useCallback(
    (onResult: (result: ImagePickResult) => void) => {
      // Show platform-specific action sheet
      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: [
              t("common.cancel"),
              t("common.take_photo"),
              t("common.choose_from_library"),
            ],
            cancelButtonIndex: 0,
          },
          (buttonIndex) => {
            if (buttonIndex === 1) {
              showPicker("camera", onResult);
            } else if (buttonIndex === 2) {
              showPicker("library", onResult);
            } else {
              onResult({ success: false, canceled: true });
            }
          },
        );
      } else {
        // Android: use Alert
        Alert.alert(t("common.add_photo"), t("common.choose_photo_source"), [
          {
            text: t("common.cancel"),
            style: "cancel",
            onPress: () => onResult({ success: false, canceled: true }),
          },
          {
            text: t("common.take_photo"),
            onPress: () => showPicker("camera", onResult),
          },
          {
            text: t("common.choose_from_library"),
            onPress: () => showPicker("library", onResult),
          },
        ]);
      }
    },
    [showPicker, t],
  );

  return { pickImage };
}
