import { GrowthBook } from "@growthbook/growthbook";
import { GrowthBookContext } from "@growthbook/growthbook-react";
import { useContext } from "react";

// Flags are evaluated locally by the GrowthBook SDK (see features/experimentation/WithFlags.tsx).
// We read the context directly rather than via GrowthBook's hooks so these work on pages not wrapped
// in <WithFlags> too - there growthbook is undefined and the in-code default is returned. Always
// pass a default; it's also what's returned before flags finish loading.

export type JsonValue =
  | boolean
  | number
  | string
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export function shouldPassAllGates(): boolean {
  return process.env.NEXT_PUBLIC_EXPERIMENTATION_PASS_ALL_GATES === "1";
}

function useGrowthBookOrUndefined(): GrowthBook | undefined {
  return useContext(GrowthBookContext).growthbook as GrowthBook | undefined;
}

export function useGate(gateName: string): boolean {
  const growthbook = useGrowthBookOrUndefined();
  return shouldPassAllGates() || (growthbook?.isOn(gateName) ?? false);
}

export function useFeatureValue<T extends JsonValue>(
  featureName: string,
  defaultValue: T,
): T {
  const growthbook = useGrowthBookOrUndefined();
  return (
    growthbook
      ? growthbook.getFeatureValue(featureName, defaultValue)
      : defaultValue
  ) as T;
}
