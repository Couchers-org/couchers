import { useFeatureIsOn } from "@growthbook/growthbook-react";

export function useGate(gateName: string): boolean {
  return useFeatureIsOn(gateName);
}
