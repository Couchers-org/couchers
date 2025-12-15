import { AuthenticationType } from "expo-local-authentication";
import { Platform } from "react-native";

import { useTranslation } from "@/i18n";

type GetBiometricDisplayNameParams = {
  supportedTypes: AuthenticationType[];
};

/**
 * Returns a user-friendly display name for the available biometric authentication type.
 *
 * Uses platform-appropriate terminology:
 * - iOS: "Touch ID" for fingerprint, "Face ID" for face (Apple branding)
 * - Android: Always uses generic "Biometric Login" since we can't reliably detect
 *   which specific biometric types are enrolled (vs just hardware-supported)
 */
export function getBiometricDisplayName({
  supportedTypes,
}: GetBiometricDisplayNameParams): string {
  const { t } = useTranslation();
  // AuthenticationType values from expo-local-authentication
  const FINGERPRINT = 1;
  const FACIAL_RECOGNITION = 2;

  const hasFingerprint = supportedTypes.includes(FINGERPRINT);
  const hasFace = supportedTypes.includes(FACIAL_RECOGNITION);

  if (Platform.OS === "ios") {
    // iOS uses Apple-specific branding
    // Apple devices have either Touch ID OR Face ID, not both (as of 2025)
    if (hasFingerprint) {
      return t("biometrics.touch_id");
    } else if (hasFace) {
      return t("biometrics.face_id");
    }
    return t("biometrics.biometrics_generic");
  }

  // Android: Always use generic term since supportedAuthenticationTypesAsync()
  // returns hardware capabilities, not what's actually enrolled by the user
  if (hasFingerprint || hasFace) {
    return t("biometrics.biometric_login");
  }
  return t("biometrics.biometrics_generic");
}
