import { useFeatureIsOn } from "@growthbook/growthbook-react";

export function shouldPassAllGates(): boolean {
  return process.env.NEXT_PUBLIC_EXPERIMENTATION_PASS_ALL_GATES === "1";
}

export function useGate(gateName: string): boolean {
  const isGateOn = useFeatureIsOn(gateName);
  return shouldPassAllGates() || isGateOn;
}
