import { renderHook, waitFor } from "@testing-library/react-native";
import {
  ImagePickerResult,
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
} from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { ActionSheetIOS, Alert, Linking } from "react-native";

import { useImagePicker } from "@/hooks/useImagePicker";

jest.mock("expo-image-picker", () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: jest.fn(),
}));

let mockPlatformOS = "ios";

jest.mock("react-native", () => {
  const mockActionSheetIOS = {
    showActionSheetWithOptions: jest.fn(),
  };

  const mockAlert = {
    alert: jest.fn(),
  };

  const mockLinking = {
    openSettings: jest.fn(),
  };

  return {
    ActionSheetIOS: mockActionSheetIOS,
    Alert: mockAlert,
    Linking: mockLinking,
    get Platform() {
      return { OS: mockPlatformOS };
    },
  };
});

describe("useImagePicker", () => {
  const mockT = jest.fn((key: string) => key);

  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({ t: mockT });
    mockPlatformOS = "ios";
  });

  describe("pickImage - iOS", () => {
    it("shows iOS action sheet with correct options", () => {
      const { result } = renderHook(() => useImagePicker());
      const onResult = jest.fn();

      result.current.pickImage(onResult);

      expect(ActionSheetIOS.showActionSheetWithOptions).toHaveBeenCalledWith(
        {
          options: [
            "common.cancel",
            "common.take_photo",
            "common.choose_from_library",
          ],
          cancelButtonIndex: 0,
        },
        expect.any(Function),
      );
    });

    it("calls camera when take photo option is selected", async () => {
      (requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
        canAskAgain: true,
      });

      const mockImageResult: ImagePickerResult = {
        canceled: false,
        assets: [
          {
            uri: "file://photo.jpg",
            width: 100,
            height: 100,
            base64: "base64data",
            mimeType: "image/jpeg",
          },
        ],
      };
      (launchCameraAsync as jest.Mock).mockResolvedValue(mockImageResult);

      const { result } = renderHook(() => useImagePicker());
      const onResult = jest.fn();

      result.current.pickImage(onResult);

      // Get the callback passed to ActionSheetIOS
      const actionSheetCallback = (
        ActionSheetIOS.showActionSheetWithOptions as jest.Mock
      ).mock.calls[0][1];

      // Select "Take Photo" (index 1)
      actionSheetCallback(1);

      await waitFor(() => {
        expect(requestCameraPermissionsAsync).toHaveBeenCalled();
        expect(launchCameraAsync).toHaveBeenCalledWith({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          base64: true,
        });
        expect(onResult).toHaveBeenCalledWith({
          success: true,
          imageBase64: "base64data",
          mimeType: "image/jpeg",
        });
      });
    });

    it("calls library when choose from library option is selected", async () => {
      const mockImageResult: ImagePickerResult = {
        canceled: false,
        assets: [
          {
            uri: "file://photo.jpg",
            width: 100,
            height: 100,
            base64: "base64data",
            mimeType: "image/jpeg",
          },
        ],
      };
      (launchImageLibraryAsync as jest.Mock).mockResolvedValue(
        mockImageResult,
      );

      const { result } = renderHook(() => useImagePicker());
      const onResult = jest.fn();

      result.current.pickImage(onResult);

      // Get the callback passed to ActionSheetIOS
      const actionSheetCallback = (
        ActionSheetIOS.showActionSheetWithOptions as jest.Mock
      ).mock.calls[0][1];

      // Select "Choose from Library" (index 2)
      actionSheetCallback(2);

      await waitFor(() => {
        expect(launchImageLibraryAsync).toHaveBeenCalledWith({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          base64: true,
        });
        expect(onResult).toHaveBeenCalledWith({
          success: true,
          imageBase64: "base64data",
          mimeType: "image/jpeg",
        });
      });
    });

    it("handles cancel action", () => {
      const { result } = renderHook(() => useImagePicker());
      const onResult = jest.fn();

      result.current.pickImage(onResult);

      // Get the callback passed to ActionSheetIOS
      const actionSheetCallback = (
        ActionSheetIOS.showActionSheetWithOptions as jest.Mock
      ).mock.calls[0][1];

      // Select "Cancel" (index 0)
      actionSheetCallback(0);

      expect(onResult).toHaveBeenCalledWith({
        success: false,
        canceled: true,
      });
    });
  });

  describe("pickImage - Android", () => {
    beforeEach(() => {
      mockPlatformOS = "android";
    });

    it("shows Android alert with correct options", () => {
      const { result } = renderHook(() => useImagePicker());
      const onResult = jest.fn();

      result.current.pickImage(onResult);

      expect(Alert.alert).toHaveBeenCalledWith(
        "common.add_photo",
        "common.choose_photo_source",
        [
          {
            text: "common.cancel",
            style: "cancel",
            onPress: expect.any(Function),
          },
          {
            text: "common.take_photo",
            onPress: expect.any(Function),
          },
          {
            text: "common.choose_from_library",
            onPress: expect.any(Function),
          },
        ],
      );
    });

    it("handles cancel on Android", () => {
      const { result } = renderHook(() => useImagePicker());
      const onResult = jest.fn();

      result.current.pickImage(onResult);

      // Get the cancel button callback
      const cancelButton = (Alert.alert as jest.Mock).mock.calls[0][2][0];
      cancelButton.onPress();

      expect(onResult).toHaveBeenCalledWith({
        success: false,
        canceled: true,
      });
    });
  });

  describe("camera permissions", () => {
    it("requests camera permission when taking photo", async () => {
      (requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
        canAskAgain: true,
      });

      const mockImageResult: ImagePickerResult = {
        canceled: false,
        assets: [
          {
            uri: "file://photo.jpg",
            width: 100,
            height: 100,
            base64: "base64data",
            mimeType: "image/jpeg",
          },
        ],
      };
      (launchCameraAsync as jest.Mock).mockResolvedValue(mockImageResult);

      const { result } = renderHook(() => useImagePicker());
      const onResult = jest.fn();

      result.current.pickImage(onResult);

      const actionSheetCallback = (
        ActionSheetIOS.showActionSheetWithOptions as jest.Mock
      ).mock.calls[0][1];
      actionSheetCallback(1); // Take Photo

      await waitFor(() => {
        expect(requestCameraPermissionsAsync).toHaveBeenCalled();
      });
    });

    it("shows alert when camera permission is denied (can ask again)", async () => {
      (requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
        canAskAgain: true,
      });

      const { result } = renderHook(() => useImagePicker());
      const onResult = jest.fn();

      result.current.pickImage(onResult);

      const actionSheetCallback = (
        ActionSheetIOS.showActionSheetWithOptions as jest.Mock
      ).mock.calls[0][1];
      actionSheetCallback(1); // Take Photo

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "errors.camera_permission_required",
          "errors.camera_permission_explanation",
          [
            {
              text: "common.cancel",
              style: "cancel",
              onPress: expect.any(Function),
            },
          ],
          { cancelable: true },
        );
      });
    });

    it("shows alert with settings option when permission is permanently denied", async () => {
      (requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
        canAskAgain: false,
      });

      const { result } = renderHook(() => useImagePicker());
      const onResult = jest.fn();

      result.current.pickImage(onResult);

      const actionSheetCallback = (
        ActionSheetIOS.showActionSheetWithOptions as jest.Mock
      ).mock.calls[0][1];
      actionSheetCallback(1); // Take Photo

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "errors.camera_permission_required",
          "errors.camera_permission_denied_permanently",
          [
            {
              text: "common.cancel",
              style: "cancel",
              onPress: expect.any(Function),
            },
            {
              text: "common.open_settings",
              onPress: expect.any(Function),
            },
          ],
          { cancelable: true },
        );
      });
    });

    it("opens settings when user taps Open Settings button", async () => {
      (requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
        canAskAgain: false,
      });

      const { result } = renderHook(() => useImagePicker());
      const onResult = jest.fn();

      result.current.pickImage(onResult);

      const actionSheetCallback = (
        ActionSheetIOS.showActionSheetWithOptions as jest.Mock
      ).mock.calls[0][1];
      actionSheetCallback(1); // Take Photo

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Get the "Open Settings" button callback
      const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
      const openSettingsButton = alertButtons[1];
      openSettingsButton.onPress();

      expect(Linking.openSettings).toHaveBeenCalled();
      expect(onResult).toHaveBeenCalledWith({
        success: false,
        canceled: true,
      });
    });
  });

  describe("image selection", () => {
    it("returns success with image data when image is picked from camera", async () => {
      (requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
        canAskAgain: true,
      });

      const mockImageResult: ImagePickerResult = {
        canceled: false,
        assets: [
          {
            uri: "file://photo.jpg",
            width: 100,
            height: 100,
            base64: "base64data",
            mimeType: "image/jpeg",
          },
        ],
      };
      (launchCameraAsync as jest.Mock).mockResolvedValue(mockImageResult);

      const { result } = renderHook(() => useImagePicker());
      const onResult = jest.fn();

      result.current.pickImage(onResult);

      const actionSheetCallback = (
        ActionSheetIOS.showActionSheetWithOptions as jest.Mock
      ).mock.calls[0][1];
      actionSheetCallback(1); // Take Photo

      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith({
          success: true,
          imageBase64: "base64data",
          mimeType: "image/jpeg",
        });
      });
    });

    it("returns success with image data when image is picked from library", async () => {
      const mockImageResult: ImagePickerResult = {
        canceled: false,
        assets: [
          {
            uri: "file://photo.jpg",
            width: 100,
            height: 100,
            base64: "base64data",
            mimeType: "image/png",
          },
        ],
      };
      (launchImageLibraryAsync as jest.Mock).mockResolvedValue(
        mockImageResult,
      );

      const { result } = renderHook(() => useImagePicker());
      const onResult = jest.fn();

      result.current.pickImage(onResult);

      const actionSheetCallback = (
        ActionSheetIOS.showActionSheetWithOptions as jest.Mock
      ).mock.calls[0][1];
      actionSheetCallback(2); // Choose from Library

      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith({
          success: true,
          imageBase64: "base64data",
          mimeType: "image/png",
        });
      });
    });

    it("defaults to image/jpeg when mimeType is not provided", async () => {
      const mockImageResult: ImagePickerResult = {
        canceled: false,
        assets: [
          {
            uri: "file://photo.jpg",
            width: 100,
            height: 100,
            base64: "base64data",
          },
        ],
      };
      (launchImageLibraryAsync as jest.Mock).mockResolvedValue(
        mockImageResult,
      );

      const { result } = renderHook(() => useImagePicker());
      const onResult = jest.fn();

      result.current.pickImage(onResult);

      const actionSheetCallback = (
        ActionSheetIOS.showActionSheetWithOptions as jest.Mock
      ).mock.calls[0][1];
      actionSheetCallback(2); // Choose from Library

      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith({
          success: true,
          imageBase64: "base64data",
          mimeType: "image/jpeg",
        });
      });
    });

    it("returns canceled when user cancels image picker", async () => {
      const mockImageResult: ImagePickerResult = {
        canceled: true,
        assets: null,
      };
      (launchImageLibraryAsync as jest.Mock).mockResolvedValue(
        mockImageResult,
      );

      const { result } = renderHook(() => useImagePicker());
      const onResult = jest.fn();

      result.current.pickImage(onResult);

      const actionSheetCallback = (
        ActionSheetIOS.showActionSheetWithOptions as jest.Mock
      ).mock.calls[0][1];
      actionSheetCallback(2); // Choose from Library

      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith({
          success: false,
          canceled: true,
        });
      });
    });
  });

  describe("error handling", () => {
    it("returns error when base64 data is missing", async () => {
      const mockImageResult: ImagePickerResult = {
        canceled: false,
        assets: [
          {
            uri: "file://photo.jpg",
            width: 100,
            height: 100,
            // base64 is missing
          },
        ],
      };
      (launchImageLibraryAsync as jest.Mock).mockResolvedValue(
        mockImageResult,
      );

      const { result } = renderHook(() => useImagePicker());
      const onResult = jest.fn();

      result.current.pickImage(onResult);

      const actionSheetCallback = (
        ActionSheetIOS.showActionSheetWithOptions as jest.Mock
      ).mock.calls[0][1];
      actionSheetCallback(2); // Choose from Library

      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith({
          success: false,
          error: "Failed to get image data",
        });
      });
    });

    it("returns error when image picker throws", async () => {
      (launchImageLibraryAsync as jest.Mock).mockRejectedValue(
        new Error("Picker failed"),
      );

      const { result } = renderHook(() => useImagePicker());
      const onResult = jest.fn();

      result.current.pickImage(onResult);

      const actionSheetCallback = (
        ActionSheetIOS.showActionSheetWithOptions as jest.Mock
      ).mock.calls[0][1];
      actionSheetCallback(2); // Choose from Library

      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith({
          success: false,
          error: "Picker failed",
        });
      });
    });

    it("returns generic error when thrown error is not an Error instance", async () => {
      (launchImageLibraryAsync as jest.Mock).mockRejectedValue(
        "something went wrong",
      );

      const { result } = renderHook(() => useImagePicker());
      const onResult = jest.fn();

      result.current.pickImage(onResult);

      const actionSheetCallback = (
        ActionSheetIOS.showActionSheetWithOptions as jest.Mock
      ).mock.calls[0][1];
      actionSheetCallback(2); // Choose from Library

      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith({
          success: false,
          error: "Failed to pick image",
        });
      });
    });
  });
});
