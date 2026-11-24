import { useFeatureValue } from "@growthbook/growthbook-react";
import { useIsNativeEmbed } from "utils/nativeLink";

export function useShowDonations(): boolean {
  const isNativeEmbed = useIsNativeEmbed();
  const appDonationsEnabled = useFeatureValue("app_donations_enabled", false);
  return !isNativeEmbed || appDonationsEnabled;
}
