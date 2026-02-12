import { renderHook, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { ActionSheetIOS, Alert, Linking, Platform } from "react-native";

import { useImagePicker } from "@/hooks/useImagePicker";

// Mock expo-image-picker
jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
  })),
}));

describe("useImagePicker", () => {
  const mockOnResult = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("iOS platform", () => {
    beforeEach(() => {
      Object.defineProperty(Platform, "OS", { value: "ios", writable: true });
    });

    it("shows ActionSheet on iOS when pickImage is called", () => {
      const showActionSheetSpy = jest
        .spyOn(ActionSheetIOS, "showActionSheetWithOptions")
        .mockImplementation(() => {});

      const { result } = renderHook(() => useImagePicker());

      result.current.pickImage(mockOnResult);

      expect(showActionSheetSpy).toHaveBeenCalledWith(
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

      showActionSheetSpy.mockRestore();
    });

    it("cancels when cancel button is pressed on iOS", () => {
      const showActionSheetSpy = jest
        .spyOn(ActionSheetIOS, "showActionSheetWithOptions")
        .mockImplementation((options, callback) => {
          callback(0); // Cancel button
        });

      const { result } = renderHook(() => useImagePicker());

      result.current.pickImage(mockOnResult);

      expect(mockOnResult).toHaveBeenCalledWith({
        success: false,
        canceled: true,
      });

      showActionSheetSpy.mockRestore();
    });

    it("launches camera when take photo is pressed on iOS", async () => {
      (
        ImagePicker.requestCameraPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "granted",
        canAskAgain: true,
      });

      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            base64: "fake-base64-data",
            mimeType: "image/jpeg",
          },
        ],
      });

      const showActionSheetSpy = jest
        .spyOn(ActionSheetIOS, "showActionSheetWithOptions")
        .mockImplementation((options, callback) => {
          callback(1); // Take photo button
        });

      const { result } = renderHook(() => useImagePicker());

      result.current.pickImage(mockOnResult);

      await waitFor(() => {
        expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
        expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          base64: true,
        });
        expect(mockOnResult).toHaveBeenCalledWith({
          success: true,
          imageBase64: "fake-base64-data",
          mimeType: "image/jpeg",
        });
      });

      showActionSheetSpy.mockRestore();
    });

    it("launches library when choose from library is pressed on iOS", async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            base64: "fake-library-base64",
            mimeType: "image/png",
          },
        ],
      });

      const showActionSheetSpy = jest
        .spyOn(ActionSheetIOS, "showActionSheetWithOptions")
        .mockImplementation((options, callback) => {
          callback(2); // Choose from library button
        });

      const { result } = renderHook(() => useImagePicker());

      result.current.pickImage(mockOnResult);

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          base64: true,
        });
        expect(mockOnResult).toHaveBeenCalledWith({
          success: true,
          imageBase64: "fake-library-base64",
          mimeType: "image/png",
        });
      });

      showActionSheetSpy.mockRestore();
    });
  });

  describe("Android platform", () => {
    beforeEach(() => {
      Object.defineProperty(Platform, "OS", {
        value: "android",
        writable: true,
      });
    });

    it("shows Alert on Android when pickImage is called", () => {
      const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

      const { result } = renderHook(() => useImagePicker());

      result.current.pickImage(mockOnResult);

      expect(alertSpy).toHaveBeenCalledWith(
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

      alertSpy.mockRestore();
    });

    it("cancels when cancel button is pressed on Android", () => {
      const alertSpy = jest
        .spyOn(Alert, "alert")
        .mockImplementation((title, message, buttons) => {
          buttons![0].onPress!(); // Cancel button
        });

      const { result } = renderHook(() => useImagePicker());

      result.current.pickImage(mockOnResult);

      expect(mockOnResult).toHaveBeenCalledWith({
        success: false,
        canceled: true,
      });

      alertSpy.mockRestore();
    });

    it("launches camera when take photo is pressed on Android", async () => {
      (
        ImagePicker.requestCameraPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "granted",
        canAskAgain: true,
      });

      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            base64: "android-camera-base64",
            mimeType: "image/jpeg",
          },
        ],
      });

      const alertSpy = jest
        .spyOn(Alert, "alert")
        .mockImplementation((title, message, buttons) => {
          buttons![1].onPress!(); // Take photo button
        });

      const { result } = renderHook(() => useImagePicker());

      result.current.pickImage(mockOnResult);

      await waitFor(() => {
        expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
        expect(mockOnResult).toHaveBeenCalledWith({
          success: true,
          imageBase64: "android-camera-base64",
          mimeType: "image/jpeg",
        });
      });

      alertSpy.mockRestore();
    });

    it("launches library when choose from library is pressed on Android", async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            base64: "android-library-base64",
            mimeType: "image/png",
          },
        ],
      });

      const alertSpy = jest
        .spyOn(Alert, "alert")
        .mockImplementation((title, message, buttons) => {
          buttons![2].onPress!(); // Choose from library button
        });

      const { result } = renderHook(() => useImagePicker());

      result.current.pickImage(mockOnResult);

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
        expect(mockOnResult).toHaveBeenCalledWith({
          success: true,
          imageBase64: "android-library-base64",
          mimeType: "image/png",
        });
      });

      alertSpy.mockRestore();
    });
  });

  describe("camera permissions", () => {
    beforeEach(() => {
      Object.defineProperty(Platform, "OS", { value: "ios", writable: true });
    });

    it("requests camera permission before launching camera", async () => {
      (
        ImagePicker.requestCameraPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "granted",
        canAskAgain: true,
      });

      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ base64: "test", mimeType: "image/jpeg" }],
      });

      const showActionSheetSpy = jest
        .spyOn(ActionSheetIOS, "showActionSheetWithOptions")
        .mockImplementation((options, callback) => {
          callback(1); // Take photo
        });

      const { result } = renderHook(() => useImagePicker());

      result.current.pickImage(mockOnResult);

      await waitFor(() => {
        expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
      });

      showActionSheetSpy.mockRestore();
    });

    it("shows alert when camera permission is denied (can ask again)", async () => {
      (
        ImagePicker.requestCameraPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "denied",
        canAskAgain: true,
      });

      const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
      const showActionSheetSpy = jest
        .spyOn(ActionSheetIOS, "showActionSheetWithOptions")
        .mockImplementation((options, callback) => {
          callback(1); // Take photo
        });

      const { result } = renderHook(() => useImagePicker());

      result.current.pickImage(mockOnResult);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "errors.camera_permission_required",
          "errors.camera_permission_explanation",
          expect.arrayContaining([
            expect.objectContaining({ text: "common.cancel" }),
          ]),
          { cancelable: true },
        );
      });

      alertSpy.mockRestore();
      showActionSheetSpy.mockRestore();
    });

    it("shows alert with settings option when camera permission is permanently denied", async () => {
      (
        ImagePicker.requestCameraPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "denied",
        canAskAgain: false,
      });

      const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
      const showActionSheetSpy = jest
        .spyOn(ActionSheetIOS, "showActionSheetWithOptions")
        .mockImplementation((options, callback) => {
          callback(1); // Take photo
        });

      const { result } = renderHook(() => useImagePicker());

      result.current.pickImage(mockOnResult);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "errors.camera_permission_required",
          "errors.camera_permission_denied_permanently",
          expect.arrayContaining([
            expect.objectContaining({ text: "common.cancel" }),
            expect.objectContaining({ text: "common.open_settings" }),
          ]),
          { cancelable: true },
        );
      });

      alertSpy.mockRestore();
      showActionSheetSpy.mockRestore();
    });

    it("opens settings when user taps open settings button", async () => {
      (
        ImagePicker.requestCameraPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "denied",
        canAskAgain: false,
      });

      const openSettingsSpy = jest
        .spyOn(Linking, "openSettings")
        .mockResolvedValue();

      const alertSpy = jest
        .spyOn(Alert, "alert")
        .mockImplementation((title, message, buttons) => {
          // Find and press the "open settings" button
          const openSettingsButton = buttons!.find(
            (b) => b.text === "common.open_settings",
          );
          openSettingsButton?.onPress!();
        });

      const showActionSheetSpy = jest
        .spyOn(ActionSheetIOS, "showActionSheetWithOptions")
        .mockImplementation((options, callback) => {
          callback(1); // Take photo
        });

      const { result } = renderHook(() => useImagePicker());

      result.current.pickImage(mockOnResult);

      await waitFor(() => {
        expect(openSettingsSpy).toHaveBeenCalled();
        expect(mockOnResult).toHaveBeenCalledWith({
          success: false,
          canceled: true,
        });
      });

      alertSpy.mockRestore();
      showActionSheetSpy.mockRestore();
      openSettingsSpy.mockRestore();
    });
  });

  describe("image picker results", () => {
    beforeEach(() => {
      Object.defineProperty(Platform, "OS", { value: "ios", writable: true });
    });

    it("handles user canceling image selection", async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      const showActionSheetSpy = jest
        .spyOn(ActionSheetIOS, "showActionSheetWithOptions")
        .mockImplementation((options, callback) => {
          callback(2); // Choose from library
        });

      const { result } = renderHook(() => useImagePicker());

      result.current.pickImage(mockOnResult);

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith({
          success: false,
          canceled: true,
        });
      });

      showActionSheetSpy.mockRestore();
    });

    it("handles missing base64 data as error", async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            base64: undefined, // Missing base64
            mimeType: "image/jpeg",
          },
        ],
      });

      const showActionSheetSpy = jest
        .spyOn(ActionSheetIOS, "showActionSheetWithOptions")
        .mockImplementation((options, callback) => {
          callback(2); // Choose from library
        });

      const { result } = renderHook(() => useImagePicker());

      result.current.pickImage(mockOnResult);

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith({
          success: false,
          error: "Failed to get image data",
        });
      });

      showActionSheetSpy.mockRestore();
    });

    it("uses default mimeType when not provided", async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            base64: "test-base64",
            mimeType: undefined, // No mimeType
          },
        ],
      });

      const showActionSheetSpy = jest
        .spyOn(ActionSheetIOS, "showActionSheetWithOptions")
        .mockImplementation((options, callback) => {
          callback(2); // Choose from library
        });

      const { result } = renderHook(() => useImagePicker());

      result.current.pickImage(mockOnResult);

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith({
          success: true,
          imageBase64: "test-base64",
          mimeType: "image/jpeg", // Default
        });
      });

      showActionSheetSpy.mockRestore();
    });

    it("handles image picker errors", async () => {
      const testError = new Error("Camera not available");
      (
        ImagePicker.requestCameraPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "granted",
        canAskAgain: true,
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockRejectedValue(testError);

      const showActionSheetSpy = jest
        .spyOn(ActionSheetIOS, "showActionSheetWithOptions")
        .mockImplementation((options, callback) => {
          callback(1); // Take photo
        });

      const { result } = renderHook(() => useImagePicker());

      result.current.pickImage(mockOnResult);

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith({
          success: false,
          error: "Camera not available",
        });
      });

      showActionSheetSpy.mockRestore();
    });

    it("handles non-Error exceptions", async () => {
      (
        ImagePicker.requestCameraPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "granted",
        canAskAgain: true,
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockRejectedValue(
        "String error",
      );

      const showActionSheetSpy = jest
        .spyOn(ActionSheetIOS, "showActionSheetWithOptions")
        .mockImplementation((options, callback) => {
          callback(1); // Take photo
        });

      const { result } = renderHook(() => useImagePicker());

      result.current.pickImage(mockOnResult);

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith({
          success: false,
          error: "Failed to pick image",
        });
      });

      showActionSheetSpy.mockRestore();
    });
  });
});
